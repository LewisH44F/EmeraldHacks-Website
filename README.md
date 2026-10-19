# Aerohacks

> **Draft README (Phase 1).** I'll finalize it in Phase 6 so it matches the finished code.

## What this is

Aerohacks is Dublin's first 12-hour high school hackathon, run by the Computer Science Honor Society (CSHS) at Emerald High. This repo is the event website: a single page that explains the event to students, parents, and sponsors, and sends them to our registration and sponsor forms. It's a static site — no backend, no database, no student data stored by us.

## Live site

TBA — `https://<our-site>.netlify.app` once Netlify is connected.

## Tech stack

- **Astro** — turns my components and the config file into plain HTML at build time. I picked it because the site is content, not an app, so it ships almost no JavaScript and loads fast.
- **Tailwind CSS** — styling with small utility classes in the HTML. I picked it so styles live next to the markup they affect and we don't fight a giant stylesheet.
- **Netlify** — hosts the built files and rebuilds the site every time we push to `main`. Free for a site this size.

## Run it locally

1. Install **Node.js 22.22.0 or newer** (Astro 7 requires it). If you use `nvm`: `nvm install` (it reads `.nvmrc`).
2. `npm install`
3. `npm run dev`
4. Open **http://localhost:4321**. The page reloads when you save a file.

`npm run build` makes the production version in `dist/`; `npm run preview` serves it. `npm run check` catches typos in `event.ts` (like a misspelled sponsor tier) before you push.

## How to update event info

**Edit only `src/content/event.ts`.** Every fact on the site comes from that file.

- **`null` means "not confirmed".** The site shows "TBA" for it. Never type a guess for a date, venue, or prize.
- `date.start` / `date.end` — ISO strings with timezone, e.g. `"2026-03-14T09:00:00-07:00"`. The site always displays them in Pacific time. While `start` is `null`, the hero says "TBA" and the countdown is hidden.
  - **Offset gotcha:** use `-07:00` for dates during daylight saving time (mid-March to early November) and `-08:00` otherwise. A wrong offset shifts every displayed time by an hour. After editing, check that the hero shows the time you meant.
  - If the date isn't a valid ISO string (e.g. `"March 13th"`), the site falls back to "TBA" rather than breaking.
  - The countdown counts to the start, then to the end ("Hacking ends in") during the event, then shows a thank-you message.
- `venue` — `name`, `address`, `mapUrl`; each can be confirmed independently.
- `cost`, `eligibility` — short phrases, or `null` for TBA.
- `beginnerFriendly` — `true` adds "None needed. Beginners welcome." to the About facts.
- `about` — the About paragraphs (one string per paragraph).
- `sponsorPitch` — bullet points in the "Why sponsor" box. No made-up numbers.
- `marquee` — the words in the big sideways-scrolling bands. Decorative only; keep facts out of them.
- `links` — form URLs, Instagram, email, code of conduct. Empty `""` hides that link.
- **`registrationOpen`** — `false` shows "Join interest list"; `true` shows "Register". Both use `links.register`. If `links.register` is empty, the button shows a non-clickable "Sign-ups soon".
- **`showFiscalSponsor`** — keep `false` until Hack Club HCB approves us. While `false`, no HCB branding appears anywhere.
- `scheduleConfirmed` — `false` labels the schedule "Tentative".
- `tracks`, `schedule`, `sponsors`, `faq`, `team` — lists; add or remove entries. An empty list shows a "coming soon" message instead of a blank section.
- `links.sponsorForm` — if empty, "Become a sponsor" falls back to emailing `links.email`; if both are empty it shows "Sponsor info coming soon".

Example — the date gets confirmed:

```ts
date: {
  start: "2026-03-14T08:00:00-07:00",
  end: "2026-03-14T20:00:00-07:00",
},
```

## Project structure

```
aerohacks/
├── src/
│   ├── content/event.ts   ← all event info (the only file most people edit)
│   ├── components/        ← one file per section (Hero, About, Tracks, Schedule, Sponsors, Team, Faq)
│   │                         plus Nav, Footer, Countdown, Section (shared wrapper), CtaButton (shared button),
│   │                         Logo (the dragon), SkyField (animated background), Marquee (sideways bands), Star
│   ├── lib/sections.ts    ← the nav links / section ids (keeps them in sync)
│   ├── lib/cta.ts         ← decides what the Register / Become a sponsor buttons say and where they go
│   ├── lib/format.ts      ← date formatting and the "TBA" fallback
│   ├── layouts/Base.astro ← shared <html>/<head> shell + skip link
│   ├── pages/index.astro  ← the single page
│   └── styles/global.css  ← Tailwind import, brand colors + fonts, glow/animation styles
├── public/                ← files served as-is (favicon, sponsor logos, team photos)
│   ├── sponsors/
│   └── team/
├── astro.config.mjs       ← Astro + Tailwind settings
├── netlify.toml           ← Netlify build settings
└── package.json
```

## Look and feel

- **Colors and fonts** are defined once, in the `@theme` block at the top of `src/styles/global.css`. Change a value there and it updates everywhere. Yellow (`volt`) is reserved for the main sign-up button.
- **The site is dark-only** on purpose; the black theme is the brand.
- **Fonts:** Unbounded (headings) and Inter (body text), installed from npm and served from our own site. Nothing loads from Google.
- **Logo:** `src/components/Logo.astro` is a placeholder line-art Aeronaut dragon. To use an official logo, replace the `<path>` lines in that file, or swap the component for an `<img>`. The favicon is `public/favicon.svg`.
- **Motion:** the animated background (`SkyField.astro`) reacts to scrolling, pointer movement and taps. The marquee bands slide as you scroll, and sections fade in. Visitors with "reduce motion" turned on in their device settings get a still version, and it all still works with JavaScript off.

## Deploying

Pushing to `main` triggers a Netlify build automatically. Check progress under **Deploys** in the Netlify dashboard. Opening a pull request creates a **deploy preview** URL so you can see changes before merging.

## Adding a sponsor / FAQ / team member

*(Expanded in Phase 6.)*

- **Sponsor:** put the logo in `public/sponsors/` (e.g. `acme.svg`), then add `{ name: "Acme", tier: "gold", logo: "/sponsors/acme.svg", url: "https://acme.com" }` to `sponsors`.
- **FAQ:** add `{ q: "...", a: "..." }` to `faq`.
- **Team member:** put a square photo in `public/team/` (optional), then add `{ name: "...", role: "...", photo: "/team/name.jpg" }` (or `photo: null`).

## Contributing

1. `git checkout -b your-change`
2. Make your edit, then `git commit -am "Describe the change"`
3. `git push -u origin your-change` and open a pull request on GitHub. Check the deploy preview before merging.

## Credits

Built by the Computer Science Honor Society at Emerald High School.
