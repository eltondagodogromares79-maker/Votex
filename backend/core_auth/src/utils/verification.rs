use hmac::{Hmac, KeyInit, Mac};
use rand::RngExt;
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub fn generate_verification_code() -> String {
    let code: u32 = rand::rng().random_range(0..1_000_000);

    format!("{code:06}")
}

pub fn hash_verification_code(code: &str, secret: &[u8]) -> String {
    let mut mac = HmacSha256::new_from_slice(secret).expect("HMAC accepts keys of any length");

    mac.update(code.as_bytes());

    hex::encode(mac.finalize().into_bytes())
}

#[cfg(test)]
mod tests {
    use super::{generate_verification_code, hash_verification_code};

    #[test]
    fn verification_code_is_six_digits() {
        for _ in 0..100 {
            let code = generate_verification_code();
            assert_eq!(code.len(), 6);
            assert!(code.bytes().all(|byte| byte.is_ascii_digit()));
        }
    }

    #[test]
    fn verification_hash_is_secret_bound() {
        let code = "012345";
        assert_eq!(
            hash_verification_code(code, b"one"),
            hash_verification_code(code, b"one")
        );
        assert_ne!(
            hash_verification_code(code, b"one"),
            hash_verification_code(code, b"two")
        );
    }
}
