ALTER TABLE legal_policies
    DROP CONSTRAINT legal_policies_slug_check;

ALTER TABLE legal_policies
    ADD CONSTRAINT legal_policies_slug_check
    CHECK (slug IN ('terms', 'privacy', 'refund-policy', 'cookie-policy'));

INSERT INTO legal_policies (slug, title, intro, body)
VALUES (
    'cookie-policy',
    'Cookie Policy',
    'This Cookie Policy explains the cookies VoteX uses when you visit the site or sign in.',
    '## Essential session cookie: refresh_token
When you sign in, VoteX sets a refresh_token cookie so your session can be renewed securely. It is HttpOnly, so browser scripts cannot read it. Its Secure, SameSite, domain, path, and lifetime settings are configured by the service for the environment. Logging out clears this cookie.

## Sign-in routing preference: at_hint
The site may store an at_hint cookie containing your account role. The frontend uses it as a navigation hint when directing you to the appropriate portal. It is not an authentication credential and does not grant access. It is readable by the site JavaScript and is cleared when you sign out.

## Cookie choices
These cookies support sign-in and navigation. If you block or delete them, sign-in may not work as expected. VoteX does not use advertising cookies or cross-site behavioral tracking cookies.

## Changes and contact
We may update this policy when cookie use changes. For questions, contact support@votex.app.'
)
ON CONFLICT (slug) DO NOTHING;
