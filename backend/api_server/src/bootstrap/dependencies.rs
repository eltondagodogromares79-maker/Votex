use std::sync::Arc;

use core_auth::{
    application::{
        authorization::AuthorizationApplication, email_verification::EmailVerificationApplication,
        login::AuthenticationApplication, logout::LogoutApplication,
        password_management::PasswordManagementApplication, ports::token_validator::TokenValidator,
        profile::ProfileApplication, refresh_token::RefreshTokenApplication,
        registration::RegistrationApplication,
    },
    infrastructure::{
        email::smtp_email_sender::SmtpEmailSender,
        jwt::{token_issuer::JwtTokenIssuer, token_validator::JwtTokenValidator},
        postgres::{
            authentication_workflow::PostgresAuthenticationWorkflow,
            authorization_workflow::PostgresAuthorizationWorkflow,
            email_verification_workflow::PostgresEmailVerificationWorkflow,
            logout_workflow::PostgresLogoutWorkflow,
            password_management_workflow::PostgresPasswordManagementWorkflow,
            profile_workflow::PostgresProfileWorkflow,
            refresh_token_workflow::PostgresRefreshTokenWorkflow,
            registration_workflow::PostgresRegistrationWorkflow,
            session_workflow::PostgresSessionWorkflow,
            user_role_workflow::PostgresUserRoleWorkflow,
        },
    },
};

use admin::{
    application::{
        activity_logs::ActivityLogApplication, admin_directory::AdminDirectoryApplication,
        revenue::RevenueApplication, subscription_plans::SubscriptionPlanApplication,
    },
    infrastructure::postgres::{
        activity_log_workflow::PostgresActivityLogWorkflow,
        admin_directory_workflow::PostgresAdminDirectoryWorkflow,
        revenue_workflow::PostgresRevenueWorkflow,
        subscription_plan_workflow::PostgresSubscriptionPlanWorkflow,
    },
};
use audience::{
    application::{
        transactions::TransactionHistoryApplication as AudienceTransactionHistoryApplication,
        voting::VotingApplication,
    },
    infrastructure::postgres::{
        transaction_history_workflow::PostgresTransactionHistoryWorkflow,
        voting_workflow::PostgresVotingWorkflow,
    },
};
use coordinator::{
    application::{
        contestants::ContestantApplication, judges::CoordinatorJudgeApplication,
        pageant_setup::PageantSetupApplication, pageants::CoordinatorPageantApplication,
        rounds::RoundApplication,
    },
    infrastructure::postgres::{
        contestant_workflow::PostgresContestantWorkflow,
        judge_workflow::PostgresJudgeWorkflow as PostgresCoordinatorJudgeWorkflow,
        pageant_setup_workflow::PostgresPageantSetupWorkflow,
        pageant_workflow::PostgresPageantWorkflow as PostgresCoordinatorPageantWorkflow,
        round_workflow::PostgresRoundWorkflow,
    },
};
use core_infra::{
    application::ports::payment_provider::PaymentProvider,
    config::{AuthConfig, PaymentConfig},
    infrastructure::payments::paymongo::PayMongoClient,
};
use judge::{
    application::judges::JudgeApplication,
    infrastructure::postgres::judge_workflow::PostgresJudgeWorkflow,
};
use org_owner::{
    application::{
        coordinators::CoordinatorApplication, pageant_staff::PageantStaffApplication,
        pageants::PageantApplication, subscriptions::SubscriptionApplication,
        transactions::TransactionHistoryApplication as OrganizationTransactionHistoryApplication,
        vote_packages::VotePackageApplication, vote_revenue::VoteRevenueApplication,
    },
    infrastructure::postgres::{
        coordinator_workflow::PostgresCoordinatorWorkflow,
        pageant_staff_workflow::PostgresPageantStaffWorkflow,
        pageant_workflow::PostgresPageantWorkflow,
        subscription_workflow::PostgresSubscriptionWorkflow,
        transaction_history_workflow::PostgresTransactionHistoryWorkflow as PostgresOrganizationTransactionHistoryWorkflow,
        vote_package_workflow::PostgresVotePackageWorkflow,
        vote_revenue_workflow::PostgresVoteRevenueWorkflow,
    },
};
use sqlx::PgPool;
use tabulator::{
    application::tabulation::TabulationApplication,
    infrastructure::postgres::tabulation_workflow::PostgresTabulationWorkflow,
};

/// All runtime dependencies required by the HTTP application.
///
/// This is the composition root for the `api_server` crate.
/// Application and infrastructure construction belongs here;
/// Actix HTTP wiring belongs in `server.rs`.
pub struct ApplicationDependencies {
    // ------------------------------------------------------------
    // Application services
    // ------------------------------------------------------------
    pub registration: Arc<RegistrationApplication>,
    pub email_verification: Arc<EmailVerificationApplication>,
    pub authentication: Arc<AuthenticationApplication>,
    pub refresh_token: Arc<RefreshTokenApplication>,
    pub logout: Arc<LogoutApplication>,
    pub password_management: Arc<PasswordManagementApplication>,
    pub profile: Arc<ProfileApplication>,
    pub authorization: Arc<AuthorizationApplication>,
    pub pageants: Arc<PageantApplication>,
    pub coordinators: Arc<CoordinatorApplication>,
    pub vote_packages: Arc<VotePackageApplication>,
    pub org_subscriptions: Arc<SubscriptionApplication>,
    pub org_vote_revenue: Arc<VoteRevenueApplication>,
    pub org_transactions: Arc<OrganizationTransactionHistoryApplication>,
    pub pageant_staff: Arc<PageantStaffApplication>,
    pub coordinator_pageants: Arc<CoordinatorPageantApplication>,
    pub coordinator_judges: Arc<CoordinatorJudgeApplication>,
    pub coordinator_contestants: Arc<ContestantApplication>,
    pub coordinator_pageant_setup: Arc<PageantSetupApplication>,
    pub coordinator_rounds: Arc<RoundApplication>,
    pub judge: Arc<JudgeApplication>,
    pub tabulation: Arc<TabulationApplication>,
    pub audience_voting: Arc<VotingApplication>,
    pub audience_transactions: Arc<AudienceTransactionHistoryApplication>,
    pub subscription_plans: Arc<SubscriptionPlanApplication>,
    pub admin_directory: Arc<AdminDirectoryApplication>,
    pub revenue: Arc<RevenueApplication>,
    pub activity_logs: Arc<ActivityLogApplication>,

    // ------------------------------------------------------------
    // Infrastructure services exposed to HTTP
    // ------------------------------------------------------------
    pub token_validator: Arc<dyn TokenValidator>,

    // ------------------------------------------------------------
    // Configuration
    // ------------------------------------------------------------
    pub auth_config: AuthConfig,
    pub payment_provider: Arc<dyn PaymentProvider>,
}

/// Build all application and infrastructure dependencies.
pub fn build_dependencies(
    auth_config: &AuthConfig,
    payment_config: &PaymentConfig,
    pool: PgPool,
) -> std::io::Result<ApplicationDependencies> {
    let email_sender = Arc::new(
        SmtpEmailSender::new(
            auth_config.smtp_host.clone(),
            auth_config.smtp_port,
            auth_config.smtp_username.clone(),
            auth_config.smtp_password.clone(),
            auth_config.email_from_address.clone(),
            auth_config.email_from_name.clone(),
        )
        .map_err(|error| std::io::Error::other(error.to_string()))?,
    );
    let payment_provider: Arc<dyn PaymentProvider> =
        Arc::new(PayMongoClient::new(payment_config).map_err(std::io::Error::other)?);
    // ============================================================
    // Registration infrastructure
    // ============================================================

    let registration_workflow = Arc::new(PostgresRegistrationWorkflow::new(pool.clone()));

    // ============================================================
    // Authentication infrastructure
    // ============================================================

    let authentication_workflow = Arc::new(PostgresAuthenticationWorkflow::new(
        pool.clone(),
        auth_config.max_failed_login_attempts,
        auth_config.account_lock_duration_minutes,
        auth_config.login_failure_window_minutes,
    ));

    // ============================================================
    // Session infrastructure
    // ============================================================

    let session_workflow = Arc::new(PostgresSessionWorkflow::new(
        pool.clone(),
        auth_config.jwt_refresh_token_ttl_days,
    ));

    // ============================================================
    // Refresh-token infrastructure
    // ============================================================

    let refresh_token_workflow = Arc::new(PostgresRefreshTokenWorkflow::new(
        pool.clone(),
        auth_config.jwt_refresh_token_ttl_days,
    ));

    // ============================================================
    // Logout infrastructure
    // ============================================================

    let logout_workflow = Arc::new(PostgresLogoutWorkflow::new(pool.clone()));

    // ============================================================
    // Authorization infrastructure
    // ============================================================

    let authorization_workflow = Arc::new(PostgresAuthorizationWorkflow::new(pool.clone()));

    // ============================================================
    // JWT infrastructure
    // ============================================================

    let token_issuer = Arc::new(JwtTokenIssuer::new(
        &auth_config.jwt_secret,
        auth_config.jwt_issuer.clone(),
        auth_config.jwt_audience.clone(),
        auth_config.jwt_access_token_ttl_minutes,
    ));

    let token_validator: Arc<dyn TokenValidator> = Arc::new(JwtTokenValidator::new(
        &auth_config.jwt_secret,
        auth_config.jwt_issuer.clone(),
        auth_config.jwt_audience.clone(),
    ));

    // ============================================================
    // User role resolution infrastructure
    // ============================================================

    let user_role_workflow = Arc::new(PostgresUserRoleWorkflow::new(pool.clone()));

    // ============================================================
    // Authentication application
    // ============================================================

    let authentication = Arc::new(AuthenticationApplication::new(
        authentication_workflow,
        session_workflow,
        token_issuer.clone(),
        user_role_workflow.clone(),
    ));

    // ============================================================
    // Refresh-token application
    // ============================================================

    let refresh_token = Arc::new(RefreshTokenApplication::new(
        refresh_token_workflow,
        token_issuer,
        user_role_workflow,
    ));

    // ============================================================
    // Logout application
    // ============================================================

    let logout = Arc::new(LogoutApplication::new(logout_workflow));
    let password_management_workflow =
        Arc::new(PostgresPasswordManagementWorkflow::new(pool.clone()));
    let password_management = Arc::new(PasswordManagementApplication::new(
        password_management_workflow,
    ));
    let profile = Arc::new(ProfileApplication::new(Arc::new(
        PostgresProfileWorkflow::new(pool.clone()),
    )));

    // ============================================================
    // Authorization application
    // ============================================================

    let authorization = Arc::new(AuthorizationApplication::new(authorization_workflow));

    // ============================================================
    // Organization-owner portal workflows
    // ============================================================

    let org_subscription_workflow = Arc::new(PostgresSubscriptionWorkflow::new(pool.clone()));
    let org_subscriptions = Arc::new(SubscriptionApplication::new(
        org_subscription_workflow.clone(),
        payment_provider.clone(),
    ));
    let pageant_workflow = Arc::new(PostgresPageantWorkflow::new(pool.clone()));
    let pageants = Arc::new(PageantApplication::new(pageant_workflow, org_subscription_workflow.clone()));
    let coordinator_workflow = Arc::new(PostgresCoordinatorWorkflow::new(pool.clone()));
    let coordinators = Arc::new(CoordinatorApplication::new(
        coordinator_workflow,
        email_sender.clone(),
    ));
    let vote_package_workflow = Arc::new(PostgresVotePackageWorkflow::new(pool.clone()));
    let vote_packages = Arc::new(VotePackageApplication::new(vote_package_workflow, org_subscription_workflow.clone()));
    let org_vote_revenue_workflow = Arc::new(PostgresVoteRevenueWorkflow::new(pool.clone()));
    let org_vote_revenue = Arc::new(VoteRevenueApplication::new(org_vote_revenue_workflow));
    let org_transaction_workflow = Arc::new(PostgresOrganizationTransactionHistoryWorkflow::new(
        pool.clone(),
    ));
    let org_transactions = Arc::new(OrganizationTransactionHistoryApplication::new(
        org_transaction_workflow,
    ));
    let pageant_staff_workflow = Arc::new(PostgresPageantStaffWorkflow::new(pool.clone()));
    let pageant_staff = Arc::new(PageantStaffApplication::new(
        pageant_staff_workflow,
        email_sender.clone(),
    ));
    let coordinator_pageant_workflow =
        Arc::new(PostgresCoordinatorPageantWorkflow::new(pool.clone()));
    let coordinator_pageants = Arc::new(CoordinatorPageantApplication::new(
        coordinator_pageant_workflow,
    ));
    let coordinator_judge_workflow = Arc::new(PostgresCoordinatorJudgeWorkflow::new(pool.clone()));
    let coordinator_judges = Arc::new(CoordinatorJudgeApplication::new(
        coordinator_judge_workflow,
        email_sender.clone(),
    ));
    let coordinator_contestant_workflow = Arc::new(PostgresContestantWorkflow::new(pool.clone()));
    let coordinator_contestants =
        Arc::new(ContestantApplication::new(coordinator_contestant_workflow));
    let coordinator_pageant_setup_workflow =
        Arc::new(PostgresPageantSetupWorkflow::new(pool.clone()));
    let coordinator_pageant_setup = Arc::new(PageantSetupApplication::new(
        coordinator_pageant_setup_workflow,
    ));
    let coordinator_round_workflow = Arc::new(PostgresRoundWorkflow::new(pool.clone()));
    let coordinator_rounds = Arc::new(RoundApplication::new(coordinator_round_workflow));
    let judge = Arc::new(JudgeApplication::new(Arc::new(PostgresJudgeWorkflow::new(
        pool.clone(),
    ))));
    let tabulation = Arc::new(TabulationApplication::new(Arc::new(
        PostgresTabulationWorkflow::new(pool.clone()),
    )));
    let audience_voting = Arc::new(VotingApplication::new(
        Arc::new(PostgresVotingWorkflow::new(pool.clone())),
        payment_provider.clone(),
    ));
    let audience_transactions = Arc::new(AudienceTransactionHistoryApplication::new(Arc::new(
        PostgresTransactionHistoryWorkflow::new(pool.clone()),
    )));

    // ============================================================
    // Platform-admin subscription plan workflows
    // ============================================================

    let subscription_plan_workflow = Arc::new(PostgresSubscriptionPlanWorkflow::new(pool.clone()));
    let subscription_plans = Arc::new(SubscriptionPlanApplication::new(subscription_plan_workflow));
    let admin_directory_workflow = Arc::new(PostgresAdminDirectoryWorkflow::new(pool.clone()));
    let admin_directory = Arc::new(AdminDirectoryApplication::new(admin_directory_workflow));
    let revenue_workflow = Arc::new(PostgresRevenueWorkflow::new(pool.clone()));
    let revenue = Arc::new(RevenueApplication::new(revenue_workflow));
    let activity_log_workflow = Arc::new(PostgresActivityLogWorkflow::new(pool.clone()));
    let activity_logs = Arc::new(ActivityLogApplication::new(activity_log_workflow));

    // ============================================================
    // Email infrastructure
    // ============================================================

    // ============================================================
    // Email-verification infrastructure
    // ============================================================

    let email_verification_workflow =
        Arc::new(PostgresEmailVerificationWorkflow::new(pool.clone()));

    // ============================================================
    // Email-verification application
    // ============================================================

    let email_verification = Arc::new(EmailVerificationApplication::new(
        email_verification_workflow,
        auth_config.registration_verification_secret.clone(),
    ));

    // ============================================================
    // Registration application
    // ============================================================

    let registration = Arc::new(RegistrationApplication::new(
        registration_workflow,
        auth_config.registration_verification_secret.clone(),
        auth_config.voter_identity_secret.clone(),
        email_sender,
        auth_config.email_code_expiry_minutes,
    ));

    // ============================================================
    // Return all dependencies
    // ============================================================

    Ok(ApplicationDependencies {
        registration,
        email_verification,
        authentication,
        refresh_token,
        logout,
        password_management,
        profile,
        authorization,
        pageants,
        coordinators,
        vote_packages,
        org_subscriptions,
        org_vote_revenue,
        org_transactions,
        pageant_staff,
        coordinator_pageants,
        coordinator_judges,
        coordinator_contestants,
        coordinator_pageant_setup,
        coordinator_rounds,
        judge,
        tabulation,
        audience_voting,
        audience_transactions,
        subscription_plans,
        admin_directory,
        revenue,
        activity_logs,
        token_validator,
        auth_config: auth_config.clone(),
        payment_provider,
    })
}
