/**
 * Site-wide configuration.
 * All contact details, social links, and environment-derived URLs live here.
 * Import from this file — never hardcode these values in components.
 */
export const SITE_CONFIG = {
  name: "Votex",
  tagline: "Pageant Management, Reimagined.",
  description:
    "Votex is a modern platform for coordinators, judges, tabulators, and contestants. Streamline scoring, tabulation, and live results from any device.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",

  contact: {
    email: "support@votex.app",
    helpEmail: "help@votex.app",
  },

  social: {
    facebook: "https://facebook.com/votexapp",
    instagram: "https://instagram.com/votexapp",
    whatsapp: "https://wa.me/639XXXXXXXXX", // replace with real WhatsApp number
  },

  /** Company / legal */
  company: {
    name: "Votex Technologies",
    country: "Philippines",
    currency: "PHP",
    locale: "en-PH",
  },
} as const;
