/**
 * Home / landing page content.
 */

export const HOME_CONTENT = {
  hero: {
    heading: "Pageant Management,\nReimagined.",
    subheading:
      "Votex gives coordinators, judges, and tabulators a single platform to run flawless pageants — from candidate setup to live results.",
    cta: "Get Started Free",
    ctaSecondary: "See Pricing",
    visual: "hero-illustration", // placeholder for next/image src
  },

  features: {
    heading: "Everything a pageant needs",
    subheading:
      "From the first candidate registration to the final crown moment — Votex handles it all.",
    items: [
      {
        icon: "crown",
        title: "For Coordinators",
        description:
          "Build your entire pageant in minutes. Add candidates, define scoring categories, assign rounds, and invite judges with a single code.",
      },
      {
        icon: "star",
        title: "For Judges",
        description:
          "Score candidates on any device, in any round. No app download. Just a login code and a clean scoring interface built for focus.",
      },
      {
        icon: "table-cells",
        title: "For Tabulators",
        description:
          "Watch scores flow in live. Verify completeness, advance candidates, and see weighted totals recalculate in real time.",
      },
      {
        icon: "chart-bar",
        title: "Live Leaderboard",
        description:
          "Weighted scores, per-round rankings, and instant recalculation as each judge submits. Results are always current.",
      },
      {
        icon: "device-phone-mobile",
        title: "Works on Any Device",
        description:
          "Fully responsive — phone, tablet, laptop. Judges scoring on tablets backstage? That's exactly what Votex was built for.",
      },
      {
        icon: "shield-check",
        title: "Secure & Reliable",
        description:
          "Role-based access, encrypted credentials, and automatic reconnection ensure your event runs without a hitch.",
      },
    ],
  },

  howItWorks: {
    heading: "Up and running in minutes",
    steps: [
      {
        number: "1",
        title: "Create a pageant",
        description: "Sign up, choose a plan, and create your event in under 5 minutes.",
      },
      {
        number: "2",
        title: "Add your team",
        description: "Invite judges and tabulators — Votex generates their login codes automatically.",
      },
      {
        number: "3",
        title: "Run the event",
        description: "Scores come in live. The leaderboard updates instantly. You focus on the stage.",
      },
    ],
  },

  roles: {
    heading: "Built for every person on your team",
    items: [
      {
        role: "Coordinator",
        tagline: "You're in control",
        capabilities: [
          "Create and manage multiple pageants",
          "Add candidates with photos and details",
          "Define scoring categories and weighted criteria",
          "Assign rounds and track progress",
          "Add judges and tabulators with instant login codes",
        ],
      },
      {
        role: "Judge",
        tagline: "Score with confidence",
        capabilities: [
          "See assigned pageants and rounds",
          "Score each candidate per criterion",
          "Scores saved instantly as you submit",
          "Works on phone, tablet, or laptop",
          "No app install needed",
        ],
      },
      {
        role: "Tabulator",
        tagline: "Full visibility, zero chaos",
        capabilities: [
          "Live grid view of all judges' scores",
          "Per-criterion and total score averages",
          "Advance candidates between rounds",
          "Real-time connection with auto-reconnect",
          "Immediate leaderboard view",
        ],
      },
    ],
  },

  testimonials: {
    heading: "Trusted by pageant organizers",
    items: [
      {
        quote:
          "We used to spend an hour tallying scores on paper. With Votex, results were ready before the candidates walked off stage.",
        name: "Maria Santos",
        title: "Pageant Coordinator, Manila",
      },
      {
        quote:
          "As a judge, I loved being able to score on my phone without any complicated setup. The interface is clean and fast.",
        name: "Roberto Cruz",
        title: "Judge, Regional Beauty Pageant",
      },
      {
        quote:
          "The live tabulation grid is exactly what we needed. I could verify every score in real time and catch discrepancies immediately.",
        name: "Ana Reyes",
        title: "Tabulator, National Youth Pageant",
      },
    ],
  },

  pricing: {
    heading: "Simple, transparent pricing",
    subheading:
      "Pay per event or get a plan. No hidden fees, no lock-in.",
    cta: "See All Plans",
  },

  cta: {
    heading: "Ready to run a flawless pageant?",
    subheading: "Set up your first event in minutes. No credit card required to start.",
    button: "Get Started Free",
    secondary: "See pricing →",
  },
} as const;
