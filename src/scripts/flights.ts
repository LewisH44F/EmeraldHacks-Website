// flights.ts — sends the astronaut (Astronaut.astro) and the satellite (Satellite.astro) on random trips
// across the background.
//
// Each flyer is an element with data-flyer="name". Forever, for each one: wait a pause, pick a random side to
// enter from, random heights, a random speed, and a random path shape, then fly it across. No two trips match.
// The astronaut only pauses briefly between trips, so he's on screen most of the time; the satellite passes
// by now and then.
//
// The movement uses the Web Animations API (element.animate): the same engine as CSS animations, so the browser
// runs it on the GPU (smooth, light on phones), but I can choose new points every trip. Works in all current
// browsers, Safari/iOS included. Loaded once by src/layouts/Base.astro.

type PathShape = "glide" | "swoop" | "zigzag" | "diagonal";

interface FlyerConfig {
  speed: [number, number]; // pixels per second, min..max
  gap: [number, number]; // pause between trips, ms
  firstDelay: [number, number]; // pause before the first trip, ms
  shapes: PathShape[]; // picked at random each trip
  park: { x: number; y: number }; // where it rests for "reduce motion" users (fractions of the screen)
}

const CONFIG: Record<string, FlyerConfig> = {
  astronaut: {
    speed: [55, 95],
    gap: [600, 2000],
    firstDelay: [300, 800],
    shapes: ["glide", "swoop", "zigzag", "diagonal"],
    park: { x: 0.86, y: 0.7 },
  },
  satellite: {
    speed: [30, 55],
    gap: [6000, 15000],
    firstDelay: [3000, 6000],
    shapes: ["glide", "diagonal"],
    park: { x: 0.12, y: 0.12 },
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

// Resolves when the "reduce motion" setting changes, so a parked flyer can take off if it's turned off.
function whenMotionSettingChanges(): Promise<void> {
  return new Promise((resolve) => reduceMotion.addEventListener("change", () => resolve(), { once: true }));
}

// ---------------------------------------------------------------------------------------------------------
// One trip
// ---------------------------------------------------------------------------------------------------------
const running = new Map<HTMLElement, Animation>();

async function trip(el: HTMLElement, cfg: FlyerConfig) {
  const face = el.querySelector<HTMLElement>(".flyer-face");
  // Sizes are read once per trip (not every frame), so this costs nothing noticeable.
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
  try {
    await flight.finished;
  } finally {
    running.delete(el);
    el.style.transform = at(-w - 300, -h - 300);
    flight.cancel();
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
      // A cancelled trip (e.g. reduce motion switched on mid-flight) lands here; the loop carries on.
    }
    // Skip the pause if reduce motion was just switched on, so the flyer parks right away.
    if (!reduceMotion.matches) await sleep(rand(...cfg.gap));
  }
}

// If the visitor switches "reduce motion" on mid-flight, stop every flight immediately.
reduceMotion.addEventListener("change", () => {
  if (reduceMotion.matches) running.forEach((a) => a.cancel());
});

// Start every flyer on the page. Very old browsers without element.animate simply keep them hidden.
if (typeof Element.prototype.animate === "function") {
  document.querySelectorAll<HTMLElement>("[data-flyer]").forEach((el) => {
    const cfg = CONFIG[el.dataset.flyer ?? ""];
    if (cfg) void fly(el, cfg);
  });
}
