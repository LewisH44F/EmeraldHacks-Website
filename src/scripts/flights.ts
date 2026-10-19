// flights.ts — sends the background flyers (astronaut, Aeronaut dragon, space station) on random trips.
//
// Each flyer is an element with data-flyer="name" (see Astronaut.astro, SkyDragon.astro, Iss.astro). Forever,
// for each one: wait a random pause, pick a random side to enter from, a random height, a random speed, and
// (for the dragon) a random stunt, then fly it across. No two trips are the same.
//
// The movement uses the Web Animations API (element.animate). It's the same engine as CSS animations, so the
// browser runs it smoothly on the GPU, but it lets me choose new start/end points every trip, which plain CSS
// can't do. It works in every current browser: Safari/iOS, Chrome, Edge, Firefox, Samsung Internet.
//
// Loaded once by src/layouts/Base.astro.

type Behavior = "cruise" | "swoop" | "loop" | "uturn";

interface FlyerConfig {
  speed: [number, number]; // pixels per second, min..max (a random value is picked each trip)
  gap: [number, number]; // pause between trips, in ms
  firstDelay: [number, number]; // pause before the very first trip, in ms
  behaviors: Behavior[]; // picked at random each trip (listing one twice makes it twice as likely)
  park: { x: number; y: number }; // where it rests for "reduce motion" users (fractions of the screen)
}

// Tune the flyers here. Speeds are per second, so a phone (narrow screen) sees a quicker crossing than a laptop.
const CONFIG: Record<string, FlyerConfig> = {
  astronaut: {
    speed: [45, 80],
    gap: [2000, 8000],
    firstDelay: [600, 2000],
    behaviors: ["cruise", "swoop"],
    park: { x: 0.86, y: 0.7 },
  },
  dragon: {
    speed: [110, 170],
    gap: [4000, 12000],
    firstDelay: [2500, 5000],
    // "loop" is listed twice: the Rayquaza-style loop-de-loop is the dragon's signature move.
    behaviors: ["cruise", "swoop", "loop", "loop", "uturn"],
    park: { x: 0.28, y: 0.1 },
  },
  iss: {
    speed: [22, 38],
    gap: [10000, 25000],
    firstDelay: [5000, 10000],
    behaviors: ["cruise"],
    park: { x: 0.78, y: 0.08 },
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// ---------------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------------
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const at = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;

// Don't start new trips while the tab is in the background; nobody would see them.
function whenVisible(): Promise<void> {
  if (!document.hidden) return Promise.resolve();
  return new Promise((resolve) => {
    const onChange = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", onChange);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

// Resolves when the "reduce motion" setting changes, so a parked flyer can take off again if it's turned off.
function whenMotionSettingChanges(): Promise<void> {
  return new Promise((resolve) => reduceMotion.addEventListener("change", () => resolve(), { once: true }));
}

// ---------------------------------------------------------------------------------------------------------
// One trip across the screen
// ---------------------------------------------------------------------------------------------------------
// Every animation started for the current trip, so they can all be cancelled at once
// (e.g. if the visitor turns on "reduce motion" mid-flight).
const running = new Map<HTMLElement, Animation[]>();

async function trip(el: HTMLElement, cfg: FlyerConfig) {
  const face = el.querySelector<HTMLElement>(".flyer-face");
  const spin = el.querySelector<HTMLElement>(".dragon-spin");
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Random direction. Start and end just outside the screen so it glides in and out.
  const ltr = Math.random() < 0.5;
  const startX = ltr ? -w - 30 : vw + 30;
  const endX = ltr ? vw + 30 : -w - 30;

  // Random heights, kept mostly on screen: from near the top down to where the flyer's bottom edge stays visible.
  const minY = vh * 0.04 - h * 0.2;
  const maxY = vh - h * 0.85;
  const y0 = clamp(rand(minY, maxY), minY, maxY);
  const y1 = clamp(y0 + rand(-0.3, 0.3) * vh, minY, maxY);

  const speed = rand(...cfg.speed);
  const behavior = pick(cfg.behaviors);

  // Every flyer is drawn facing right; mirror it when flying left.
  const facing = ltr ? 1 : -1;
  if (face) face.style.transform = `scaleX(${facing})`;

  const anims: Animation[] = [];
  let keyframes: Keyframe[];
  let duration: number;

  if (behavior === "uturn") {
    // Fly in 55–80% of the way, swoop up while turning around, and fly back out the side it came from.
    const turnX = ltr ? rand(0.55, 0.8) * vw - w / 2 : rand(0.2, 0.45) * vw - w / 2;
    const yTurn = clamp(y0 - rand(0.12, 0.25) * vh, minY, maxY);
    duration = ((Math.abs(turnX - startX) * 2) / speed) * 1000;
    keyframes = [
      { transform: at(startX, y0) },
      { transform: at(turnX, yTurn), offset: 0.5, easing: "ease-in" },
      { transform: at(startX, y1) },
    ];
    // The turn-around: squash the mirror to almost nothing and open it out the other way. In 2D that reads
    // as the dragon rolling over to face the other direction.
    if (face) {
      anims.push(
        face.animate(
          [
            { transform: `scaleX(${facing})` },
            { transform: `scaleX(${facing})`, offset: 0.46 },
            { transform: `scaleX(${facing * 0.05})`, offset: 0.5 },
            { transform: `scaleX(${-facing})`, offset: 0.54 },
            { transform: `scaleX(${-facing})` },
          ],
          { duration, fill: "forwards" },
        ),
      );
    }
  } else if (behavior === "loop") {
    // Glide in, nearly hover while doing a full loop-de-loop around the middle of the body, then carry on.
    // The x keyframes slow down between 40% and 62% of the trip, which is when the spin happens.
    duration = (Math.abs(endX - startX) / speed) * 1000 * 1.35;
    const xAt = (t: number) => startX + (endX - startX) * t;
    keyframes = [
      { transform: at(startX, y0) },
      { transform: at(xAt(0.42), y0 + (y1 - y0) * 0.42), offset: 0.4 },
      { transform: at(xAt(0.5), y0 + (y1 - y0) * 0.5 - vh * 0.06), offset: 0.62 },
      { transform: at(endX, y1) },
    ];
    // -360deg = counter-clockwise, so when flying right it loops UP and over first. Inside the mirrored
    // .flyer-face the same value loops the correct way when flying left, too.
    if (spin) {
      anims.push(
        spin.animate(
          [
            { transform: "rotate(0deg)" },
            { transform: "rotate(0deg)", offset: 0.4 },
            { transform: "rotate(-360deg)", offset: 0.62, easing: "ease-in-out" },
            { transform: "rotate(-360deg)" },
          ],
          { duration, fill: "forwards" },
        ),
      );
    }
  } else if (behavior === "swoop") {
    // A big, smooth dip (or rise) through the middle of the screen, like riding a wave of air.
    duration = (Math.abs(endX - startX) / speed) * 1000;
    const dip = rand(0.15, 0.3) * vh * (Math.random() < 0.5 ? 1 : -1);
    const mid = clamp((y0 + y1) / 2 + dip, minY, maxY);
    keyframes = [
      { transform: at(startX, y0), easing: "ease-in-out" },
      { transform: at((startX + endX) / 2, mid), easing: "ease-in-out" },
      { transform: at(endX, y1) },
    ];
  } else {
    // "cruise": a straight, gently slanted glide.
    duration = (Math.abs(endX - startX) / speed) * 1000;
    keyframes = [{ transform: at(startX, y0) }, { transform: at(endX, y1) }];
  }

  const flight = el.animate(keyframes, { duration, fill: "forwards", easing: "linear" });
  anims.push(flight);
  running.set(el, anims);

  try {
    await flight.finished;
  } finally {
    // Clean up: park it off-screen, reset its mirror/spin, and release the finished animations.
    running.delete(el);
    el.style.transform = at(-w - 200, -h - 200);
    anims.forEach((a) => a.cancel());
  }
}

// Places a flyer still, on screen, for "reduce motion" users.
function park(el: HTMLElement, cfg: FlyerConfig) {
  const face = el.querySelector<HTMLElement>(".flyer-face");
  if (face) face.style.transform = "scaleX(1)";
  const x = cfg.park.x * window.innerWidth - el.offsetWidth / 2;
  el.style.transform = at(clamp(x, 8, window.innerWidth - el.offsetWidth - 8), cfg.park.y * window.innerHeight);
}

// ---------------------------------------------------------------------------------------------------------
// The forever-loop for one flyer
// ---------------------------------------------------------------------------------------------------------
async function fly(el: HTMLElement, cfg: FlyerConfig) {
  // The staggered first delay only applies to flying; "reduce motion" users see everything parked right away.
  if (!reduceMotion.matches) await sleep(rand(...cfg.firstDelay));
  for (;;) {
    if (reduceMotion.matches) {
      park(el, cfg);
      await whenMotionSettingChanges();
      continue;
    }
    await whenVisible();
    try {
      await trip(el, cfg);
    } catch {
      // A cancelled trip (e.g. reduce motion turned on mid-flight) lands here; the loop just carries on.
    }
    // Skip the pause if reduce motion was just switched on, so the flyer parks right away.
    if (!reduceMotion.matches) await sleep(rand(...cfg.gap));
  }
}

// If the visitor switches "reduce motion" on mid-flight, stop every flight immediately.
reduceMotion.addEventListener("change", () => {
  if (reduceMotion.matches) running.forEach((anims) => anims.forEach((a) => a.cancel()));
});

// Start every flyer on the page. Older browsers without element.animate (pre-2020) simply keep them hidden.
if (typeof Element.prototype.animate === "function") {
  document.querySelectorAll<HTMLElement>("[data-flyer]").forEach((el) => {
    const cfg = CONFIG[el.dataset.flyer ?? ""];
    if (cfg) void fly(el, cfg);
  });
}
