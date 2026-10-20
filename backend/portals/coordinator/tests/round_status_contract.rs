use coordinator::domain::round::RoundStatus;

#[test]
fn round_status_wire_values_match_api_contract() {
    for (status, expected) in [
        (RoundStatus::Draft, "DRAFT"),
        (RoundStatus::Open, "OPEN"),
        (RoundStatus::Closed, "CLOSED"),
        (RoundStatus::Finalized, "FINALIZED"),
    ] {
        assert_eq!(
            serde_json::to_string(&status).unwrap(),
            format!("\"{expected}\"")
        );
        assert_eq!(status.as_db_str(), expected);
    }
}
