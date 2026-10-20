use chrono::Utc;
use org_owner::domain::subscription::SubscriptionPaymentProof;
use rust_decimal::Decimal;
use uuid::Uuid;

#[test]
fn payment_proof_exposes_review_and_revocation_history() {
    let proof = SubscriptionPaymentProof {
        id: Uuid::new_v4(),
        subscription_id: Uuid::new_v4(),
        organization_id: Uuid::new_v4(),
        organization_name: "Test Organization".into(),
        plan_name: "Starter".into(),
        amount: Decimal::new(1000, 2),
        amount_paid: Decimal::new(1000, 2),
        currency: "PHP".into(),
        payment_method: "GCASH".into(),
        reference_number: "REF-123".into(),
        proof_url: None,
        status: "REVOKED".into(),
        submitted_at: Utc::now(),
        reviewed_at: Some(Utc::now()),
        review_note: Some("Approved".into()),
        revoked_at: Some(Utc::now()),
        revocation_note: Some("Refund issued".into()),
    };
    let json = serde_json::to_value(proof).unwrap();
    assert_eq!(json["status"], "REVOKED");
    assert_eq!(json["review_note"], "Approved");
    assert_eq!(json["revocation_note"], "Refund issued");
}
