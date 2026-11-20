// event.ts — THE file to edit when event details change.
//
// I keep every piece of event info (date, venue, schedule, FAQ, sponsors, team, links) here so anyone on the
// CSHS team can update the site without touching component code. The components just read from this object.
//
// Golden rule: if a fact isn't confirmed yet, set it to `null`. The site will show "TBA" instead.
// Never type in a date, venue, or prize "just as a placeholder" — people will believe it.
//
// After editing, save the file. Locally, `npm run dev` reloads instantly; on GitHub, pushing to `main`
// redeploys the live site on Netlify in about a minute.

// ---------------------------------------------------------------------------------------------------------
// Types
// A "type" describes the shape a piece of data must have. If someone makes a typo (e.g. tier: "gld"),
// the editor and `npm run check` flag it before it reaches the live site. You don't need to edit these.
// ---------------------------------------------------------------------------------------------------------

export type SponsorTier = "platinum" | "gold" | "silver" | "bronze";

export interface Track {
  name: string;
  description: string;
  prize: string | null; // null => "Prize TBA"
}

export interface ScheduleItem {
  time: string; // free text like "9:00 AM" so it reads naturally; not used for any math
  title: string;
  description: string;
}

export interface Sponsor {
  name: string;
  tier: SponsorTier;
  logo: string; // path inside /public, e.g. "/sponsors/acme.svg"
  url: string;
}

// One sponsorship package in the "Sponsorship tiers" table.
export interface SponsorPackage {
  tier: SponsorTier;
  amount: string | null; // e.g. "$500"; null => "TBA"
  perks: string[]; // what this tier gets (each tier's list is shown in full; say "Everything in Silver" to stack)
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Prize {
  place: string; // e.g. "First place", "Best beginner project"
  prize: string | null; // e.g. "$500" or "AirPods"; null => "TBA"
}

export interface Person {
  name: string;
  role: string;
}

// One organizing division: its name, its division leader (lead), and everyone else on it.
export interface Division {
  name: string;
  lead: string;
  members: string[];
}

export interface EventConfig {
  name: string;
  tagline: string;
  date: { start: string | null; end: string | null; approx: string | null; pendingNote: string | null };
  venue: { name: string | null; address: string | null; mapUrl: string | null; pendingNote: string | null };
  cost: string | null;
  eligibility: string | null;
  about: string[];
  sponsorPackages: SponsorPackage[];
  marquee: string[];
  links: {
    register: string;
    instagram: string;
    email: string;
    codeOfConduct: string;
    discord: string;
    linkedin: string;
    prospectus: string;
  };
  registrationOpen: boolean;
  showFiscalSponsor: boolean;
  fiscalSponsor: { name: string; url: string };
  scheduleConfirmed: boolean;
  tracks: Track[];
  prizes: Prize[];
  schedule: ScheduleItem[];
  sponsors: Sponsor[];
  faq: FaqItem[];
  team: { director: Person; divisions: Division[] };
  judges: Person[];
}

// ---------------------------------------------------------------------------------------------------------
// The actual event data — edit below this line.
// ---------------------------------------------------------------------------------------------------------

export const event: EventConfig = {
  // Shown in the nav, hero, browser tab, and link previews.
  name: "Emerald Hacks",

  // One short line under the name in the hero.
  tagline: "12 hours. Build anything.",

  // Start and end as ISO 8601 strings WITH a timezone offset, e.g. "2026-03-14T09:00:00-07:00".
  // I require the offset because Dublin, CA is on Pacific time and visitors' browsers may not be —
  // without it, the countdown could be off by hours. null => "Date TBA" and the countdown is hidden.
  date: {
    start: null,
    end: null,
    // While start is null: a rough timeframe to show instead of a bare "TBA" (e.g. "March 2027"), and a short
    // note under it. Set both to null to show just "TBA". Once start is set, these are ignored.
    approx: "March 2027",
    pendingNote: "Exact date being finalized",
  },

  // Where it happens. Each field is independent: you can confirm the venue name before the address.
  // mapUrl is a Google/Apple Maps link; null => no "Directions" link is shown.
  venue: {
    name: null,
    address: null,
    mapUrl: null,
    // Shown under "TBA" while the venue name is null. null => nothing extra is shown.
    pendingNote: "Location being finalized",
  },

  // What attendees pay, as a short phrase, e.g. "Free". null => "TBA".
  // I made this a field instead of hardcoding "free" because parents will treat whatever we show as a promise.
  cost: "Free",

  // Who can attend, shown as "Who" in the About facts. null => "TBA".
  eligibility: "Anyone, from beginners to advanced, middle schoolers to high schoolers",

  // Paragraphs for the About section, written for beginners AND parents. Each string is one paragraph.
  // I keep this copy here (not in the component) so the team can reword it without touching code.
  about: [
    "Emerald Hacks is a day-long event where students team up and build a project from scratch over the course of 12 hours: an app, a website, a game, a robot, anything. It's a chance to learn something new, make friends, and compete for prizes, whether it's your first time coding or your fiftieth.",
    "It's organized by students in the Computer Science Honor Society at Emerald High School in Dublin, CA, and ends the same evening it starts.",
    // TODO: once confirmed, add a sentence about adult supervision / chaperones. Parents look for this first.
  ],

  // Sponsorship packages, lowest to highest. amount: null => "TBA".
  // DRAFT: these perks are a starting point, not promises yet. Confirm what we can actually deliver (and the
  // prices) before sending this page to sponsors.
  sponsorPackages: [
    { tier: "bronze", amount: null, perks: ["Logo on our website", "Thank-you on our social media"] },
    { tier: "silver", amount: null, perks: ["Everything in Bronze", "Logo on event-day signage"] },
    { tier: "gold", amount: null, perks: ["Everything in Silver", "Shout-out at the opening and closing ceremonies", "Larger logo placement"] },
    { tier: "platinum", amount: null, perks: ["Everything in Gold", "Host a workshop or name a prize", "Top logo placement everywhere"] },
  ],

  // Words in the big sideways-scrolling bands between sections. Short and punchy; they repeat to fill the width.
  // Keep them decorative. Don't put facts (dates, prizes) here, they'd be easy to forget when things change.
  marquee: ["12 hours", "Build anything", "Ship it", "Learn fast", "Find your team", "Dublin, CA"],

  links: {
    // Registration (or interest-list) form — Google Form, Tally, etc. I link out instead of building a form
    // because attendees are minors and I don't want us storing their data on something we built ourselves.
    register: "",
    // Full Instagram URL. "" => hidden. Shown in the landing-page icon dock and the footer.
    instagram: "https://www.instagram.com/emerald.hacks/",
    // Public contact email (just the address, no "mailto:"). Used for sponsor inquiries and general questions.
    email: "emeraldhacks9468@gmail.com",
    // Link to the code of conduct (a Google Doc or a page). "" => hidden.
    codeOfConduct: "",
    // Discord invite link. "" => hidden. When set: a "Join our Discord" button in the hero, an icon in the
    // landing-page icon dock, and links in the FAQ and footer.
    discord: "https://discord.gg/bnb2wbS5yH",
    // Full LinkedIn page URL. "" => hidden. When set: an icon in the landing-page dock and a footer link.
    linkedin: "",
    // Link to the sponsorship prospectus (a PDF in /public or a Google Drive link). "" => the sponsor line
    // just says "Email us at ...". Once set, it says "Check out our prospectus ... or email us at ...".
    prospectus: "",
  },

  // false => the main button says "Join interest list" (still uses links.register).
  // true  => it says "Register". Flip this the day real registration opens.
  registrationOpen: false,

  // Keep false until Hack Club HCB approves our fiscal sponsorship. While false, NO Hack Club / HCB
  // name or branding appears anywhere on the site.
  showFiscalSponsor: false,
  // Only displayed when showFiscalSponsor is true. Double-check the wording against what HCB asks us to use.
  fiscalSponsor: {
    name: "The Hack Foundation (Hack Club HCB)",
    url: "https://hackclub.com/fiscal-sponsorship/",
  },

  // false => the schedule is labelled "Tentative". The times below are a draft; flip to true once final.
  scheduleConfirmed: false,

  // Themes people can build for. prize: null => "Prize TBA".
  // Empty list => the Tracks section shows a "Coming soon" card. That's the current state on purpose.
  // When tracks are decided, add them like this (these were our early drafts):
  //   { name: "Open Skies", description: "Build anything you want. No theme, no limits.", prize: null },
  //   { name: "First Flight", description: "For teams where everyone is attending their first hackathon.", prize: null },
  //   { name: "Social Good", description: "Projects that help your school, your city, or the planet.", prize: null },
  tracks: [],

  // The 12-hour timeline, in order. These are DRAFT times — see scheduleConfirmed above.
  schedule: [
    { time: "8:00 AM", title: "Check-in", description: "Grab your badge and a light breakfast, find a seat, meet your team." },
    { time: "9:00 AM", title: "Opening ceremony", description: "Rules, the tracks reveal, and sponsor intros." },
    { time: "9:30 AM", title: "Hacking begins", description: "The clock starts. Start building." },
    { time: "10:30 AM", title: "Beginner workshop", description: "Build your first web app from scratch." },
    { time: "12:30 PM", title: "Lunch", description: "Provided." },
    { time: "5:30 PM", title: "Dinner", description: "Provided." },
    { time: "7:30 PM", title: "Submissions due", description: "Hands off keyboards. Submit your project." },
    { time: "7:45 PM", title: "Judging", description: "Demo your project to the judges." },
    { time: "8:45 PM", title: "Awards & closing", description: "Prizes, thank-yous, and photos." },
  ],

  // The Prizes section: one row per prize, in this order. prize: null => "TBA". Empty list => "Coming soon".
  prizes: [
    { place: "First place", prize: null },
    { place: "Second place", prize: null },
    { place: "Third place", prize: null },
  ],

  // Sponsor logos, grouped by tier on the site. Empty list => a "Be our first sponsor" message.
  // Put logo files in /public/sponsors/ (SVG or PNG, transparent background works best).
  sponsors: [],

  // Questions and answers. Answers are plain text. Only questions the rest of the page DOESN'T already answer
  // (date, location, cost, who can attend, experience, length, and sponsoring are all covered elsewhere).
  faq: [
    { q: "How big can teams be?", a: "Up to 4 people per team." },
    { q: "Need help finding a team?", a: "Check our Discord. There's a channel for finding teammates before the event." },
    { q: "What should I bring?", a: "A laptop, charger, student ID, a water bottle, and anything you need to be comfortable for 12 hours." },
    { q: "Will there be food?", a: "Yes. We provide lunch and dinner, plus a light breakfast (things like donuts, coffee, and juice)." },
    { q: "Do my parents need to sign anything?", a: "Yes, there's a waiver, and it's coming soon. Keep an eye on your email, and stay up to date by joining our Discord and following our Instagram." },
    { q: "Where do I park / how do I get there?", a: "Parking and directions will be posted once the location is finalized." },
  ],


  // The organizing team, shown in tiers: the director on top, then each division's leader, then everyone
  // else grouped by division. Names only, no photos. Spell names exactly as each person wants them shown.
  team: {
    director: { name: "Raghav Garg", role: "Director" },
    divisions: [
      { name: "Sponsorships and Outreach", lead: "Kashvi Gupta", members: ["Calvin Kwok", "Dylan Lam", "Kruthik Madhamsetty", "Nikita Prabhu"] },
      { name: "Marketing and Media", lead: "Charumathi Vijayabhaskar", members: ["Aarya Chawathe", "Vansh Komarraju"] },
      { name: "Logistics and Program Direction", lead: "Nasser Alsindi", members: ["Rishi Agraharam", "Nihtahli Anand", "Shivish Aneja", "Zayan Ahmer"] },
    ],
  },

  // Judges: name and role, e.g. { name: "Dr. Lee", role: "Software Engineer, Acme" }.
  // Empty list => a "Judges announced soon" card. Only add people who have actually confirmed.
  judges: [],
};
