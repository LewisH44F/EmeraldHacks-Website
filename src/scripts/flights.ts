// flights.ts — sends the astronaut (Astronaut.astro) and the space station (Iss.astro) on random trips.
// (The dragon has its own, fancier flight engine: dragon.ts.)
//
// Each flyer is an element with data-flyer="name". Forever, for each one: wait a pause, pick a random side to
// enter from, random heights, a random speed, and a random path shape, then fly it across. No two trips match.
//
// Rule shared with dragon.ts (via stage.ts): the astronaut or the dragon should always be on screen. So when
// the astronaut finishes a trip and the dragon isn't out, it heads straight back out instead of resting.
//
// The movement uses the Web Animations API (element.animate): the same engine as CSS animations, so it's smooth
// and GPU-friendly, but I can choose new points every trip. Works in all current browsers, Safari/iOS included.
// Loaded once by src/layouts/Base.astro.

import { isFlying, onScreen, rest, setFlying, setVisibleCheck, wakePartner } from "./stage";

type PathShape = "glide" | "swoop" | "zigzag" | "diagonal";

interface FlyerConfig {
  speed: [number, number]; // pixels per second, min..max
  gap: [number, number]; // normal pause between trips, ms
  firstDelay: [number, number]; // pause before the first trip, ms
  shapes: PathShape[]; // picked at random each trip
  park: { x: number; y: number }; // where it rests for "reduce motion" users (fractions of the screen)
}

const CONFIG: Record<string, FlyerConfig> = {
  astronaut: {
    speed: [55, 95],
    gap: [1500, 5000],
    firstDelay: [300, 800],
    shapes: ["glide", "swoop", "zigzag", "diagonal"],
    park: { x: 0.86, y: 0.7 },
  },
  iss: {
    speed: [25, 45],
    gap: [8000, 20000],
    firstDelay: [4000, 8000],
    shapes: ["glide", "glide", "diagonal"],
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
const at = (x: number, y: number) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

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

function whenMotionSettingChanges(): Promise<void> {
  return new Promise((resolve) => reduceMotion.addEventListener("change", () => resolve(), { once: true }));
}

// ---------------------------------------------------------------------------------------------------------
// One trip
// ---------------------------------------------------------------------------------------------------------
const running = new Map<HTMLElement, Animation>();

async function trip(el: HTMLElement, cfg: FlyerConfig) {
  const face = el.querySelector<HTMLElement>(".flyer-face");
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const ltr = Math.random() < 0.5;
  // Start only just past the edge, so the flyer is visible almost as soon as the trip begins.
  const startX = ltr ? -w * 0.9 : vw - w * 0.1;
  const endX = ltr ? vw + 20 : -w - 20;
  const minY = vh * 0.03;
  const maxY = vh - h * 1.05;
  const randY = () => rand(minY, maxY);
  const shape = pick(cfg.shapes);
  if (face) face.style.transform = `scaleX(${ltr ? 1 : -1})`; // drawn facing right; mirror when flying left

  // Build the path as a list of points. More points = more bends.
  const xAt = (t: number) => startX + (endX - startX) * t;
  let points: [number, number][];
  if (shape === "zigzag") {
    // Three or four random heights: it bobs up and down the whole screen as it crosses.
    const n = Math.random() < 0.5 ? 3 : 4;
    points = Array.from({ length: n + 1 }, (_, i) => [xAt(i / n), randY()] as [number, number]);
  } else if (shape === "swoop") {
    const y0 = randY();
    const y1 = randY();
    const dip = clamp((y0 + y1) / 2 + rand(0.2, 0.4) * vh * (Math.random() < 0.5 ? 1 : -1), minY, maxY);
    points = [
      [startX, y0],
      [xAt(0.5), dip],
      [endX, y1],
    ];
  } else if (shape === "diagonal") {
    // Corner to corner: from near the top to near the bottom, or the other way around.
    const down = Math.random() < 0.5;
    points = [
      [startX, down ? rand(minY, vh * 0.25) : rand(vh * 0.6, maxY)],
      [endX, down ? rand(vh * 0.6, maxY) : rand(minY, vh * 0.25)],
    ];
  } else {
    const y0 = randY();
    points = [
      [startX, y0],
      [endX, clamp(y0 + rand(-0.35, 0.35) * vh, minY, maxY)],
    ];
  }

  // Trip time from the real path length and a random speed. Each bend eases in and out so it flows.
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i]![0] - points[i - 1]![0], points[i]![1] - points[i - 1]![1]);
  const duration = (length / rand(...cfg.speed)) * 1000;
  const keyframes: Keyframe[] = points.map(([x, y], i) => ({
    transform: at(x, y),
    easing: points.length > 2 && i < points.length - 1 ? "ease-in-out" : "linear",
  }));

  const flight = el.animate(keyframes, { duration, fill: "forwards" });
  running.set(el, flight);
  // Tag-team: when the astronaut is 80% of the way across, nudge the dragon so it's already entering
  // while he's still on screen (no empty sky in between).
  const handoff = el.dataset.flyer === "astronaut" ? window.setTimeout(() => wakePartner("astronaut"), duration * 0.8) : 0;
  try {
    await flight.finished;
  } finally {
    window.clearTimeout(handoff);
    running.delete(el);
    el.style.transform = at(-w - 300, -h - 300);
    flight.cancel();
  }
}

function park(el: HTMLElement, cfg: FlyerConfig) {
  const face = el.querySelector<HTMLElement>(".flyer-face");
  if (face) face.style.transform = "scaleX(1)";
  const x = cfg.park.x * window.innerWidth - el.offsetWidth / 2;
  el.style.transform = at(clamp(x, 8, window.innerWidth - el.offsetWidth - 8), cfg.park.y * window.innerHeight);
}

// ---------------------------------------------------------------------------------------------------------
// The forever-loop for one flyer
// ---------------------------------------------------------------------------------------------------------
async function fly(name: string, el: HTMLElement, cfg: FlyerConfig) {
  if (!reduceMotion.matches) await sleep(rand(...cfg.firstDelay));
  for (;;) {
    if (reduceMotion.matches) {
      park(el, cfg);
      await whenMotionSettingChanges();
      continue;
    }
    await whenVisible();
    setFlying(name, true);
    try {
      await trip(el, cfg);
    } catch {
      // A cancelled trip (e.g. reduce motion switched on mid-flight) lands here; the loop carries on.
    } finally {
      setFlying(name, false);
    }
    if (reduceMotion.matches) continue;
    if (name === "astronaut") {
      // Tag-team with the dragon: wake it if it's resting, so one of them is always on screen. If the dragon
      // isn't out at all, come straight back; otherwise rest (the dragon can still wake us early).
      wakePartner("astronaut");
      await rest("astronaut", isFlying("dragon") ? rand(...cfg.gap) : 300);
    } else {
      await sleep(rand(...cfg.gap));
    }
  }
}

reduceMotion.addEventListener("change", () => {
  if (reduceMotion.matches) running.forEach((a) => a.cancel());
});

if (typeof Element.prototype.animate === "function") {
  document.querySelectorAll<HTMLElement>("[data-flyer]").forEach((el) => {
    const name = el.dataset.flyer ?? "";
    const cfg = CONFIG[name];
    if (name === "astronaut") setVisibleCheck("astronaut", () => onScreen(el));
    if (cfg) void fly(name, el, cfg);
  });
}
