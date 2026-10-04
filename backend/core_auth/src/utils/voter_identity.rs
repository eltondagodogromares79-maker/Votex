use hmac::{Hmac, KeyInit, Mac};
use sha2::Sha256;
use uuid::Uuid;

type HmacSha256 = Hmac<Sha256>;

pub fn generate_voter_identity_hash(user_id: Uuid, secret: &[u8]) -> String {
    let mut mac = HmacSha256::new_from_slice(secret).expect("HMAC accepts keys of any length");

    mac.update(user_id.as_bytes());

    hex::encode(mac.finalize().into_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_user_id_and_secret_produce_same_hash() {
        let user_id = Uuid::new_v4();
        let secret = b"test-secret";

        let first = generate_voter_identity_hash(user_id, secret);

        let second = generate_voter_identity_hash(user_id, secret);

        assert_eq!(first, second);
    }

    #[test]
    fn different_user_ids_produce_different_hashes() {
        let first_user_id = Uuid::new_v4();
        let second_user_id = Uuid::new_v4();
        let secret = b"test-secret";

        let first = generate_voter_identity_hash(first_user_id, secret);

        let second = generate_voter_identity_hash(second_user_id, secret);

        assert_ne!(first, second);
    }

    #[test]
    fn different_secrets_produce_different_hashes() {
        let user_id = Uuid::new_v4();

        let first = generate_voter_identity_hash(user_id, b"secret-one");

        let second = generate_voter_identity_hash(user_id, b"secret-two");

        assert_ne!(first, second);
    }
}
