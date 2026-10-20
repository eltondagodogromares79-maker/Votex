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

#[cfg(test)]
mod tests {
    use super::validate_password;

    #[test]
    fn accepts_password_that_meets_all_rules() {
        assert!(validate_password("StrongPass1!").is_ok());
    }

    #[test]
    fn rejects_password_below_minimum_length() {
        assert_eq!(
            validate_password("Aa1!").unwrap_err().code,
            "password_too_short"
        );
    }

    #[test]
    fn rejects_password_above_maximum_length() {
        let password = format!("Aa1!{}", "x".repeat(125));
        assert_eq!(
            validate_password(&password).unwrap_err().code,
            "password_too_long"
        );
    }

    #[test]
    fn reports_each_missing_character_class() {
        for (password, expected) in [
            ("lowercase1!", "password_no_uppercase"),
            ("UPPERCASE1!", "password_no_lowercase"),
            ("NoDigits!!", "password_no_number"),
            ("NoSpecial1", "password_no_special"),
        ] {
            assert_eq!(validate_password(password).unwrap_err().code, expected);
        }
    }
}
