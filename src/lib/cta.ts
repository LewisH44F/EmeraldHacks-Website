// cta.ts — works out what the main "Register" button should say and where it should go.
// CTA = "call to action", the button we most want people to click.
//
// I put this logic in one helper because the button appears in several places (nav, hero, About), and they
// must always agree. It reads only from event.ts, so flipping `registrationOpen` updates every button at once.
import { event } from "../content/event";

export interface Cta {
  label: string;
  href: string | null; // null => no form link yet, so components render a non-clickable "coming soon" state
}

export function registerCta(): Cta {
  // Before registration opens we still want to capture interest, so the same form link is reused
  // with softer wording.
  const label = event.registrationOpen ? "Register" : "Join interest list";

  // The fallback label is short on purpose: it has to fit next to the logo and menu button on a 360px phone.
  // I'd rather show an honest "coming soon" than a button that goes nowhere or to a broken link.
  const href = event.links.register.trim() || null;

  return { label: href ? label : "Sign-ups soon", href };
}

// The "Become a sponsor" button. I prefer the sponsor form (structured info, nothing gets lost in an inbox),
// fall back to email, and only show "coming soon" if we have neither.
export function sponsorCta(): Cta & { external: boolean } {
  const form = event.links.sponsorForm.trim();
  if (form) return { label: "Become a sponsor", href: form, external: true };
  const email = event.links.email.trim();
  if (email) {
    // Pre-filling the subject line makes our inbox easier to sort and saves the sponsor a step.
    const subject = encodeURIComponent(`Sponsoring ${event.name}`);
    return { label: "Become a sponsor", href: `mailto:${email}?subject=${subject}`, external: false };
  }
  return { label: "Sponsor info coming soon", href: null, external: false };
}
