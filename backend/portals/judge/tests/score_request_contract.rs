use judge::domain::setup::CriterionScoreInput;
use rust_decimal::Decimal;
use uuid::Uuid;

#[test]
fn score_request_accepts_frontend_camel_case_field_names() {
    let criterion_id = Uuid::new_v4();
    let json = serde_json::json!({ "roundCriterionId": criterion_id, "rawScore": "87.5" });
    let request: CriterionScoreInput = serde_json::from_value(json).unwrap();
    assert_eq!(request.round_criterion_id, criterion_id);
    assert_eq!(request.raw_score, Decimal::new(875, 1));
}

#[test]
fn score_request_rejects_missing_round_criterion_id() {
    let json = serde_json::json!({ "rawScore": "50" });
    assert!(serde_json::from_value::<CriterionScoreInput>(json).is_err());
}
