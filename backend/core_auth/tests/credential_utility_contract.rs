use core_auth::utils::{
    password_validation::validate_password,
    refresh_token::{generate_refresh_token, hash_refresh_token},
    voter_identity::generate_voter_identity_hash,
};
use uuid::Uuid;

#[test]
fn refresh_and_voter_credentials_are_hashed_for_storage() {
    let refresh = generate_refresh_token();
    let user = Uuid::new_v4();
    let identity = generate_voter_identity_hash(user, b"integration-test-secret");
    assert_ne!(hash_refresh_token(&refresh), refresh);
    assert_eq!(identity.len(), 64);
    assert_ne!(identity, user.to_string());
}

#[test]
fn credential_validation_accepts_generated_strength_and_rejects_weak_values() {
    assert!(validate_password("StrongPass1!").is_ok());
    assert!(validate_password("password").is_err());
}
