use serde_json::json;
use tabulator::domain::results::RoundResultEntry;
use uuid::Uuid;

#[test]
fn round_result_keeps_unscored_candidates_and_optional_category_fields() {
    let entry = RoundResultEntry {
        contestant_id: Uuid::new_v4(),
        contestant_number: 1,
        contestant_name: "Contestant One".into(),
        gender: Some("Female".into()),
        photo_url: None,
        contestant_status: "ACTIVE".into(),
        category_id: None,
        category_name: None,
        category_status: None,
        eligibility_scope: None,
        category_weight: None,
        score: None,
        submitted_judges: 0,
    };
    let value = serde_json::to_value(entry).unwrap();
    assert_eq!(value["score"], json!(null));
    assert_eq!(value["contestantNumber"], 1);
    assert_eq!(value["submittedJudges"], 0);
}
