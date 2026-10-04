use async_trait::async_trait;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use uuid::Uuid;

use core_infra::AppError;

use crate::{
    application::ports::token_validator::TokenValidator,
    domain::models::authenticated_user::AuthenticatedUser,
};

pub struct JwtTokenValidator {
    decoding_key: DecodingKey,
    issuer: String,
    audience: String,
}

#[derive(Debug, serde::Deserialize)]
struct Claims {
    sub: String,
    sid: String,
    /// rol is required in newly issued tokens. Older tokens without this
    /// claim will get an empty string, which the application layer maps
    /// to a NotFound role error rather than an InvalidToken.
    #[serde(default)]
    rol: String,
    iss: String,
    aud: String,
    exp: usize,
    iat: usize,
}

impl JwtTokenValidator {
    pub fn new(secret: &str, issuer: String, audience: String) -> Self {
        Self {
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
            issuer,
            audience,
        }
    }
}

#[async_trait]
impl TokenValidator for JwtTokenValidator {
    async fn validate_access_token(&self, token: &str) -> Result<AuthenticatedUser, AppError> {
        let mut validation = Validation::new(Algorithm::HS256);

        validation.set_issuer(&[self.issuer.as_str()]);
        validation.set_audience(&[self.audience.as_str()]);

        let token_data = decode::<Claims>(token, &self.decoding_key, &validation)
            .map_err(|_| AppError::InvalidToken)?;

        let user_id =
            Uuid::parse_str(&token_data.claims.sub).map_err(|_| AppError::InvalidToken)?;

        let session_id =
            Uuid::parse_str(&token_data.claims.sid).map_err(|_| AppError::InvalidToken)?;

        Ok(AuthenticatedUser {
            user_id,
            session_id,
            role: token_data.claims.rol,
        })
    }
}
