CREATE TABLE legal_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(40) NOT NULL UNIQUE CHECK (slug IN ('terms', 'privacy', 'refund-policy')),
    title VARCHAR(160) NOT NULL,
    intro TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the existing legal documents so the public pages remain populated
-- immediately after migration. Administrators can replace and maintain them.
INSERT INTO legal_policies (slug, title, intro, body) VALUES
('terms', 'Terms & Conditions', 'These Terms & Conditions govern your use of the Votex platform operated by Votex Technologies in the Philippines. By registering for or using Votex, you agree to these terms.',
'## 1. Accounts and Roles
Votex supports Pageant Coordinator, Judge, Tabulator, Organization Owner, Platform Administrator, and General User accounts. You are responsible for keeping your login credentials confidential and for activity under your account. Provide accurate information and use the platform lawfully.

## 2. Coordinator Obligations
Coordinators are responsible for accurate candidate information, judge impartiality, compliance with applicable laws and pageant rules, and obtaining required consent before uploading candidate photos or personal details. Votex provides the technical platform and does not determine pageant outcomes.

## 3. Judge and Tabulator Conduct
Judges and Tabulators must work honestly, protect their credentials, avoid unauthorized access sharing, and report technical issues to their coordinator. Access may be suspended when misuse is detected.

## 4. Content Ownership
You retain ownership of content you upload. You grant Votex a limited license to store and display it as needed to provide the platform. You confirm that you have the rights and consent needed to upload that content.

## 5. Payments and Subscriptions
Pageant creation features require an active subscription. Payment may use the methods offered at checkout. Manual payments require administrator review. Plan limits apply during the subscription period; unused limits do not roll over. See the Refund Policy for refund terms.

## 6. Limitation of Liability
Votex is provided as available and without guarantees beyond those required by law. To the extent permitted by Philippine law, Votex is not responsible for indirect losses, data loss caused by third parties, disputes among pageant participants, or pageant results.

## 7. Account Termination
Votex may suspend access for violations, unpaid or reversed payments, or fraudulent or unlawful use. Contact support to request account deletion. Some records may be retained when required for legal, audit, or fraud prevention purposes.

## 8. Changes to These Terms
We may update these terms to reflect service or legal changes. We will notify users of material changes through appropriate channels.

## 9. Governing Law
These Terms are governed by the laws of the Republic of the Philippines.

## 10. Contact
For questions about these Terms, contact support@votex.app.'),
('privacy', 'Privacy Policy', 'This Privacy Policy explains what information Votex Technologies collects, how we use it, and your rights regarding your personal information.',
'## 1. Information We Collect
We collect account details such as your name and email; pageant data entered by coordinators, including candidate details, photos, scores, and event information; payment plan, amount, reference or provider transaction IDs; and service logs needed for security and operations. Passwords are stored as secure hashes. We do not store full card numbers.

## 2. How We Use Information
We use information to operate and improve Votex, authenticate users, process payments, send transactional messages, investigate security incidents, and meet legal obligations. We do not sell personal data or share it for third-party marketing.

## 3. Service Providers
We share only the data needed with payment processors such as PayMongo, identity providers such as Google when used, and hosting and infrastructure providers that operate the service.

## 4. Data Retention
We retain account and pageant data while needed to provide the service. Deletion requests are handled subject to legal, audit, and fraud-prevention retention requirements. Payment records may be retained as required by law.

## 5. Cookies
Votex uses essential session cookies to maintain secure sign-in. We do not use advertising or behavioral tracking cookies.

## 6. Your Rights
Under the Philippine Data Privacy Act of 2012, you may request access, correction, or deletion of your data, subject to legal retention requirements, and may raise concerns with the National Privacy Commission. Contact support@votex.app to exercise your rights.

## 7. Security
We use password hashing, short-lived access tokens, secure session cookies, encrypted connections, and role-based access controls. No internet service can guarantee absolute security.

## 8. Changes
We may update this policy to reflect changes in our practices or legal requirements. Material changes will be communicated through appropriate channels.

## 9. Contact Us
For privacy inquiries, contact support@votex.app.'),
('refund-policy', 'Refund Policy', 'This Refund Policy describes the conditions under which Votex Technologies may issue refunds for subscription purchases.',
'## 1. Refund Eligibility
A refund may be considered when a subscription was purchased within the last seven days and no pageant was created, when a duplicate payment was made in error, or when the platform was unavailable for more than 24 consecutive hours due to a Votex technical issue. Refunds are generally unavailable after a pageant has been created, for unused plan limits, expired or cancelled subscriptions, or accounts suspended for violating the Terms & Conditions.

## 2. How to Request a Refund
Contact support@votex.app with your account email, payment reference or PayMongo transaction ID, and reason for the request. Requests are reviewed within three business days. Processing time depends on the payment provider and method.

## 3. Manual Payments
Approved manual payments are refunded to the original payment source when possible. A manual payment pending review may be cancelled by contacting support; it has not activated the subscription.

## 4. Online Payments
PayMongo refunds follow the processing timelines of PayMongo and the card issuer or e-wallet provider. Votex initiates an approved refund after confirming eligibility.

## 5. Plan Changes
Plan upgrades and downgrades are subject to the available subscription options. Contact support@votex.app to discuss a change.

## 6. Contact
For refund-related inquiries, email support@votex.app with your account email and payment reference.');

