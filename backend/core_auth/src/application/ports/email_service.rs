use async_trait::async_trait;

use core_infra::AppError;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait EmailSender: Send + Sync {
    /// Sends a verification email containing a 6-digit code.
    ///
    /// `recipient`      — destination email address
    /// `first_name`     — recipient's first name
    /// `code`           — plain-text 6-digit verification code
    /// `expiry_minutes` — validity window shown in the email
    /// `account_type`   — account type shown in the email
    async fn send_verification_email(
        &self,
        recipient: &str,
        first_name: &str,
        code: &str,
        expiry_minutes: i64,
        account_type: &str,
    ) -> Result<(), AppError>;

    async fn send_staff_credentials_email(
        &self,
        recipient: &str,
        first_name: &str,
        role_name: &str,
        temporary_password: &str,
    ) -> Result<(), AppError> {
        let _ = (recipient, first_name, role_name, temporary_password);
        Err(AppError::Internal)
    }
}
