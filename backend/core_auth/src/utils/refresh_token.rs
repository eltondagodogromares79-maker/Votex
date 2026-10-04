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
