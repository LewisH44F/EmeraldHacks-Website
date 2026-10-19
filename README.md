# Aerohacks

## What this is

Aerohacks is Dublin's first 12-hour high school hackathon, run by the Computer Science Honor Society (CSHS) at Emerald High. This repo is the event website: a single page that explains the event to students, parents, and sponsors, and sends them to our registration and sponsor forms. It's a static site: no backend, no database, and no student data stored by us. Sign-ups go through an outside form (Google Forms, Tally, etc.) because our attendees are minors and I don't want us holding their personal data on something we built ourselves.

## Live site

**https://aerohacks.netlify.app**

## Tech stack

- **Astro** turns my components and the config file into plain HTML at build time. I picked it because the site is content, not an app, so it ships very little JavaScript and loads fast.
- **Tailwind CSS** handles styling with small utility classes written right in the HTML. I picked it so styles live next to the markup they affect, and our brand colors are defined in one place.
- **Netlify** hosts the built files and rebuilds the site every time we push to `main`. It's free for a site this size.

## Run it locally

1. Install **Node.js 22.22.0 or newer** (Astro 7 requires it). If you use `nvm`, run `nvm install` in this folder; it reads the version from `.nvmrc`.
2. `npm install`
3. `npm run dev`
4. Open **http://localhost:4321**. The page reloads every time you save a file.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run check` | Catches mistakes in `event.ts` (like a misspelled sponsor tier or a deleted field) **before** you push. Run it after every config edit. |
| `npm run build` | Builds the production site into `dist/`. This is exactly what Netlify runs. |
| `npm run preview` | Serves the built `dist/` folder so you can check the real build locally. |

## How to update event info

**Edit only `src/content/event.ts`.** Every fact on the site comes from that file; you never need to touch component code to change event details. Every field also has a comment in the file itself.

### The golden rule: `null` means "not confirmed"

If something isn't confirmed, set it to `null` (or leave a list empty). The site shows **"TBA"** or a "coming soon" message instead. Never type in a guess for a date, venue, prize, or policy "just as a placeholder". Parents and students will believe it.

### Fields

| Field | What it controls | When empty / `null` |
| --- | --- | --- |
| `name`, `tagline` | Title in the hero, nav, browser tab, and link previews | Tagline line is hidden |
| `date.start`, `date.end` | Hero date/time, schedule date, countdown | "TBA", no countdown |
| `venue.name`, `.address`, `.mapUrl` | "Where" box in the hero; each part can be confirmed separately | "TBA" / hidden |
| `cost`, `eligibility` | "Cost" and "Who" in the About facts | "TBA" |
| `beginnerFriendly` | `true` adds "None needed. Beginners welcome." to About | Line left out |
| `about` | About paragraphs (one string per paragraph) | Facts box only |
| `sponsorPitch` | Bullet points in the "Why sponsor" box. No made-up numbers. | Box shows just the button |
| `marquee` | Words in the big sliding bands. Decorative only, so keep facts out of them. | Bands hidden |
| `links.register` | Where every Register / Join interest list button goes | Grey "Sign-ups soon" (not clickable) |
| `links.sponsorForm` | Where "Become a sponsor" goes | Falls back to emailing `links.email`; if that's empty too, "Sponsor info coming soon" |
| `links.email`, `.instagram`, `.codeOfConduct` | Footer, FAQ, sponsor links | Hidden |
| `tracks` | Track cards with prizes (`prize: null` → "Prize: TBA") | "Coming soon" card |
| `schedule` | Timeline items, in the order listed | "Posted soon" |
| `sponsors` | Logos grouped by tier | "Want your logo here first?" |
| `team` | Organizer cards | "Meet the organizers soon" |
| `faq` | Questions and answers | "Coming soon" |

### The three switches

- **`registrationOpen`**: `false` makes the buttons say "Join interest list", and `true` makes them say "Register". Both go to `links.register`. Flip it to `true` the day real registration opens.
- **`showFiscalSponsor`**: keep this `false` until Hack Club HCB approves us. While it's `false`, no Hack Club / HCB name or branding appears anywhere. When it's `true`, the footer shows the `fiscalSponsor` line.
- **`scheduleConfirmed`**: `false` puts a "Tentative" label on the schedule. Flip it once times are final.

### Dates: the one thing that's easy to get wrong

Dates are ISO strings **with a timezone offset**, and the site always displays them in Pacific time:

- Use `-07:00` during daylight saving time (mid-March to early November) and `-08:00` otherwise. A wrong offset shifts every time on the site by an hour, so after editing, check that the hero shows the time you meant.
- A date that isn't valid ISO (like `"March 13th"`) just shows "TBA"; it won't break the site.
- The countdown appears automatically once `date.start` is set. It counts to the start, then to the end ("Hacking ends in") during the event, then shows a thank-you message.

### Example edit: the date and venue get confirmed

```ts
date: {
  start: "2027-03-13T08:00:00-08:00",
  end: "2027-03-13T20:00:00-08:00",
},
venue: {
  name: "Emerald High School",
  address: "123 Example St, Dublin, CA",
  mapUrl: "https://maps.google.com/?q=...",
},
```

Save, run `npm run check`, commit, push. The live site updates in about a minute.

## Project structure

```
aerohacks-website/
├── src/
│   ├── content/event.ts      ← ALL event info. The only file most people ever edit.
│   ├── components/           ← reusable pieces of the page:
│   │   ├── Hero, About, Tracks, Schedule, Sponsors, Team, Faq   ← one per section
│   │   ├── Nav, Footer       ← top bar (with mobile menu) and bottom bar
│   │   ├── Section           ← shared wrapper: spacing, "01 / ABOUT" label, heading
│   │   ├── CtaButton         ← the one button style (yellow = sign up)
│   │   ├── Countdown         ← live timer in the hero
│   │   ├── Logo, Star        ← the dragon mark and the little ✦ star, drawn as SVG
│   │   ├── SkyField          ← the interactive animated background
│   │   ├── Astronaut, SkyDragon, Iss   ← the three background flyers (drawings + body animations)
│   │   ├── SpaceScene        ← planet, orbiting satellite, twinkling stars
│   │   └── Marquee           ← the big, endlessly sliding word bands
│   ├── lib/
│   │   ├── sections.ts       ← nav links + section order (keeps nav and page in sync)
│   │   ├── cta.ts            ← decides what the Register / Become a sponsor buttons say and where they go
│   │   └── format.ts         ← date formatting and the "TBA" fallback
│   ├── scripts/flights.ts    ← sends the flyers on random trips (speeds, pauses, dragon stunts)
│   ├── layouts/Base.astro    ← the <html>/<head> shell: SEO + link-preview tags, skip link, site-wide scripts
│   ├── pages/index.astro     ← the single page: stacks the sections in order
│   └── styles/global.css     ← brand colors + fonts (@theme), glow and animation styles
├── public/                   ← files served as-is
│   ├── favicon.svg, apple-touch-icon.png   ← browser tab icon / iPhone home-screen icon
│   ├── og.png                ← 1200×630 link-preview image (iMessage, Instagram, Discord…)
│   ├── robots.txt            ← lets search engines index the site
│   ├── sponsors/             ← sponsor logo files
│   └── team/                 ← organizer photos
├── astro.config.mjs          ← Astro + Tailwind settings, and the site URL
├── netlify.toml              ← Netlify build settings
├── package.json              ← dependencies and the npm commands above (JSON can't hold comments)
└── .nvmrc                    ← the Node version (just the number, no comments allowed)
```

## Look and feel

- **Colors and fonts** are defined once, in the `@theme` block at the top of `src/styles/global.css`. Change a value there and it updates everywhere. Yellow (`volt`) is reserved for the main sign-up button.
- **The site is dark-only** on purpose; the black theme is the brand.
- **Fonts:** Unbounded (headings) and Inter (body text), installed from npm and served from our own site, so nothing loads from Google.
- **Logo:** `src/components/Logo.astro` is a line-art Aeronaut dragon head. To use an official logo, replace the `<path>` lines in that file (and in `public/favicon.svg`), or swap the component for an `<img>`. Also replace `public/og.png` and `public/apple-touch-icon.png`.
- **Motion:**
  - The background mesh (`SkyField.astro`) reacts to scrolling, mouse/finger movement, and taps.
  - The marquee bands (`Marquee.astro`) slide continuously and never stop. To change the speed, edit `70s` in that file (higher = slower).
  - Three flyers cross the screen on **random** trips (random side, height, speed, and pause each time): the jetpack astronaut (`Astronaut.astro`), the Aeronaut sky dragon (`SkyDragon.astro`), and a space station (`Iss.astro`). The dragon randomly cruises, swoops, does Rayquaza-style loop-de-loops, or U-turns and flies back. All of the randomness is tuned in the `CONFIG` block at the top of `src/scripts/flights.ts` (speeds, pauses, which stunts).
  - `SpaceScene.astro` adds a ringed planet in the bottom-right corner (turning cloud bands, glowing atmosphere, particles streaming around both rings), a satellite orbiting it with a blinking light, and twinkling stars.
  - Text-heavy areas (the schedule, the About text) sit on frosted `.readable-panel` backgrounds that dim and blur whatever flies behind them.
  - Sections fade in as you reach them. On phones, cards and schedule rows light up as they cross the middle of the screen (phones can't hover).
  - **"Reduce motion"** (iPhone: Settings → Accessibility → Motion; also on Android, macOS, Windows): the bands still drift, about 3x slower, and the flyers, planet, and stars stay still in place. If the site looks frozen on someone's phone, this setting is the reason.
- **Browser support:** current Safari (Mac + iPhone), Chrome, Edge, Firefox, and Samsung Internet. The floor is set by Tailwind CSS 4: Safari/iOS 16.4+, Chrome/Edge 111+, Firefox 128+. Older browsers still show all the content, just with simpler styling.
- **Link previews:** `public/og.png` is what shows when someone pastes our link into a chat. Replace it with any 1200×630 PNG of the same name.

## Deploying

- Every push to `main` triggers a Netlify build and goes live automatically, usually in about a minute.
- To check a deploy: Netlify dashboard → the **aerohacks** site → **Deploys**. A failed deploy leaves the previous version live, so a broken push never takes the site down. Open the failed deploy to read the build log.
- **Deploy previews:** every pull request gets its own preview URL (Netlify posts it on the PR). Click through it before merging.

## Adding a sponsor / FAQ / team member

**Sponsor**

1. Put the logo file in `public/sponsors/`, e.g. `public/sponsors/acme.svg`. SVG is best; otherwise a PNG at least 400px wide. Logos sit on a light tile, so standard dark-on-white logos work.
2. In `event.ts`, add to `sponsors`:
   ```ts
   { name: "Acme", tier: "gold", logo: "/sponsors/acme.svg", url: "https://acme.com" },
   ```
   `tier` must be `"gold"`, `"silver"`, or `"bronze"` (`npm run check` will complain about anything else). Note the logo path starts at `/sponsors/`, not `/public/sponsors/`.

**FAQ**

1. Add to `faq`: `{ q: "Is there Wi-Fi?", a: "Yes, ..." }`. Questions show in the order listed.

**Team member**

1. Optional: put a square photo (about 400×400) in `public/team/`, e.g. `public/team/jane.jpg`.
2. Add to `team`: `{ name: "Jane Doe", role: "Logistics", photo: "/team/jane.jpg" }`. Use `photo: null` and the site shows their initials instead.

**Track** (when they're decided)

1. Add to `tracks`: `{ name: "Open Skies", description: "Build anything.", prize: null }`. There are example drafts in a comment right above `tracks` in `event.ts`.

## Contributing

1. Make a branch: `git checkout -b your-change`
2. Edit, run `npm run check`, then commit: `git commit -am "Add Acme as a gold sponsor"`
3. Push: `git push -u origin your-change`, then open a pull request on GitHub.
4. Check the Netlify deploy preview on the PR, then merge. Merging to `main` publishes it.

## Credits

Built by the Computer Science Honor Society at Emerald High School.
