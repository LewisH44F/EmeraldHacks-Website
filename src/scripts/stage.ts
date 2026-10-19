// stage.ts — a tiny shared notebook that lets the astronaut (flights.ts) and the dragon (dragon.ts) coordinate
// one rule: one of them should always be on screen.
//
// How: each one records when it's flying, and while it's resting it leaves a "wake me up" function here.
// When either finishes a trip, it wakes the other one up, so the next flight is already entering as this one
// leaves (tag-team partners). As a safety net, a watchdog checks 4 times a second whether either is actually
// visible; if the sky is empty, it wakes whoever is resting.

const flying = new Set<string>();
const wakers = new Map<string, () => void>();
const PARTNER: Record<string, string> = { astronaut: "dragon", dragon: "astronaut" };

export function setFlying(name: string, isFlying: boolean) {
  if (isFlying) flying.add(name);
  else flying.delete(name);
}

export function isFlying(name: string) {
  return flying.has(name);
}

// While resting, a flyer registers how to wake it (or null when it's no longer resting).
export function setWaker(name: string, wake: (() => void) | null) {
  if (wake) wakers.set(name, wake);
  else wakers.delete(name);
}

// Called by a flyer the moment its trip ends: if its partner is resting, it takes off right away.
export function wakePartner(name: string) {
  const partner = PARTNER[name];
  if (partner) wakers.get(partner)?.();
}

// A pause that ends early if the partner wakes us. Used by flights.ts for the astronaut's rests.
export function rest(name: string, ms: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      window.clearTimeout(timer);
      setWaker(name, null);
      resolve();
    };
    const timer = window.setTimeout(done, ms);
    setWaker(name, done);
  });
}

// Each partner registers how to check whether it's visible on screen right now.
const visibleChecks = new Map<string, () => boolean>();
export function setVisibleCheck(name: string, check: () => boolean) {
  visibleChecks.set(name, check);
}

// The watchdog. Two getBoundingClientRect() calls every 250ms is negligible work.
window.setInterval(() => {
  if (document.hidden || visibleChecks.size === 0) return;
  for (const check of visibleChecks.values()) if (check()) return; // someone's on screen: all good
  wakers.forEach((wake) => wake()); // empty sky: wake everyone who's resting
}, 250);

// Shared helper: is this element's box at least partly on screen?
export function onScreen(el: Element) {
  const r = el.getBoundingClientRect();
  return r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight;
}
