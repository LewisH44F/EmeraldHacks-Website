// sections.ts — the list of page sections that appear in the nav.
//
// I keep this list in one place so the nav links and the section ids on the page can't drift apart:
// Each section component passes its id to Section.astro, and Nav.astro builds its links from this list.
// To rename a nav label, change `label` here. Don't change an `id` unless you also want the URL (#about) to change.

export interface NavSection {
  id: string; // the anchor in the URL, e.g. "about" => our-site.com/#about
  label: string; // the text shown in the nav
}

export const navSections: NavSection[] = [
  { id: "about", label: "About" },
  { id: "tracks", label: "Tracks" },
  { id: "prizes", label: "Prizes" },
  { id: "schedule", label: "Schedule" },
  { id: "sponsors", label: "Sponsors" },
  // Team sits before FAQ so the people behind the event come right after the sponsor pitch,
  // and the FAQ is the last thing before the footer for anyone still deciding.
  { id: "team", label: "Team" },
  { id: "judges", label: "Judges" },
  { id: "faq", label: "FAQ" },
];
