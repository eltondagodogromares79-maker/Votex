use audience::contracts::voting::StartVoteRequest;
use serde_json::json;
use uuid::Uuid;

#[test]
fn start_vote_requires_candidate_and_package_ids() {
    let contestant = Uuid::new_v4();
    let package = Uuid::new_v4();
    let request: StartVoteRequest = serde_json::from_value(json!({
        "contestant_id": contestant,
        "package_id": package
    }))
    .unwrap();
    assert_eq!(request.contestant_id, contestant);
    assert_eq!(request.package_id, package);
    assert!(
        serde_json::from_value::<StartVoteRequest>(json!({"contestant_id": contestant})).is_err()
    );
}
