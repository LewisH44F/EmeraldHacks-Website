// dragon.ts — flies the Aeronaut dragon (SkyDragon.astro) around the background.
//
// HOW IT WORKS ("follow the leader")
//   1. Only the HEAD is steered. Each frame it moves forward a little and turns a little, like steering a car,
//      so its path is always a smooth curve.
//   2. Every frame I record where the head was. That recording is a trail of points behind the head.
//   3. Each body segment is placed ON that trail, a fixed distance behind the head, and rotated to match the
//      trail's direction at that spot. So the body goes exactly where the head went: when the head flies a
//      circle, the body coils into the circle and then follows the head back out of it.
//
// STUNTS (picked at random on each trip)
//   • "reverse loop": the head turns one and a half circles (540°), so the dragon twists through a full
//     loop-de-loop and exits heading the OPPOSITE way, head first, with the body following.
//   • "loop": one full circle (360°), then carries on in the same direction.
//   • none: a plain winding glide across the screen.
//   The loop's size is matched to the dragon's length, so the body just about fills the circle.
//
// STAYING UPRIGHT
//   The art faces right. Flying left, it would be upside down, so it rolls over (a vertical flip that
//   eases through 0, which looks like a 3D roll). The roll is recorded on the trail too, so it ripples
//   down the body from head to tail like a twist. During a loop it doesn't roll.
//
// It never stops on its own: it pauses only when the tab is hidden. For "reduce motion" users it rests in a
// still S-curve. Loaded once by src/layouts/Base.astro.

import { isFlying, onScreen, setFlying, setVisibleCheck, setWaker, wakePartner } from "./stage";

const root = document.querySelector<HTMLElement>("[data-dragon]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// ---------------------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------------------
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
// Smallest signed difference between two angles (radians), in the range -π..π.
const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

if (root) {
  // Parts are in the HTML tail-first (so the head draws on top). I want them head-first here.
  const parts = [...root.querySelectorAll<HTMLElement>("[data-part]")].reverse();

  // -------------------------------------------------------------------------------------------------------
  // Body layout: how far (in em) each part's center sits behind the head's center, measured along the body.
  // -------------------------------------------------------------------------------------------------------
  const offsetsEm: number[] = [];
  {
    let d = 0;
    let prevSize = 0;
    parts.forEach((p, i) => {
      const kind = p.dataset.part;
      const size = Number(p.dataset.size ?? 0);
      if (kind === "head") d = 0;
      else if (kind === "seg" && prevSize === 0) d = 3.4; // neck: first segment tucks under the back of the head
      else if (kind === "seg") d += 0.7 * ((size + prevSize) / 2); // neighbours overlap by ~45%
      else d += 2.3; // tail fin
      offsetsEm[i] = d;
      if (kind === "seg") prevSize = size;
    });
  }
  const lengthEm = offsetsEm[offsetsEm.length - 1]! + 2;

  // -------------------------------------------------------------------------------------------------------
  // Sizing: the dragon's length is a share of the screen width, so it fits (and has room to roam) on any
  // screen: ~245px on a phone, up to 640px on a big monitor.
  // -------------------------------------------------------------------------------------------------------
  let vw = 0;
  let vh = 0;
  let em = 1; // pixels per em
  let lengthPx = 0;
  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    lengthPx = clamp(vw * 0.62, 240, 640);
    em = lengthPx / lengthEm;
    root!.style.fontSize = `${em}px`;
  }

  // -------------------------------------------------------------------------------------------------------
  // The trail: recorded head positions (x, y), the roll at that moment, and the running distance travelled.
  // -------------------------------------------------------------------------------------------------------
  let tx: number[] = [];
  let ty: number[] = [];
  let tr: number[] = [];
  let tdist: number[] = [];

  function resetTrail(x: number, y: number, heading: number, roll: number) {
    // Lay a straight trail out behind the head so the body is fully formed from the first frame.
    tx = [];
    ty = [];
    tr = [];
    tdist = [];
    const back = lengthPx + 60;
    for (let s = back; s >= 0; s -= 4) {
      tx.push(x - Math.cos(heading) * s);
      ty.push(y - Math.sin(heading) * s);
      tr.push(roll);
      tdist.push(back - s);
    }
  }

  function record(x: number, y: number, roll: number) {
    const last = tx.length - 1;
    const step = Math.hypot(x - tx[last]!, y - ty[last]!);
    if (step < 1) return; // don't record tiny moves; keeps the trail short
    tx.push(x);
    ty.push(y);
    tr.push(roll);
    tdist.push(tdist[last]! + step);
    // Forget trail points the tail has already passed.
    const keepFrom = tdist[tdist.length - 1]! - lengthPx - 80;
    let cut = 0;
    while (cut < tdist.length - 2 && tdist[cut + 1]! < keepFrom) cut++;
    if (cut > 64) {
      tx = tx.slice(cut);
      ty = ty.slice(cut);
      tr = tr.slice(cut);
      tdist = tdist.slice(cut);
    }
  }

  // The point on the trail `d` pixels behind the head (interpolated between recorded points).
  function sample(d: number) {
    const target = tdist[tdist.length - 1]! - d;
    let lo = 0;
    let hi = tdist.length - 1;
    if (target <= tdist[0]!) return { x: tx[0]!, y: ty[0]!, r: tr[0]!, i: 0 };
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (tdist[mid]! < target) lo = mid;
      else hi = mid;
    }
    const t = (target - tdist[lo]!) / (tdist[hi]! - tdist[lo]! || 1);
    return {
      x: tx[lo]! + (tx[hi]! - tx[lo]!) * t,
      y: ty[lo]! + (ty[hi]! - ty[lo]!) * t,
      r: tr[lo]! + (tr[hi]! - tr[lo]!) * t,
      i: lo,
    };
  }

  // Draw every part at its spot on the trail.
  function render() {
    for (let i = 0; i < parts.length; i++) {
      const d = offsetsEm[i]! * em;
      const p = sample(d);
      // Direction of the trail here: from a point slightly behind to a point slightly ahead.
      const ahead = sample(Math.max(0, d - 6));
      const behind = sample(d + 6);
      const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
      // Roll: scaleY from +1 (upright) to -1 (flipped). I keep it at least 0.4 thick mid-roll: thinner than that,
      // the twisting stretch of body looked like a broken stick instead of a serpent rolling over.
      const sy = p.r >= 0 ? Math.max(p.r, 0.4) : Math.min(p.r, -0.4);
      parts[i]!.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) rotate(${angle.toFixed(4)}rad) scaleY(${sy.toFixed(3)}) translate(-50%, -50%)`;
    }
  }

  // -------------------------------------------------------------------------------------------------------
  // The head's flight state
  // -------------------------------------------------------------------------------------------------------
  type Stunt = "reverse" | "loop" | "none";
  const head = {
    x: 0,
    y: 0,
    heading: 0, // radians; 0 = right, π = left, -π/2 = up (screen y grows downward)
    speed: 150, // px per second
    roll: 1,
    wobbleT: 0, // clock for the gentle side-to-side weave
    stunt: "none" as Stunt,
    stuntDone: false,
    handedOff: false, // has it already told the astronaut to come out this trip?
    turning: 0, // radians still to turn in the current loop (0 = not looping)
    turnRate: 0, // radians per second while looping
  };
  let flying = false;

  function startTrip() {
    measure();
    const fromLeft = Math.random() < 0.5;
    // Start with the head's center just past the edge, so its snout pokes in almost immediately.
    head.x = fromLeft ? -em * 3 : vw + em * 3;
    head.y = rand(0.2, 0.7) * vh;
    head.heading = (fromLeft ? 0 : Math.PI) + rand(-0.25, 0.25);
    // Faster on wide screens so the trip doesn't drag; ~105–150 px/s on phones, up to ~250 on desktops.
    head.speed = clamp(vw * 0.17, 105, 210) * rand(0.9, 1.2);
    head.roll = Math.cos(head.heading) >= 0 ? 1 : -1;
    head.wobbleT = rand(0, 10);
    head.turning = 0;
    head.stuntDone = false;
    head.handedOff = false;
    // The reverse loop is the signature move, so it's the most likely.
    const r = Math.random();
    head.stunt = r < 0.55 ? "reverse" : r < 0.85 ? "loop" : "none";
    resetTrail(head.x, head.y, head.heading, head.roll);
    flying = true;
    setFlying("dragon", true);
    setWaker("dragon", null);
  }

  function beginLoop() {
    const goingRight = Math.cos(head.heading) >= 0;
    // Loop UP and over: when flying right that's turning counter-clockwise (heading decreasing on screen).
    let dir = goingRight ? -1 : 1;
    // Circle size: its circumference ≈ the body length, so the dragon coils neatly into it.
    let radius = clamp(lengthPx / 5.2, 42, vh * 0.22);
    // Not enough room above? Loop downward instead.
    if (head.y - radius * 2 < vh * 0.05) dir = -dir;
    if (head.y + radius * 2 > vh * 0.95 && dir === (goingRight ? 1 : -1)) radius = Math.max(38, (vh * 0.9 - head.y) / 2);
    const total = head.stunt === "reverse" ? Math.PI * 3 : Math.PI * 2;
    head.turning = total;
    head.turnRate = (dir * head.speed) / radius;
  }

  function step(dt: number) {
    head.wobbleT += dt;

    // 1) Decide how much to turn this frame.
    let turn = 0;
    if (head.turning > 0) {
      // Mid-loop: turn at a constant rate around the circle.
      turn = head.turnRate * dt;
      head.turning -= Math.abs(turn);
      if (head.turning <= 0) {
        head.turning = 0;
        head.stuntDone = true;
      }
    } else {
      // Cruising: a gentle weave (sine) for a fluid, serpentine path...
      turn += Math.sin(head.wobbleT * 1.9) * 0.55 * dt;
      // ...plus a soft pull back toward a level heading in the current direction of travel...
      const level = Math.cos(head.heading) >= 0 ? 0 : Math.PI;
      turn += angleDiff(level, head.heading) * 0.9 * dt;
      // ...plus a nudge away from the top/bottom edges so it stays on screen.
      const goingRight = Math.cos(head.heading) >= 0;
      if (head.y < vh * 0.12) turn += (goingRight ? 1 : -1) * 1.2 * dt;
      if (head.y > vh * 0.85) turn += (goingRight ? -1 : 1) * 1.2 * dt;

      // Start the stunt once the head is well onto the screen (between 30% and 65% across).
      if (head.stunt !== "none" && !head.stuntDone && head.x > vw * 0.3 && head.x < vw * 0.65) beginLoop();
    }
    head.heading += turn;

    // 2) Move forward.
    head.x += Math.cos(head.heading) * head.speed * dt;
    head.y += Math.sin(head.heading) * head.speed * dt;

    // 3) Roll upright for the direction of travel (but hold the roll steady during a loop).
    if (head.turning === 0) {
      const target = Math.cos(head.heading) >= 0 ? 1 : -1;
      const maxChange = 3.4 * dt; // a full roll takes ~0.6s
      head.roll += clamp(target - head.roll, -maxChange, maxChange);
    }

    record(head.x, head.y, head.roll);

    // 4) Trip over once the whole dragon (tail included) has left the screen.
    const tail = sample(lengthPx);
    const margin = 20;
    const off = (px: number, py: number) => px < -margin || px > vw + margin || py < -margin || py > vh + margin;
    // "Leaving" = off-screen AND pointed away from the screen. Without the second part, a trip could end on its
    // very first frame, because the dragon STARTS just off-screen (pointed inward).
    const leaving =
      (head.x < 0 && Math.cos(head.heading) < 0) ||
      (head.x > vw && Math.cos(head.heading) > 0) ||
      (head.y < 0 && Math.sin(head.heading) < 0) ||
      (head.y > vh && Math.sin(head.heading) > 0);
    // Tag-team: as soon as the head leaves the screen on its way out, wake the astronaut, so he's entering
    // while the body is still trailing off screen.
    if (!head.handedOff && head.turning === 0 && leaving && off(head.x, head.y)) {
      head.handedOff = true;
      wakePartner("dragon");
    }
    if (head.turning === 0 && leaving && off(head.x, head.y) && off(tail.x, tail.y)) {
      flying = false;
      setFlying("dragon", false);
    }
  }

  // -------------------------------------------------------------------------------------------------------
  // Main loop
  // -------------------------------------------------------------------------------------------------------
  let last = 0;
  let restUntil = 0;
  let rafId = 0;

  function frame(now: number) {
    rafId = requestAnimationFrame(frame);
    // Seconds since last frame, capped so a hiccup (or returning to the tab) doesn't teleport the dragon.
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    if (!flying) {
      if (now < restUntil) return;
      startTrip();
    }
    step(dt);
    render();
    if (!flying) {
      // Tag-team with the astronaut: wake it if it's resting. Then take a short rest if the astronaut is out
      // there, or come right back if the screen would otherwise be empty. The astronaut can wake us early.
      wakePartner("dragon");
      restUntil = now + (isFlying("astronaut") ? rand(1500, 5000) : 400);
      setWaker("dragon", () => (restUntil = 0));
      // Park everything off-screen until the next trip.
      parts.forEach((p) => (p.style.transform = "translate3d(-9999px, 0, 0)"));
    }
  }

  // A still pose for "reduce motion": a gentle S-curve resting near the top-left, facing right.
  // I build a trail by hand (left to right, so the head is at the right end) and draw the body on it once.
  function restPose() {
    measure();
    const x0 = vw * 0.04;
    const y0 = vh * 0.16;
    tx = [];
    ty = [];
    tr = [];
    tdist = [];
    let dist = 0;
    for (let s = 0; s <= lengthPx + 60; s += 4) {
      const x = x0 + s;
      const y = y0 + Math.sin(s / (lengthPx / 2.2)) * em * 2.2;
      if (tx.length) dist += Math.hypot(x - tx[tx.length - 1]!, y - ty[ty.length - 1]!);
      tx.push(x);
      ty.push(y);
      tr.push(1);
      tdist.push(dist);
    }
    render();
  }

  function start() {
    cancelAnimationFrame(rafId);
    if (reduceMotion.matches) {
      flying = false;
      setFlying("dragon", false);
      restPose();
      return;
    }
    // A short head start so the page's text appears first; the astronaut goes first, the dragon soon after.
    restUntil = performance.now() + 1500;
    last = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  // For the shared watchdog in stage.ts: the dragon is visible if its head or tail is on screen.
  setVisibleCheck("dragon", () => onScreen(parts[0]!) || onScreen(parts[parts.length - 1]!) || onScreen(parts[Math.floor(parts.length / 2)]!));

  measure();
  start();
  reduceMotion.addEventListener("change", start);
  // Keep the size right if the window is resized or a phone is rotated (applies from the next trip, or
  // immediately for the still pose).
  window.addEventListener("resize", () => {
    if (reduceMotion.matches) restPose();
  });
}
