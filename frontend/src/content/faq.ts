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
      "Votex supports pageant organizers and owners, coordinators, judges, tabulators, and audience members. Each role sees the pages and actions available to that account. Public pageant information can also be viewed without signing in.",
  },
  {
    id: "devices-supported",
    category: "general",
    question: "What devices does Votex work on?",
    answer:
      "Votex is designed to work on phones, tablets, laptops, and desktop screens in a modern browser. Some management and scoring screens are easier to use on a larger display.",
  },

  // Coordinators
  {
    id: "how-create-pageant",
    category: "coordinators",
    question: "How do I create a pageant?",
    answer:
      "An organization owner needs an active subscription with available pageant capacity. In the organization owner portal, create a pageant and then configure its rounds, categories, criteria, candidates, and staff. Some configuration limits come from the selected plan.",
  },
  {
    id: "how-add-judge",
    category: "coordinators",
    question: "How do judges and tabulators log in?",
    answer:
      "A coordinator or organization owner adds staff using their name and email. Staff sign in through the same email-and-password login as other users. New staff receive a temporary password and should change it after signing in. An existing account may be reused for assignments where organization access rules allow it.",
  },
  {
    id: "multiple-rounds",
    category: "coordinators",
    question: "Can I have multiple rounds in one pageant?",
    answer:
      "Yes. You can create multiple rounds and attach categories to each one. Your subscription may limit how many rounds or categories you can configure. A round can be opened after its category weights and criteria are configured, and candidates can advance between rounds through the pageant workflow.",
  },
  {
    id: "candidate-status",
    category: "coordinators",
    question: "Can I eliminate or disqualify a candidate?",
    answer:
      "Candidate status can be managed from the pageant's Candidates section. The available statuses include Active, Eliminated, and Disqualified. Status and scoring rules affect how candidates appear in pageant results.",
  },

  // Billing
  {
    id: "how-billing-works",
    category: "billing",
    question: "How does billing work?",
    answer:
      "Current plans, prices, billing terms, and usage limits are shown on the Pricing page. Plan availability and limits are managed by the Votex administrator, so check that page for the latest details. Custom plans may have individually configured terms.",
  },
  {
    id: "payment-methods",
    category: "billing",
    question: "What payment methods are accepted?",
    answer:
      "Payment options depend on the payment mode configured for Votex. Manual payment currently supports GCash, Maya, or MariBank and requires the amount paid and a reference number; an image proof is optional. Automated payments use PayMongo checkout, and the methods shown there depend on the PayMongo account and checkout configuration.",
  },
  {
    id: "when-subscription-activates",
    category: "billing",
    question: "When does my subscription activate?",
    answer:
      "A manual payment stays pending until an administrator reviews and approves it. An automated PayMongo payment is activated after the backend receives and verifies PayMongo's payment confirmation. No review or activation time is guaranteed here.",
  },
  {
    id: "refund-policy-faq",
    category: "billing",
    question: "What is the refund policy?",
    answer:
      "Refund eligibility is governed by the current Refund Policy. Please read that policy for the applicable conditions and contact support or an administrator if you need help with a specific transaction.",
  },

  // Technical
  {
    id: "realtime-scores",
    category: "technical",
    question: "How does real-time scoring work?",
    answer:
      "Votex provides authenticated, pageant-scoped live updates for supported screens. When the connection drops, the app attempts to reconnect and shows its connection state. Live updates depend on an active connection; refresh the page if a screen appears out of date.",
  },
  {
    id: "data-security",
    category: "technical",
    question: "Is my data secure?",
    answer:
      "Votex uses security controls including Argon2id password hashing, short-lived access tokens held in memory, and HttpOnly refresh-token cookies with rotation. These controls help protect accounts, but no online service can promise absolute security. Use a unique password and keep it private.",
  },
  {
    id: "score-formula",
    category: "technical",
    question: "How are scores calculated?",
    answer:
      "Judges score candidates against the criteria configured for each category. Criteria weights total 100% within a category, and category weights total 100% for each eligibility group in a round. Submitted judge scores are combined for the category results; the tabulator view shows the results by round and category. Exact results depend on the configured weights and submitted scores.",
  },
];
