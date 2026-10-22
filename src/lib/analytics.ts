import { env } from './env';

export type AnalyticsEvent =
  | 'waitlist_view'
  | 'waitlist_submit'
  | 'waitlist_success'
  | 'waitlist_error'
  | 'cta_click';

const CONSENT_KEY = 'thoran.cookie-consent';

export function getConsent(): 'granted' | 'denied' | null {
  try {
    return (localStorage.getItem(CONSENT_KEY) as 'granted' | 'denied' | null) ?? null;
  } catch {
    return null;
  }
}

export function setConsent(value: 'granted' | 'denied') {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* modo privado */
  }
}

/** Banner só é necessário se houver pixel de marketing configurado. */
export const needsCookieBanner = () => Boolean(env.pixelId);

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Eventos vão para window.dataLayer (compatível com GTM/Plausible/PostHog).
 * Com pixel de marketing, só disparam após consentimento.
 */
export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}) {
  if (needsCookieBanner() && getConsent() !== 'granted') return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...props, ts: Date.now() });
  if (import.meta.env.DEV) console.debug('[analytics]', event, props);
}

export const trackCta = (id: string) => track('cta_click', { cta_id: id });
