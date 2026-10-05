/**
 * About page content.
 */

export const ABOUT_CONTENT = {
  hero: {
    heading: "Built for the stage. Designed for the team behind it.",
    subheading:
      "Votex was created by people who've experienced the chaos of pageant night firsthand — paper tallies, mismatched score sheets, and the pressure of announcing results in front of a live audience. We built the platform we wished we had.",
  },

  mission: {
    heading: "Our Mission",
    body: "To make every pageant — from school-level competitions to national events — run with the precision and elegance it deserves. Coordinators should focus on the event, not the spreadsheet.",
  },

  howItWorks: {
    heading: "How It Works",
    steps: [
      {
        step: "01",
        title: "Coordinator sets up",
        description:
          "Create a pageant, add candidates, define scoring categories and criteria, set up rounds, and assign judges and tabulators — all in one dashboard.",
      },
      {
        step: "02",
        title: "Judges score live",
        description:
          "Judges receive a login code, sign in on any device, and submit scores for each candidate and criterion in real time — no app download required.",
      },
      {
        step: "03",
        title: "Tabulator monitors",
        description:
          "Tabulators see the full scoring grid as it fills in, verify completeness, and advance candidates between rounds with a single action.",
      },
      {
        step: "04",
        title: "Results are instant",
        description:
          "The leaderboard recalculates live as scores come in. No manual tallying, no data entry errors, no waiting.",
      },
    ],
  },

  values: [
    {
      icon: "shield",
      title: "Accuracy First",
      description:
        "Weighted scoring, disqualification handling, and per-judge tracking ensure results are always correct and auditable.",
    },
    {
      icon: "lightning",
      title: "Real-Time",
      description:
        "Live WebSocket connections mean scores update the moment they're submitted. No polling, no refresh.",
    },
    {
      icon: "device-mobile",
      title: "Device-Ready",
      description:
        "Built mobile-first. Judges score on tablets backstage. Coordinators manage from a laptop. Tabulators monitor from anywhere.",
    },
    {
      icon: "lock",
      title: "Secure by Design",
      description:
        "Argon2id passwords, in-memory tokens, HttpOnly cookies, and role-based access control keep your data safe.",
    },
  ],

  team: [
    {
      name: "The Votex Developer",
      role: "Builder & Pageant Enthusiasts",
      bio: "A solo developer dedicated to bringing ceremony-grade technology to pageants of every size, everywhere in the Philippines.",
    },
  ],
} as const;
