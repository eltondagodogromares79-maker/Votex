 /**
 * Refund Policy content.
 */

export const REFUND_CONTENT = {
  title: "Refund Policy",
  lastUpdated: "January 1, 2025",
  intro:
    "This Refund Policy describes the conditions under which Votex Technologies may issue refunds for subscription purchases.",

  sections: [
    {
      id: "eligibility",
      heading: "1. Refund Eligibility",
      body: `A refund may be requested under the following conditions:

Eligible for refund:
- Your subscription was purchased within the last 7 days AND no pageant has been created under that subscription yet.
- A duplicate payment was made in error (same plan, same period, same account).
- The platform was unavailable for more than 24 consecutive hours due to technical issues on our end during your subscription period.

Not eligible for refund:
- You have created at least one pageant under the subscription. Once a pageant is created, the subscription is considered used.
- Partial refunds for unused pageant slots within a subscription period are not available.
- Refunds are not available for subscriptions that have already expired or been cancelled.
- Refunds are not available if your account was suspended for violating our Terms & Conditions.`,
    },
    {
      id: "process",
      heading: "2. How to Request a Refund",
      body: `To request a refund, send an email to support@votex.app with:
- The email address associated with your account.
- The payment reference number or PayMongo transaction ID.
- The reason for your refund request.

We will review your request within 3 business days and respond by email. Approved refunds are processed within 5–10 business days, depending on your payment method.`,
    },
    {
      id: "manual-payments",
      heading: "3. Manual Payments (Bank Transfer / GCash)",
      body: `If your payment was submitted via manual bank transfer or GCash and has been approved by our team, refunds will be processed back to the original payment source. Please provide your bank account or GCash number when requesting a refund.

If your manual payment is still in "Pending Review" status, you may cancel the request by contacting us at support@votex.app. No refund processing is needed in this case as the subscription has not yet been activated.`,
    },
    {
      id: "online-payments",
      heading: "4. Online Payments (PayMongo)",
      body: `Refunds for payments made via PayMongo are subject to PayMongo's refund processing timelines, which are typically 5–10 business days for card payments. GCash refunds via PayMongo are typically credited within 24 hours.

Votex will initiate the refund on our end once your eligibility is confirmed. The timeline after that depends on PayMongo and your card issuer or e-wallet provider.`,
    },
    {
      id: "plan-changes",
      heading: "5. Plan Changes",
      body: `If you wish to upgrade from one plan to another (e.g., Basic to Premium), the difference in price will be charged. There is no prorated refund for the unused portion of your current plan when upgrading.

Downgrading to a lower plan is not supported mid-subscription. Contact us at support@votex.app to discuss options.`,
    },
    {
      id: "contact",
      heading: "6. Contact",
      body: `For refund-related inquiries, email us at support@votex.app. Include your account email and payment reference number for faster processing.`,
    },
  ],
} as const;
