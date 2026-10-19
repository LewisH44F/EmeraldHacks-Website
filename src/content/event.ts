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

export type SponsorTier = "gold" | "silver" | "bronze";

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

export interface FaqItem {
  q: string;
  a: string;
}

export interface TeamMember {
  name: string;
  role: string;
  photo: string | null; // path inside /public, e.g. "/team/jane.jpg"; null => initials avatar
}

export interface EventConfig {
  name: string;
  tagline: string;
  date: { start: string | null; end: string | null };
  venue: { name: string | null; address: string | null; mapUrl: string | null };
  cost: string | null;
  eligibility: string | null;
  beginnerFriendly: boolean;
  about: string[];
  sponsorPitch: string[];
  marquee: string[];
  links: {
    register: string;
    sponsorForm: string;
    instagram: string;
    email: string;
    codeOfConduct: string;
  };
  registrationOpen: boolean;
  showFiscalSponsor: boolean;
  fiscalSponsor: { name: string; url: string };
  scheduleConfirmed: boolean;
  tracks: Track[];
  schedule: ScheduleItem[];
  sponsors: Sponsor[];
  faq: FaqItem[];
  team: TeamMember[];
}

// ---------------------------------------------------------------------------------------------------------
// The actual event data — edit below this line.
// ---------------------------------------------------------------------------------------------------------

export const event: EventConfig = {
  // Shown in the nav, hero, browser tab, and link previews.
  name: "Aerohacks",

  // One short line under the name in the hero.
  tagline: "12 hours. Build anything.",

  // Start and end as ISO 8601 strings WITH a timezone offset, e.g. "2026-03-14T09:00:00-07:00".
  // I require the offset because Dublin, CA is on Pacific time and visitors' browsers may not be —
  // without it, the countdown could be off by hours. null => "Date TBA" and the countdown is hidden.
  date: {
    start: null,
    end: null,
  },

  // Where it happens. Each field is independent: you can confirm the venue name before the address.
  // mapUrl is a Google/Apple Maps link; null => no "Directions" link is shown.
  venue: {
    name: null,
    address: null,
    mapUrl: null,
  },

  // What attendees pay, as a short phrase, e.g. "Free". null => "TBA".
  // I made this a field instead of hardcoding "free" because parents will treat whatever we show as a promise.
  cost: null,

  // Who can attend, e.g. "High school students (grades 9–12)". null => "TBA".
  eligibility: null,

  // true => the About section says "No experience needed". Only set true if we really will support beginners
  // (workshops, mentors). false => the line is simply left out.
  beginnerFriendly: true,

  // Paragraphs for the About section, written for beginners AND parents. Each string is one paragraph.
  // I keep this copy here (not in the component) so the team can reword it without touching code.
  about: [
    "A hackathon is a day-long event where students team up to build a project from scratch: an app, a website, a game, a robot, anything. Most hackathons also have workshops, mentors, food, and prizes.",
    "Aerohacks runs for 12 hours in a single day and ends the same evening. It's organized by students in Emerald High's Computer Science Honor Society.",
    // TODO: once confirmed, add a sentence about adult supervision / chaperones. Parents look for this first.
  ],

  // Bullet points in the "Why sponsor" box. Keep these honest: don't add attendee numbers until we have real ones.
  sponsorPitch: [
    "Put your brand in front of motivated high school students in Dublin.",
    "Support Dublin's first high school hackathon and help beginners write their first lines of code.",
    "Logo placement on this site and at the event, by tier.",
  ],

  // Words in the big sideways-scrolling bands between sections. Short and punchy; they repeat to fill the width.
  // Keep them decorative. Don't put facts (dates, prizes) here, they'd be easy to forget when things change.
  marquee: ["12 hours", "Build anything", "Ship it", "Learn fast", "Find your team", "Dublin, CA"],

  links: {
    // Registration (or interest-list) form — Google Form, Tally, etc. I link out instead of building a form
    // because attendees are minors and I don't want us storing their data on something we built ourselves.
    register: "",
    // Form sponsors fill out to express interest. "" => the button falls back to emailing us.
    sponsorForm: "",
    // Full Instagram URL, e.g. "https://instagram.com/aerohacks". "" => hidden.
    instagram: "",
    // Public contact email (just the address, no "mailto:"). Used for sponsor inquiries and general questions.
    email: "",
    // Link to the code of conduct (a Google Doc or a page). "" => hidden.
    codeOfConduct: "",
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
  tracks: [
    {
      name: "Open Skies",
      description: "Build anything you want. No theme, no limits.",
      prize: null,
    },
    {
      name: "First Flight",
      description: "For teams where everyone is attending their first hackathon.",
      prize: null,
    },
    {
      name: "Social Good",
      description: "Projects that help your school, your city, or the planet.",
      prize: null,
    },
  ],

  // The 12-hour timeline, in order. These are DRAFT times — see scheduleConfirmed above.
  schedule: [
    { time: "8:00 AM", title: "Check-in", description: "Grab your badge, find a seat, meet your team." },
    { time: "9:00 AM", title: "Opening ceremony", description: "Rules, tracks, and sponsor intros." },
    { time: "9:30 AM", title: "Hacking begins", description: "The clock starts. Start building." },
    { time: "10:30 AM", title: "Beginner workshop", description: "Build your first web app from scratch." },
    { time: "12:30 PM", title: "Lunch", description: "Provided. Tell us about dietary needs when you register." },
    { time: "2:00 PM", title: "Workshop", description: "Topic TBA." },
    { time: "5:30 PM", title: "Dinner", description: "Provided." },
    { time: "7:30 PM", title: "Submissions due", description: "Hands off keyboards. Submit your project." },
    { time: "7:45 PM", title: "Judging", description: "Demo your project to the judges." },
    { time: "8:45 PM", title: "Awards & closing", description: "Prizes, thank-yous, and photos." },
  ],

  // Sponsor logos, grouped by tier on the site. Empty list => a "Be our first sponsor" message.
  // Put logo files in /public/sponsors/ (SVG or PNG, transparent background works best).
  sponsors: [],

  // Questions and answers. Answers are plain text.
  // DRAFT WARNING: several answers below (team size, meals, mentors, laptop loans, waiver) are my best guess at
  // what we'll offer, not confirmed decisions. Confirm or rewrite each one before we publicly launch.
  faq: [
    { q: "How much does it cost?", a: "Cost TBA. We'll confirm before registration opens." },
    { q: "Who can attend?", a: "High school students. Exact eligibility TBA." },
    { q: "Is there an age requirement?", a: "Attendees must be in high school. Anyone under 18 needs a signed parent/guardian permission form." },
    { q: "Do I need coding experience?", a: "No. We'll run beginner workshops and have mentors around all day to help you get unstuck." },
    { q: "How big can teams be?", a: "Teams of up to 4. You can also come solo and find a team at the event." },
    { q: "What should I bring?", a: "A laptop, charger, student ID, a water bottle, and anything you need to be comfortable for 12 hours." },
    { q: "Will there be food?", a: "Yes, meals are provided. You can tell us about allergies and dietary restrictions when you register." },
    { q: "Is it overnight?", a: "No. Aerohacks is 12 hours during one day. Everyone goes home the same evening." },
    { q: "What if I don't have a laptop?", a: "Let us know when you register and we'll try to arrange one." },
    { q: "Do my parents need to sign anything?", a: "Yes. Anyone under 18 needs a parent/guardian permission and liability waiver. We'll send it after you register." },
    { q: "Where do I park / how do I get there?", a: "Venue and parking details TBA." },
  ],

  // Organizers. photo: null => a circle with their initials. Photos go in /public/team/ (square, ~400×400).
  team: [
    { name: "Organizer Name", role: "Lead Organizer", photo: null },
    { name: "Organizer Name", role: "Sponsorships", photo: null },
    { name: "Organizer Name", role: "Logistics", photo: null },
  ],
};
