/**
 * FAQ content — all questions and answers live here.
 * The FAQ page renders these directly; never hardcode Q&A in the component.
 */

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: "general" | "coordinators" | "judges" | "billing" | "technical";
}

export const FAQ_ITEMS: FaqItem[] = [
  // General
  {
    id: "what-is-votex",
    category: "general",
    question: "What is Votex?",
    answer:
      "Votex is a web-based pageant management platform that helps coordinators set up events, assign judges and tabulators, manage candidates, and produce live tabulated results — all in one place.",
  },
  {
    id: "who-is-votex-for",
    category: "general",
    question: "Who is Votex for?",
    answer:
      "Votex is built for four types of users: Pageant Coordinators who set up and manage events; Judges who score candidates on tablets or any device; Tabulators who verify and finalize scores in real time; and Contestants or general users who want to follow along.",
  },
  {
    id: "devices-supported",
    category: "general",
    question: "What devices does Votex work on?",
    answer:
      "Votex is fully responsive and works on phones, tablets, and desktops. The judge scoring interface is specifically designed to be usable on a tablet in portrait or landscape orientation — which is how judges typically work backstage.",
  },

  // Coordinators
  {
    id: "how-create-pageant",
    category: "coordinators",
    question: "How do I create a pageant?",
    answer:
      "After subscribing to a plan, go to My Pageants and click New Pageant. Fill in the name, date, location, and cover image. You can then add candidates, categories, criteria, rounds, judges, and tabulators from the pageant management dashboard.",
  },
  {
    id: "how-add-judge",
    category: "coordinators",
    question: "How do judges and tabulators log in?",
    answer:
      "Judges and tabulators don't create their own accounts. You add them by entering their email and name — Votex generates a unique 6-digit login code you share with them. They log in using their email plus that code. You can regenerate the code at any time.",
  },
  {
    id: "multiple-rounds",
    category: "coordinators",
    question: "Can I have multiple rounds in one pageant?",
    answer:
      "Yes. You can create as many rounds as needed (Preliminary, Semi-Final, Final, etc.), set scoring categories per round, and advance candidates between rounds using the tabulator's advance feature.",
  },
  {
    id: "candidate-status",
    category: "coordinators",
    question: "Can I eliminate or disqualify a candidate?",
    answer:
      "Yes. From the Candidates section of your pageant, you can set any candidate's status to Active, Eliminated, or Disqualified. Eliminated and disqualified candidates are excluded from leaderboard calculations.",
  },

  // Billing
  {
    id: "how-billing-works",
    category: "billing",
    question: "How does billing work?",
    answer:
      "Votex offers three plans: Basic (₱999, 1 pageant), Premium (₱2,999, up to 5 pageants), and Enterprise (₱9,999, unlimited pageants). You pay once per plan period and can create pageants up to your plan's limit.",
  },
  {
    id: "payment-methods",
    category: "billing",
    question: "What payment methods are accepted?",
    answer:
      "You can pay online via PayMongo (credit/debit cards and e-wallets like GCash and Maya) or submit a manual bank transfer or GCash payment with a reference number, which is reviewed and approved by our team.",
  },
  {
    id: "when-subscription-activates",
    category: "billing",
    question: "When does my subscription activate?",
    answer:
      "For manual payments, your subscription is activated after our team reviews and approves your payment — usually within one business day. For online payments via PayMongo, activation follows confirmation of your payment.",
  },
  {
    id: "refund-policy-faq",
    category: "billing",
    question: "What is the refund policy?",
    answer:
      "Refunds are available on unused plans before any pageant has been created under that subscription. Once you have created at least one pageant, the subscription is considered used. See our full Refund Policy for details.",
  },

  // Technical
  {
    id: "realtime-scores",
    category: "technical",
    question: "How does real-time scoring work?",
    answer:
      "Votex uses a live WebSocket connection per pageant. When a judge submits a score, the tabulator's screen updates instantly without refreshing. The leaderboard recalculates automatically. If the connection drops, Votex reconnects automatically and shows a visible reconnecting indicator.",
  },
  {
    id: "data-security",
    category: "technical",
    question: "Is my data secure?",
    answer:
      "Yes. Passwords are hashed with Argon2id (industry standard). Session tokens are short-lived JWTs stored in memory only — never in localStorage. Refresh tokens are stored as HttpOnly cookies and use rotation with reuse detection to prevent token theft.",
  },
  {
    id: "score-formula",
    category: "technical",
    question: "How are scores calculated?",
    answer:
      "Each criterion has a weight. A candidate's total score for a round is: SUM(score × criterion weight) divided by the number of judges who have scored that candidate. Disqualified candidates are excluded from the leaderboard.",
  },
];
