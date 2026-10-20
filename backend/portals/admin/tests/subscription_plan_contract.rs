use admin::domain::subscription_plan::SubscriptionPlanKind;

#[test]
fn subscription_plan_kinds_have_stable_database_codes() {
    assert_eq!(SubscriptionPlanKind::OneTime.as_db_str(), "ONE_TIME");
    assert_eq!(SubscriptionPlanKind::Premium.as_db_str(), "PREMIUM");
    assert_eq!(SubscriptionPlanKind::Custom.as_db_str(), "CUSTOM");
}
