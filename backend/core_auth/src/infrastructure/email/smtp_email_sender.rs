use async_trait::async_trait;
use lettre::{
    AsyncTransport, Message, Tokio1Executor,
    message::{Mailbox, MultiPart, SinglePart, header::ContentType},
    transport::smtp::{AsyncSmtpTransport, authentication::Credentials},
};

use core_infra::AppError;

use crate::application::ports::email_service::EmailSender;

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

pub struct SmtpEmailSender {
    mailer: AsyncSmtpTransport<Tokio1Executor>,
    from_address: String,
    from_name: String,
    frontend_url: String,
}

impl SmtpEmailSender {
    pub fn new(
        smtp_host: String,
        smtp_port: u16,
        smtp_username: String,
        smtp_password: String,
        from_address: String,
        from_name: String,
        frontend_url: String,
    ) -> Result<Self, AppError> {
        let credentials = Credentials::new(smtp_username, smtp_password);

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&smtp_host)
            .map_err(|error| AppError::ExternalService(Box::new(error)))?
            .port(smtp_port)
            .credentials(credentials)
            .build();

        Ok(Self {
            mailer,
            from_address,
            from_name,
            frontend_url,
        })
    }
}

#[async_trait]
impl EmailSender for SmtpEmailSender {
    async fn send_verification_email(
        &self,
        recipient: &str,
        first_name: &str,
        code: &str,
        expiry_minutes: i64,
        account_type: &str,
    ) -> Result<(), AppError> {
        let subject = "Verify your VoteX email address";

        let text_body = format!(
            "Hi {first_name},

Your VoteX verification code is:

{code}

This code expires in {expiry_minutes} minutes.

Account type: {account_type}

If you did not create this VoteX account,
you can safely ignore this email.

Regards,
VoteX"
        );

        let html_body = format!(
            r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >
    <title>Verify your VoteX email</title>
</head>

<body style="
    margin:0;
    padding:0;
    background-color:#f4f4f5;
    font-family:Arial,Helvetica,sans-serif;
">
    <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
            background-color:#f4f4f5;
            padding:40px 0;
        "
    >
        <tr>
            <td align="center">

                <table
                    width="480"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        background-color:#ffffff;
                        border-radius:8px;
                    "
                >

                    <!-- Header -->
                    <tr>
                        <td style="
                            background-color:#0f1e36;
                            padding:28px 40px;
                        ">
                            <p style="
                                margin:0;
                                color:#c9a84c;
                                font-family:Georgia,serif;
                                font-size:18px;
                                font-weight:bold;
                                letter-spacing:0.2em;
                            ">
                                VOTEX
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">

                            <p style="
                                margin:0 0 8px;
                                color:#0f1e36;
                                font-size:22px;
                                font-weight:700;
                            ">
                                Verify your email address
                            </p>

                            <p style="
                                margin:0 0 28px;
                                color:#6b7280;
                                font-size:15px;
                                line-height:1.6;
                            ">
                                Hi <strong>{first_name}</strong>,
                                use the code below to verify your
                                email and complete your VoteX
                                <strong>{account_type}</strong>
                                registration.
                            </p>

                            <!-- Verification code -->
                            <div style="
                                background-color:#f9fafb;
                                border:2px solid #e5e7eb;
                                border-radius:8px;
                                padding:24px;
                                text-align:center;
                                margin-bottom:28px;
                            ">

                                <p style="
                                    margin:0 0 8px;
                                    color:#9ca3af;
                                    font-size:12px;
                                    font-weight:600;
                                    letter-spacing:0.14em;
                                    text-transform:uppercase;
                                ">
                                    Your verification code
                                </p>

                                <p style="
                                    margin:0;
                                    color:#0f1e36;
                                    font-family:'Courier New',Courier,monospace;
                                    font-size:40px;
                                    font-weight:700;
                                    letter-spacing:0.5em;
                                ">
                                    {code}
                                </p>

                            </div>

                            <p style="
                                margin:0 0 28px;
                                color:#6b7280;
                                font-size:14px;
                                line-height:1.6;
                            ">
                                This code expires in
                                <strong>{expiry_minutes} minutes</strong>.
                            </p>

                            <p style="
                                margin:0 0 24px;
                                color:#6b7280;
                                font-size:14px;
                                line-height:1.6;
                            ">
                                If you did not create a VoteX account,
                                you can safely ignore this email.
                            </p>

                            <hr style="
                                border:0;
                                border-top:1px solid #e5e7eb;
                                margin:0 0 24px;
                            ">

                            <p style="
                                margin:0;
                                color:#9ca3af;
                                font-size:12px;
                            ">
                                VoteX
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</body>
</html>"#
        );

        let from_mailbox: Mailbox = format!("{} <{}>", self.from_name, self.from_address)
            .parse()
            .map_err(|error| {
                AppError::Configuration(format!("invalid email sender address: {error}"))
            })?;

        let to_mailbox: Mailbox = recipient.parse().map_err(|error| {
            AppError::BadRequest(format!("invalid recipient email address: {error}"))
        })?;

        let email = Message::builder()
            .from(from_mailbox)
            .to(to_mailbox)
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(text_body),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html_body),
                    ),
            )
            .map_err(|_| AppError::Internal)?;

        self.mailer
            .send(email)
            .await
            .map_err(|error| AppError::ExternalService(Box::new(error)))?;

        Ok(())
    }

    async fn send_staff_credentials_email(
        &self,
        recipient: &str,
        first_name: &str,
        role_name: &str,
        temporary_password: &str,
    ) -> Result<(), AppError> {
        let subject = format!("Your VoteX {role_name} account");
        let configured_frontend = self.frontend_url.trim_end_matches('/');
        let frontend_base = if configured_frontend.contains("://") {
            configured_frontend.to_owned()
        } else {
            format!("http://{configured_frontend}")
        };
        let login_url = format!("{frontend_base}/login/organization");

        let text_body = format!(
            "Hi {first_name},

A VoteX {role_name} account has been created for you.

Your temporary password is:

{temporary_password}

Sign in at VoteX with this email address and change your password
after your first login. Keep this password private and do not
forward this message.

Sign in here: {login_url}

If you were not expecting this, please contact your organization
owner immediately.

Regards,
VoteX"
        );

        let html_body = format!(
            r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your VoteX {role_name} account</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background-color:#f4f4f5;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" border="0"
                    style="background-color:#ffffff;border-radius:8px;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#0f1e36;padding:28px 40px;">
                            <p style="margin:0;color:#c9a84c;font-family:Georgia,serif;
                                font-size:18px;font-weight:bold;letter-spacing:0.2em;">
                                VOTEX
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">

                            <p style="margin:0 0 8px;color:#0f1e36;font-size:22px;font-weight:700;">
                                Your {role_name} account is ready
                            </p>

                            <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
                                Hi <strong>{first_name}</strong>,
                                a VoteX <strong>{role_name}</strong> account has been created
                                for you. Use the temporary password below to sign in for the
                                first time, then change it immediately from your account
                                settings.
                            </p>

                            <!-- Temporary password block -->
                            <div style="background-color:#f9fafb;border:2px solid #e5e7eb;
                                border-radius:8px;padding:24px;text-align:center;margin-bottom:28px;">
                                <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;
                                    font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">
                                    Temporary password
                                </p>
                                <p style="margin:0;color:#0f1e36;
                                    font-family:'Courier New',Courier,monospace;
                                    font-size:24px;font-weight:700;letter-spacing:0.15em;">
                                    {temporary_password}
                                </p>
                            </div>

                            <p style="margin:0 0 24px;">
                                <a href="{login_url}" style="display:inline-block;background:#c9a84c;color:#0f1e36;padding:13px 20px;text-decoration:none;font-weight:bold;">
                                    Sign in to your organization
                                </a>
                            </p>

                            <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
                                <strong>Important:</strong> keep this password private and
                                do not forward this email. Change your password after your
                                first login.
                            </p>

                            <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
                                If you were not expecting this invitation, please contact
                                your organization owner immediately.
                            </p>

                            <hr style="border:0;border-top:1px solid #e5e7eb;margin:0 0 24px;">

                            <p style="margin:0;color:#9ca3af;font-size:12px;">VoteX</p>

                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>"#
        );

        let from_mailbox: Mailbox = format!("{} <{}>", self.from_name, self.from_address)
            .parse()
            .map_err(|e| AppError::Configuration(format!("invalid sender address: {e}")))?;

        let to_mailbox: Mailbox = recipient
            .parse()
            .map_err(|e| AppError::BadRequest(format!("invalid recipient address: {e}")))?;

        let email = Message::builder()
            .from(from_mailbox)
            .to(to_mailbox)
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(text_body),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html_body),
                    ),
            )
            .map_err(|_| AppError::Internal)?;

        self.mailer
            .send(email)
            .await
            .map_err(|e| AppError::ExternalService(Box::new(e)))?;

        Ok(())
    }

    async fn send_pageant_staff_credentials_email(
        &self,
        recipient: &str,
        first_name: &str,
        role_name: &str,
        temporary_password: &str,
        pageant_name: &str,
        pageant_id: uuid::Uuid,
        pageant_slug: &str,
    ) -> Result<(), AppError> {
        let role = role_name.to_ascii_lowercase();
        let query = url::form_urlencoded::Serializer::new(String::new())
            .append_pair("role", &role)
            .append_pair("pageantId", &pageant_id.to_string())
            .append_pair("name", pageant_name)
            .finish();
        let configured_frontend = self.frontend_url.trim_end_matches('/');
        let frontend_base = if configured_frontend.contains("://") {
            configured_frontend.to_owned()
        } else {
            format!("http://{configured_frontend}")
        };
        let login_url = format!(
            "{frontend_base}/pageants/{}/staff-login?{}",
            pageant_slug, query,
        );
        let html_login_url = login_url.replace('&', "&amp;");
        let safe_pageant_name = escape_html(pageant_name);
        let safe_first_name = escape_html(first_name);
        let safe_role_name = escape_html(role_name);
        let safe_temporary_password = escape_html(temporary_password);
        let subject = format!("Your VoteX {role_name} account for {pageant_name}");
        let text_body = format!(
            "Hi {first_name},\n\nA VoteX {role_name} account has been created for you for {pageant_name}.\n\nYour temporary password is:\n\n{temporary_password}\n\nSign in to this pageant here:\n{login_url}\n\nChange your password after your first login. Keep this password private and do not forward this message.\n\nIf you were not expecting this, please contact your organization owner immediately.\n\nRegards,\nVoteX"
        );
        let html_body = format!(
            r#"<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your VoteX {safe_role_name} account</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f4f5"><tr><td align="center"><table width="480" cellpadding="0" cellspacing="0" style="background:#fff"><tr><td style="background:#0f1e36;padding:28px 40px"><p style="margin:0;color:#c9a84c;font-family:Georgia,serif;font-size:18px;font-weight:bold;letter-spacing:.2em">VOTEX</p></td></tr><tr><td style="padding:40px"><p style="margin:0 0 8px;color:#0f1e36;font-size:22px;font-weight:700">Your {safe_role_name} account is ready</p><p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6">Hi <strong>{safe_first_name}</strong>, your account for <strong>{safe_pageant_name}</strong> has been created.</p><div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px"><p style="margin:0 0 8px;color:#9ca3af;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase">Temporary password</p><p style="margin:0;color:#0f1e36;font-family:'Courier New',Courier,monospace;font-size:24px;font-weight:700;letter-spacing:.15em">{safe_temporary_password}</p></div><p style="margin:0 0 22px;color:#6b7280;font-size:14px;line-height:1.6">Use the pageant-specific link below to sign in. You will be taken to your assigned pageant after login.</p><p style="margin:0 0 28px"><a href="{html_login_url}" style="display:inline-block;background:#c9a84c;color:#0f1e36;padding:13px 20px;text-decoration:none;font-weight:bold">Sign in to {safe_pageant_name}</a></p><p style="margin:0 0 20px;color:#6b7280;font-size:13px;line-height:1.6">Change your password after your first login and keep the temporary password private.</p><hr style="border:0;border-top:1px solid #e5e7eb;margin:0 0 24px"><p style="margin:0;color:#9ca3af;font-size:12px">VoteX</p></td></tr></table></td></tr></table></body></html>"#
        );

        let from_mailbox: Mailbox = format!("{} <{}>", self.from_name, self.from_address)
            .parse()
            .map_err(|e| AppError::Configuration(format!("invalid sender address: {e}")))?;
        let to_mailbox: Mailbox = recipient
            .parse()
            .map_err(|e| AppError::BadRequest(format!("invalid recipient address: {e}")))?;
        let message = Message::builder()
            .from(from_mailbox)
            .to(to_mailbox)
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(text_body),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html_body),
                    ),
            )
            .map_err(|_| AppError::Internal)?;
        self.mailer
            .send(message)
            .await
            .map_err(|error| AppError::ExternalService(Box::new(error)))?;
        Ok(())
    }
}
