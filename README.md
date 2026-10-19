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
- `date.start` / `date.end` — ISO strings with timezone, e.g. `"2026-03-14T09:00:00-07:00"`. While `start` is `null`, the countdown is hidden.
- `venue` — `name`, `address`, `mapUrl`; each can be confirmed independently.
- `cost`, `eligibility` — short phrases, or `null` for TBA.
- `links` — form URLs, Instagram, email, code of conduct. Empty `""` hides that link.
- **`registrationOpen`** — `false` shows "Join interest list"; `true` shows "Register". Both use `links.register`. If `links.register` is empty, the button shows a non-clickable "Sign-ups soon".
- **`showFiscalSponsor`** — keep `false` until Hack Club HCB approves us. While `false`, no HCB branding appears anywhere.
- `scheduleConfirmed` — `false` labels the schedule "Tentative".
- `tracks`, `schedule`, `sponsors`, `faq`, `team` — lists; add or remove entries.

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
│   ├── components/        ← reusable pieces: Nav, Section wrapper, Footer
│   ├── lib/sections.ts    ← the nav links / section ids (keeps them in sync)
│   ├── lib/cta.ts         ← decides what the Register button says and where it goes
│   ├── layouts/Base.astro ← shared <html>/<head> shell + skip link
│   ├── pages/index.astro  ← the single page
│   └── styles/global.css  ← Tailwind import + theme variables
├── public/                ← files served as-is (favicon, sponsor logos, team photos)
│   ├── sponsors/
│   └── team/
├── astro.config.mjs       ← Astro + Tailwind settings
├── netlify.toml           ← Netlify build settings
└── package.json
```

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
