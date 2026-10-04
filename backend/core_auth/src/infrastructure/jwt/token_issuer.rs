use chrono::Utc;
use jsonwebtoken::{EncodingKey, Header, encode};
use serde::Serialize;

use core_infra::AppError;

use crate::{
    application::ports::token_issuer::{AccessToken, TokenIssuer},
    domain::models::{auth_session::AuthSession, user::User},
};

pub struct JwtTokenIssuer {
    encoding_key: EncodingKey,
    issuer: String,
    audience: String,
    access_token_ttl_minutes: i64,
}

impl JwtTokenIssuer {
    pub fn new(
        secret: &str,
        issuer: String,
        audience: String,
        access_token_ttl_minutes: i64,
    ) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            issuer,
            audience,
            access_token_ttl_minutes,
        }
    }
}

#[derive(Debug, Serialize)]
struct AccessTokenClaims {
    sub: String,
    sid: String,
    rol: String,
    iat: usize,
    exp: usize,
    iss: String,
    aud: String,
}

#[async_trait::async_trait]
impl TokenIssuer for JwtTokenIssuer {
    async fn issue_access_token(
        &self,
        user: &User,
        session: &AuthSession,
        role: &str,
    ) -> Result<AccessToken, AppError> {
        let now = Utc::now();
        let issued_at = now.timestamp() as usize;

        let expires_at = now + chrono::Duration::minutes(self.access_token_ttl_minutes);

        let claims = AccessTokenClaims {
            sub: user.id.to_string(),
            sid: session.id.to_string(),
            rol: role.to_owned(),
            iat: issued_at,
            exp: expires_at.timestamp() as usize,
            iss: self.issuer.clone(),
            aud: self.audience.clone(),
        };

        let token = encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|_| AppError::Internal)?;

        Ok(AccessToken {
            token,
            expires_in: self.access_token_ttl_minutes * 60,
            role: role.to_owned(),
        })
    }
}
