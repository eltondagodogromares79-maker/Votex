/**
 * Privacy Policy content.
 */

export const PRIVACY_CONTENT = {
  title: "Privacy Policy",
  lastUpdated: "January 1, 2025",
  intro:
    "This Privacy Policy explains what data Votex Technologies collects, how we use it, and your rights regarding your personal information. We are committed to protecting the privacy of everyone who uses our platform.",

  sections: [
    {
      id: "data-collected",
      heading: "1. Information We Collect",
      body: `We collect the following types of information when you use Votex:

Account Information: Your name, email address, and password (stored as a secure Argon2id hash, never in plain text). If you register via Google, we receive your name, email, and Google account ID.

Pageant Data: Information entered by coordinators, including candidate names, candidate numbers, representing organizations, photos, scores, and event details.

Payment Information: When you submit a payment, we collect the payment plan selected, the amount, your reference number or PayMongo transaction ID, and optional payment screenshots. We do not store full credit card numbers — payment processing is handled by PayMongo, a licensed payment gateway.

Session Data: Access tokens (stored in memory only, not in persistent browser storage) and refresh tokens (stored as secure HttpOnly cookies with SHA-256 hashing). We may log IP addresses and user agent strings associated with token issuance for security purposes.

Usage Data: Basic server access logs including timestamps, routes accessed, and response codes. We do not use third-party analytics that track browsing behavior.`,
    },
    {
      id: "how-used",
      heading: "2. How We Use Your Information",
      body: `We use your information to:
- Provide, operate, and improve the Votex platform.
- Authenticate your identity and maintain session security.
- Process and verify your subscription payments.
- Send transactional emails (password codes, payment confirmations, account notices).
- Investigate security incidents and enforce our Terms & Conditions.
- Comply with legal obligations under Philippine law.

We do not sell, rent, or share your personal data with third parties for marketing purposes.`,
    },
    {
      id: "third-parties",
      heading: "3. Third-Party Processors",
      body: `We share limited data with the following third-party service providers, solely to operate the platform:

PayMongo: Our payment processing partner. Subject to their own Privacy Policy at paymongo.com. We share transaction data required to process and verify payments.

Google: If you use Google Sign-In, your authentication is handled by Google's OAuth 2.0 infrastructure. We receive only your name, email, and Google account ID.

Hosting and Infrastructure: Our backend infrastructure is hosted on cloud servers. Your data is stored securely with encryption at rest and in transit.

We do not use third-party advertising networks, social media trackers, or behavioral analytics providers.`,
    },
    {
      id: "data-retention",
      heading: "4. Data Retention",
      body: `We retain your account and pageant data for as long as your account is active. If you delete your account, we will remove your personal data within 90 days, except where we are required to retain it for legal, audit, or fraud prevention purposes.

Payment records are retained for 7 years as required by Philippine tax regulations.

Login codes expire after 15 minutes of issuance. Refresh tokens expire based on your plan's session duration.`,
    },
    {
      id: "cookies",
      heading: "5. Cookies",
      body: `Votex uses a single essential cookie:

refresh_token: An HttpOnly, Secure, SameSite cookie used to maintain your login session. This cookie is necessary for the platform to function and cannot be opted out of while you are signed in.

We do not use advertising cookies, third-party tracking cookies, or analytics cookies.`,
    },
    {
      id: "user-rights",
      heading: "6. Your Rights",
      body: `Under the Data Privacy Act of 2012 (Republic Act 10173) of the Philippines, you have the right to:
- Access the personal data we hold about you.
- Request correction of inaccurate data.
- Request deletion of your personal data (subject to legal retention requirements).
- Withdraw consent for non-essential data processing.
- File a complaint with the National Privacy Commission.

To exercise these rights, contact our Data Protection Officer at support@votex.app.`,
    },
    {
      id: "security",
      heading: "7. Security",
      body: `We take the following measures to protect your data:
- Passwords are hashed using Argon2id with unique salts. They are never stored or transmitted in plain text.
- Access tokens are short-lived JWTs stored in browser memory only.
- Refresh tokens are stored as SHA-256 hashes in our database and transmitted only via HttpOnly cookies.
- All data in transit is encrypted using TLS.
- Role-based access control restricts what each user can see and do within the platform.

Despite these measures, no internet transmission is 100% secure. We encourage you to use a strong, unique password.`,
    },
    {
      id: "changes",
      heading: "8. Changes to This Policy",
      body: `We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you by email at least 14 days before material changes take effect. Your continued use of the platform constitutes acceptance of the updated policy.`,
    },
    {
      id: "contact",
      heading: "9. Contact Us",
      body: `For privacy-related inquiries or to exercise your data rights, contact us at support@votex.app or write to Votex Technologies, Philippines.`,
    },
  ],
} as const;
