use actix_web::cookie::{Cookie, SameSite};
use core_infra::config::AuthConfig;

pub fn build_refresh_token_cookie(token: &str, config: &AuthConfig) -> Cookie<'static> {
    let mut cookie = Cookie::build("refresh_token", token.to_owned())
        .http_only(true)
        .secure(config.cookie_secure)
        .same_site(parse_same_site(&config.cookie_same_site))
        .path(config.cookie_path.clone())
        .max_age(actix_web::cookie::time::Duration::days(
            config.jwt_refresh_token_ttl_days,
        ));

    if let Some(domain) = &config.cookie_domain {
        cookie = cookie.domain(domain.clone());
    }

    cookie.finish()
}

pub fn build_clear_refresh_token_cookie(config: &AuthConfig) -> Cookie<'static> {
    let mut cookie = Cookie::build("refresh_token", "")
        .http_only(true)
        .secure(config.cookie_secure)
        .same_site(parse_same_site(&config.cookie_same_site))
        .path(config.cookie_path.clone())
        .max_age(actix_web::cookie::time::Duration::ZERO);

    if let Some(domain) = &config.cookie_domain {
        cookie = cookie.domain(domain.clone());
    }

    cookie.finish()
}

fn parse_same_site(value: &str) -> SameSite {
    match value.to_ascii_lowercase().as_str() {
        "lax" => SameSite::Lax,
        "none" => SameSite::None,
        _ => SameSite::Strict,
    }
}
