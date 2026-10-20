use std::env;

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub database: DatabaseConfig,
    pub server: ServerConfig,
    pub auth: AuthConfig,
    pub payments: PaymentConfig,
    pub env: AppEnv,
}

#[derive(Debug, Clone)]
pub struct PaymentConfig {
    pub subscription_mode: SubscriptionPaymentMode,
    pub paymongo_secret_key: String,
    pub paymongo_webhook_secret: String,
    pub paymongo_success_url: String,
    pub paymongo_cancel_url: String,
    pub paymongo_payment_methods: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SubscriptionPaymentMode {
    Manual,
    Automated,
}

impl SubscriptionPaymentMode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Manual => "MANUAL",
            Self::Automated => "AUTOMATED",
        }
    }
}

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub migrator_url: String,
    pub runtime_role: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub acquire_timeout_secs: u64,
}

#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub frontend_url: String,
}

impl ServerConfig {
    pub fn bind_address(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

#[derive(Debug, Clone)]
pub struct AuthConfig {
    pub registration_verification_secret: String,
    pub voter_identity_secret: String,

    pub max_failed_login_attempts: i32,
    pub account_lock_duration_minutes: i64,
    pub login_failure_window_minutes: i64,

    pub jwt_secret: String,
    pub jwt_issuer: String,
    pub jwt_audience: String,
    pub jwt_access_token_ttl_minutes: i64,
    pub jwt_refresh_token_ttl_days: i64,

    pub cookie_secure: bool,
    pub cookie_domain: Option<String>,
    pub cookie_same_site: String,
    pub cookie_path: String,

    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,

    pub email_from_address: String,
    pub email_from_name: String,

    pub email_code_expiry_minutes: i64,
}
#[derive(Debug, Clone, PartialEq)]
pub enum AppEnv {
    Development,
    Production,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            database: DatabaseConfig {
                url: require_env("DATABASE_URL"),
                // Schema migrations and runtime queries must use separate roles.
                migrator_url: require_env("MIGRATOR_DATABASE_URL"),
                runtime_role: env::var("DATABASE_RUNTIME_ROLE")
                    .unwrap_or_else(|_| "votex_runtime".into()),

                max_connections: parse_env("DATABASE_MAX_CONNECTIONS", 20),

                min_connections: parse_env("DATABASE_MIN_CONNECTIONS", 5),

                acquire_timeout_secs: parse_env("DATABASE_ACQUIRE_TIMEOUT_SECONDS", 5),
            },

            server: ServerConfig {
                host: env::var("APP_HOST").unwrap_or_else(|_| "127.0.0.1".into()),

                port: parse_env("APP_PORT", 8080),

                frontend_url: env::var("FRONTEND_URL").unwrap_or_else(|_| "localhost:3000".into()),
            },

            auth: AuthConfig {
                max_failed_login_attempts: parse_env("MAX_FAILED_LOGIN_ATTEMPTS", 5),
                login_failure_window_minutes: parse_env("LOGIN_FAILURE_WINDOW_MINUTES", 15),
                account_lock_duration_minutes: parse_env("ACCOUNT_LOCK_DURATION_MINUTES", 15),

                registration_verification_secret: require_env("REGISTRATION_VERIFICATION_SECRET"),

                voter_identity_secret: require_env("VOTER_IDENTITY_SECRET"),

                jwt_secret: require_env("JWT_SECRET"),

                jwt_issuer: require_env("JWT_ISSUER"),

                jwt_audience: require_env("JWT_AUDIENCE"),

                jwt_access_token_ttl_minutes: parse_env("JWT_ACCESS_TOKEN_TTL_MINUTES", 15),

                jwt_refresh_token_ttl_days: parse_env("JWT_REFRESH_TOKEN_TTL_DAYS", 30),

                smtp_host: require_env("SMTP_HOST"),

                smtp_port: parse_env("SMTP_PORT", 587),

                smtp_username: require_env("SMTP_USERNAME"),

                smtp_password: require_env("SMTP_PASSWORD"),

                email_from_address: require_env("EMAIL_FROM_ADDRESS"),

                email_from_name: require_env("EMAIL_FROM_NAME"),

                email_code_expiry_minutes: parse_env("EMAIL_CODE_EXPIRY_MINUTES", 10),
                cookie_secure: parse_env("COOKIE_SECURE", false),

                cookie_domain: match env::var("COOKIE_DOMAIN") {
                    Ok(value) if !value.trim().is_empty() => Some(value),
                    _ => None,
                },

                cookie_same_site: parse_env("COOKIE_SAME_SITE", "Strict".to_string()),

                cookie_path: parse_env("COOKIE_PATH", "/api/v1/auth".to_string()),
            },

            payments: PaymentConfig {
                subscription_mode: match env::var("SUBSCRIPTION_PAYMENT_MODE")
                    .unwrap_or_else(|_| "MANUAL".into())
                    .trim()
                    .to_ascii_uppercase()
                    .as_str()
                {
                    "MANUAL" => SubscriptionPaymentMode::Manual,
                    "AUTOMATED" => SubscriptionPaymentMode::Automated,
                    value => panic!(
                        "Invalid SUBSCRIPTION_PAYMENT_MODE `{value}`. Use MANUAL or AUTOMATED."
                    ),
                },
                paymongo_secret_key: env::var("PAYMONGO_SECRET_KEY").unwrap_or_default(),
                paymongo_webhook_secret: env::var("PAYMONGO_WEBHOOK_SECRET_KEY")
                    .unwrap_or_default(),
                paymongo_success_url: env::var("PAYMONGO_SUCCESS_URL").unwrap_or_else(|_| {
                    "http://localhost:3000/org_owner/billing/plans?checkout=success".into()
                }),
                paymongo_cancel_url: env::var("PAYMONGO_CANCEL_URL").unwrap_or_else(|_| {
                    "http://localhost:3000/org_owner/billing/plans?checkout=cancelled".into()
                }),
                paymongo_payment_methods: env::var("PAYMONGO_PAYMENT_METHOD_TYPES")
                    .unwrap_or_else(|_| "gcash,paymaya,grab_pay,qrph,card".into())
                    .split(',')
                    .map(str::trim)
                    .filter(|v| !v.is_empty())
                    .map(str::to_owned)
                    .collect(),
            },

            env: match env::var("APP_ENV").as_deref() {
                Ok("production") => AppEnv::Production,
                _ => AppEnv::Development,
            },
        }
    }
}

/// Returns a required environment variable.
///
/// The application fails immediately with a readable error if the
/// variable is missing or contains only whitespace.
fn require_env(key: &str) -> String {
    match env::var(key) {
        Ok(value) if !value.trim().is_empty() => value,

        Ok(_) => {
            panic!(
                "\n\
                Configuration error\n\
                -------------------\n\
                Environment variable `{key}` is empty.\n\
                Please set `{key}` in your .env file.\n"
            );
        }

        Err(_) => {
            panic!(
                "\n\
                Configuration error\n\
                -------------------\n\
                Required environment variable `{key}` is missing.\n\
                Please add `{key}` to your .env file.\n"
            );
        }
    }
}

/// Reads an optional environment variable and parses it into the
/// requested type.
///
/// If the variable is missing, the provided default value is used.
///
/// If the variable exists but cannot be parsed, the application
/// fails immediately with a readable configuration error.
fn parse_env<T>(key: &str, default: T) -> T
where
    T: std::str::FromStr,
    T::Err: std::fmt::Display,
{
    match env::var(key) {
        Ok(value) if value.trim().is_empty() => {
            panic!(
                "\n\
                Configuration error\n\
                -------------------\n\
                Environment variable `{key}` is empty.\n\
                Either provide a valid value or remove the variable \
                to use the default value.\n"
            );
        }

        Ok(value) => value.parse::<T>().unwrap_or_else(|error| {
            panic!(
                "\n\
                    Configuration error\n\
                    -------------------\n\
                    Environment variable `{key}` has an invalid value: `{value}`.\n\
                    Parsing error: {error}\n\
                    Please provide a valid value for `{key}`.\n"
            );
        }),

        Err(_) => default,
    }
}
