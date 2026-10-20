use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use core_infra::AppError;

/// Hash a plaintext password using Argon2id.
/// This is CPU-intensive by design — call from a blocking task in production.
pub fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|_e| AppError::Internal)
}

/// Verify a plaintext password against a stored Argon2id hash.
pub fn verify_password(password: &str, hash: &str) -> Result<bool, AppError> {
    let parsed = PasswordHash::new(hash).map_err(|_| AppError::Internal)?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok())
}

#[cfg(test)]
mod tests {
    use super::{hash_password, verify_password};

    #[test]
    fn password_hash_verifies_only_the_original_password() {
        let hash = hash_password("SafePassword1!").unwrap();
        assert_ne!(hash, "SafePassword1!");
        assert!(verify_password("SafePassword1!", &hash).unwrap());
        assert!(!verify_password("DifferentPassword1!", &hash).unwrap());
    }

    #[test]
    fn malformed_password_hash_returns_an_error() {
        assert!(verify_password("SafePassword1!", "not-an-argon2-hash").is_err());
    }
}
