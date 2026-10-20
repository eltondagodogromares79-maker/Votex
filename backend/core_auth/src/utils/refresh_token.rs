use rand::Rng;
use sha2::{Digest, Sha256};

/// Generates a cryptographically random refresh token.
///
/// The returned value is the raw token that may be given to the client.
/// It must never be stored directly in the database.
pub fn generate_refresh_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);

    hex::encode(bytes)
}

/// Hashes a refresh token for database storage/comparison.
///
/// Only the hash should be persisted.
pub fn hash_refresh_token(token: &str) -> String {
    let digest = Sha256::digest(token.as_bytes());
    hex::encode(digest)
}

#[cfg(test)]
mod tests {
    use super::{generate_refresh_token, hash_refresh_token};

    #[test]
    fn refresh_tokens_are_random_hex_and_have_expected_entropy_length() {
        let first = generate_refresh_token();
        let second = generate_refresh_token();
        assert_eq!(first.len(), 64);
        assert!(first.bytes().all(|byte| byte.is_ascii_hexdigit()));
        assert_ne!(first, second);
    }

    #[test]
    fn hashes_are_stable_and_do_not_equal_raw_token() {
        let hash = hash_refresh_token("raw-token");
        assert_eq!(hash, hash_refresh_token("raw-token"));
        assert_ne!(hash, "raw-token");
        assert_eq!(hash.len(), 64);
    }
}
