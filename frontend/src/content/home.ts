/**
 * Public home page copy. Keep claims tied to features that are available in the
 * product; avoid customer names, metrics, and testimonials unless verified.
 */

export const HOME_CONTENT = {
  hero: {
    heading: "Pageant Management,\nReimagined.",
    subheading:
      "A shared workspace for pageant organizers, judges, tabulators, and audiences—from event setup and scoring to results and voting.",
    cta: "Get Started",
    ctaSecondary: "See Pricing",
  },

  features: {
    heading: "Tools for every stage of a pageant",
    subheading:
      "Set up an event, organize its scoring, and give each participant a workspace for their role.",
    items: [
      {
        icon: "crown",
        title: "Organization owners",
        description:
          "Manage your organization, subscription, pageants, and the people assigned to each event.",
      },
      {
        icon: "clipboard-document-list",
        title: "Pageant setup",
        description:
          "Organize contestants, rounds, categories, criteria, and pageant staff in one workspace.",
      },
      {
        icon: "star",
        title: "Judge scoring",
        description:
          "Judges see their assigned pageants and enter scores for candidates by category and criterion.",
      },
      {
        icon: "table-cells",
        title: "Tabulation and standings",
        description:
          "Review submitted scores, contestant statuses, category results, and round leaderboards.",
      },
      {
        icon: "device-phone-mobile",
        title: "Responsive workspaces",
        description:
          "Use the owner, coordinator, judge, and tabulator workspaces on a phone, tablet, or computer.",
      },
      {
        icon: "ticket",
        title: "Audience voting",
        description:
          "Let audiences browse published pageants and purchase votes when voting is enabled for an event.",
      },
    ],
  },

  howItWorks: {
    heading: "A clear workflow from setup to results",
    steps: [
      {
        number: "1",
        title: "Set up your organization and event",
        description:
          "The organization owner chooses a plan and creates pageants. Coordinators prepare contestants, rounds, categories, and criteria.",
      },
      {
        number: "2",
        title: "Bring in the pageant team",
        description:
          "Assign coordinators, judges, and tabulators to the pageant so each person can use their own workspace.",
      },
      {
        number: "3",
        title: "Score and review results",
        description:
          "Judges submit scores while categories are open. Tabulators can review submitted results and contestant standings.",
      },
    ],
  },

  roles: {
    heading: "A workspace for each role",
    items: [
      {
        role: "Organization owners",
        tagline: "Manage the organization",
        capabilities: [
          "Manage organization details and subscription",
          "Create and manage pageants",
          "Assign coordinators, judges, and tabulators",
        ],
      },
      {
        role: "Coordinators",
        tagline: "Prepare the pageant",
        capabilities: [
          "Manage contestants and pageant details",
          "Configure rounds, categories, and criteria",
          "Manage judges and tabulators",
        ],
      },
      {
        role: "Judges and tabulators",
        tagline: "Score and review",
        capabilities: [
          "Judges submit scores for assigned categories",
          "Tabulators review scores and standings",
          "Work from a dedicated pageant workspace",
        ],
      },
      {
        role: "Audience",
        tagline: "Follow the event",
        capabilities: [
          "Browse published pageants and contestants",
          "View candidate details",
          "Purchase votes when the pageant enables voting",
        ],
      },
    ],
  },

  workflow: {
    heading: "One event, connected workflows",
    items: [
      {
        title: "Configure scoring",
        description:
          "Set category eligibility and criteria, then configure category weights for each round before opening it.",
      },
      {
        title: "Collect judge scores",
        description:
          "Judges enter scores against the criteria configured for the categories they are assigned to score.",
      },
      {
        title: "Review standings",
        description:
          "Tabulators can review submitted results and track contestant status and advancement across rounds.",
      },
    ],
  },

  pricing: {
    heading: "Plans for different event needs",
    subheading:
      "Compare subscription plans and their pageant, judge, round, and category limits.",
    cta: "See All Plans",
  },

  cta: {
    heading: "Plan your next pageant with VoteX",
    subheading:
      "Explore the available tools and plans, then create an organization to get started.",
    button: "Get Started",
    secondary: "See pricing →",
  },
} as const;
