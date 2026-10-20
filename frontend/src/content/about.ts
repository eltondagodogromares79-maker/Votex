/** About-page copy. Keep statements factual and focused on available workflows. */

export const ABOUT_CONTENT = {
  hero: {
    heading: "A clearer way to organize pageant work.",
    subheading:
      "VoteX brings pageant setup, judging, tabulation, and audience voting into one platform, with a workspace for each role.",
  },

  mission: {
    heading: "Make pageant operations easier to manage.",
    body:
      "VoteX gives pageant organizations a place to configure events, manage contestants and staff, collect judge scores, and review results. Each event can use its own rounds, categories, criteria, and scoring weights.",
    points: [
      "Organize pageants, contestants, and staff",
      "Configure rounds, categories, criteria, and weights",
      "Review submitted scores and contestant standings",
    ],
  },

  howItWorks: {
    heading: "How a pageant uses VoteX",
    steps: [
      {
        step: "01",
        title: "Set up the event",
        description:
          "Organization owners create pageants. Coordinators add contestants, configure rounds and categories, and prepare scoring criteria.",
      },
      {
        step: "02",
        title: "Assign the pageant team",
        description:
          "Assign coordinators, judges, and tabulators. Each person signs in to access the pageants and tools available to their role.",
      },
      {
        step: "03",
        title: "Score and review",
        description:
          "Judges score candidates in open categories. Tabulators review submitted scores, standings, and contestant status.",
      },
      {
        step: "04",
        title: "Share the public event",
        description:
          "Publish the pageant so audiences can view event and contestant details. Audience voting is available when enabled for that pageant.",
      },
    ],
  },

  values: [
    {
      icon: "shield",
      title: "Configured scoring",
      description:
        "Pageant teams define criteria and category weights for each round, with validation before a round can open.",
    },
    {
      icon: "lightning",
      title: "Role-focused tools",
      description:
        "Organization owners, coordinators, judges, tabulators, and audiences have distinct workflows for their part of the event.",
    },
    {
      icon: "device-mobile",
      title: "Responsive access",
      description:
        "The web interface adapts to phones, tablets, and desktop screens for event work across different devices.",
    },
    {
      icon: "lock",
      title: "Access controls",
      description:
        "Authenticated pages and role-based permissions limit each account to the actions available for its role and assignments.",
    },
  ],

  product: {
    heading: "One event, different workspaces",
    body:
      "VoteX connects the people involved in a pageant while keeping each role's tasks clear.",
    roles: [
      {
        title: "Organization owners and coordinators",
        description:
          "Manage organization details, pageants, contestants, event setup, and assigned staff.",
      },
      {
        title: "Judges and tabulators",
        description:
          "Judges submit scores for open categories. Tabulators review submitted results and contestant standings.",
      },
      {
        title: "Audiences",
        description:
          "View published pageants and candidates, and cast votes when voting is enabled for an event.",
      },
    ],
  },
} as const;
