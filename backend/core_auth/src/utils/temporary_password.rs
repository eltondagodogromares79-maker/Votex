use rand::Rng;

/// Generates a short temporary password that satisfies the registration
/// complexity rules (uppercase, lowercase, digit, special character, 8–128 chars).
///
/// Format: `Aa1!` + 4 random characters from an unambiguous alphabet.
/// Total: 8 characters — short enough to type, complex enough to pass validation.
/// Example: `Aa1!k7Xp`
pub fn generate_temporary_password() -> String {
    // Unambiguous characters — excludes 0/O, 1/I/l to reduce copy errors
    const ALPHABET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let mut random = [0u8; 4];
    rand::rng().fill_bytes(&mut random);
    let suffix: String = random
        .iter()
        .map(|byte| ALPHABET[usize::from(*byte) % ALPHABET.len()] as char)
        .collect();
    // Prefix satisfies all complexity requirements:
    //   A → uppercase
    //   a → lowercase
    //   1 → digit
    //   ! → special character
    format!("Aa1!{suffix}")
}

#[cfg(test)]
mod tests {
    use super::generate_temporary_password;
    use crate::utils::password_validation::validate_password;

    #[test]
    fn temporary_password_is_valid_and_eight_characters() {
        for _ in 0..50 {
            let password = generate_temporary_password();
            assert_eq!(password.len(), 8);
            assert!(validate_password(&password).is_ok());
        }
    }
}
