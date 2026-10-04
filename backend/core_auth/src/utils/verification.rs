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
