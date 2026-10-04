use validator::Validate;

use crate::errors::AppError;

/// Validates any `T: Validate` and maps errors to `AppError::Validation`.
pub fn validate<T: Validate>(value: &T) -> Result<(), AppError> {
    value.validate().map_err(AppError::Validation)
}
