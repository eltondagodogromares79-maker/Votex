use validator::ValidationError;

pub fn validate_password(password: &str) -> Result<(), ValidationError> {
    if password.len() < 8 {
        let mut error = ValidationError::new("password_too_short");

        error.message = Some("Password must be at least 8 characters".into());

        return Err(error);
    }

    if password.len() > 128 {
        let mut error = ValidationError::new("password_too_long");

        error.message = Some("Password must be at most 128 characters".into());

        return Err(error);
    }

    if !password
        .chars()
        .any(|character| character.is_ascii_uppercase())
    {
        let mut error = ValidationError::new("password_no_uppercase");

        error.message = Some("Password must contain at least one uppercase letter".into());

        return Err(error);
    }

    if !password
        .chars()
        .any(|character| character.is_ascii_lowercase())
    {
        let mut error = ValidationError::new("password_no_lowercase");

        error.message = Some("Password must contain at least one lowercase letter".into());

        return Err(error);
    }

    if !password.chars().any(|character| character.is_ascii_digit()) {
        let mut error = ValidationError::new("password_no_number");

        error.message = Some("Password must contain at least one number".into());

        return Err(error);
    }

    if !password
        .chars()
        .any(|character| !character.is_ascii_alphanumeric())
    {
        let mut error = ValidationError::new("password_no_special");

        error.message = Some("Password must contain at least one special character".into());

        return Err(error);
    }

    Ok(())
}
