/**
 * Terms & Conditions content.
 * Structured as sections so the page component renders them without hardcoded JSX.
 */

export const TERMS_CONTENT = {
  title: "Terms & Conditions",
  lastUpdated: "January 1, 2025",
  intro:
    "These Terms & Conditions govern your use of the Votex platform operated by Votex Technologies, based in the Philippines. By registering for or using Votex, you agree to these terms in full.",

  sections: [
    {
      id: "accounts",
      heading: "1. Accounts and Roles",
      body: `Votex supports the following account roles: Pageant Coordinator, Judge, Tabulator, and General User. Each account is associated with exactly one role at a time. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.

Judges and Tabulators are created by Pageant Coordinators. Their login codes are single-use access credentials and should not be shared with unauthorized persons.

You must provide accurate and complete information when registering. Votex reserves the right to suspend or terminate accounts found to contain false information.`,
    },
    {
      id: "coordinator-obligations",
      heading: "2. Coordinator Obligations",
      body: `As a Pageant Coordinator, you are solely responsible for:
- The accuracy of candidate information you enter into the platform.
- The conduct and impartiality of the judges you assign.
- Ensuring that the platform is used in compliance with applicable laws and the rules of your pageant organization.
- Obtaining any necessary consents from candidates before uploading their photos or personal details.

Votex provides the technical infrastructure for your event. We do not validate, endorse, or bear responsibility for the outcomes of any pageant conducted on the platform.`,
    },
    {
      id: "judge-tabulator-conduct",
      heading: "3. Judge and Tabulator Conduct",
      body: `Judges and Tabulators are responsible for:
- Scoring candidates honestly and without bias.
- Keeping their login codes confidential.
- Not sharing or delegating scoring access to unauthorized persons.
- Reporting any technical issues to their assigned coordinator promptly.

Coordinators may revoke and regenerate login codes at any time. Votex may suspend access if misuse of the platform is detected.`,
    },
    {
      id: "content-ownership",
      heading: "4. Content Ownership and Licenses",
      body: `You retain ownership of all content you upload to Votex, including candidate photos, pageant descriptions, and any other materials. By uploading content, you grant Votex a non-exclusive, worldwide, royalty-free license to store and display that content solely for the purpose of providing the platform services.

You represent and warrant that you have all necessary rights to upload the content, including consent from the individuals depicted in any photos.

Votex does not use uploaded content for advertising or marketing without your explicit permission.`,
    },
    {
      id: "payment-terms",
      heading: "5. Payment and Subscriptions",
      body: `Access to pageant creation features requires an active subscription. Subscriptions are available in Basic, Premium, and Enterprise tiers, denominated in Philippine Peso (PHP).

Payments may be made via online checkout (PayMongo) or manual bank transfer/GCash. Manual payments are subject to admin review before activation.

Subscription access grants the right to create up to the stated number of pageants during the subscription period. Unused pageant slots do not roll over.

For full refund terms, see our Refund Policy.`,
    },
    {
      id: "liability",
      heading: "6. Limitation of Liability",
      body: `Votex is provided "as is" without warranties of any kind. To the fullest extent permitted by Philippine law, Votex Technologies shall not be liable for:
- Any indirect, incidental, or consequential damages arising from use of the platform.
- Loss of data resulting from technical failures, though we take reasonable measures to prevent this.
- Disputes arising from the conduct of judges, tabulators, or coordinators.
- Results of any pageant conducted on the platform.

Our total liability to you for any claim shall not exceed the amount you paid for the subscription during the three months preceding the claim.`,
    },
    {
      id: "termination",
      heading: "7. Account Termination",
      body: `Votex may suspend or terminate your account if:
- You violate these Terms & Conditions.
- Payment is not received or is reversed.
- Your account is used for fraudulent or illegal activity.

You may delete your account at any time by contacting support@votex.app. Upon termination, your data may be retained for up to 90 days for legal and audit purposes, then permanently deleted.`,
    },
    {
      id: "changes",
      heading: "8. Changes to These Terms",
      body: `Votex may update these Terms & Conditions from time to time. We will notify registered users of material changes via email at least 14 days before the changes take effect. Continued use of the platform after that date constitutes acceptance of the updated terms.`,
    },
    {
      id: "governing-law",
      heading: "9. Governing Law",
      body: `These Terms are governed by the laws of the Republic of the Philippines. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the appropriate courts of the Philippines.`,
    },
    {
      id: "contact",
      heading: "10. Contact",
      body: `For questions about these Terms, contact us at support@votex.app.`,
    },
  ],
} as const;
