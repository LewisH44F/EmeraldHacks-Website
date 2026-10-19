// sections.ts — the list of page sections that appear in the nav.
//
// I keep this list in one place so the nav links and the section ids on the page can't drift apart:
// index.astro uses these ids for each <section>, and Nav.astro builds its links from the same list.
// To rename a nav label, change `label` here. Don't change an `id` unless you also want the URL (#about) to change.

export interface NavSection {
  id: string; // the anchor in the URL, e.g. "about" => aerohacks.netlify.app/#about
  label: string; // the text shown in the nav
}

export const navSections: NavSection[] = [
  { id: "about", label: "About" },
  { id: "tracks", label: "Tracks" },
  { id: "schedule", label: "Schedule" },
  { id: "sponsors", label: "Sponsors" },
  { id: "faq", label: "FAQ" },
  { id: "team", label: "Team" },
];
