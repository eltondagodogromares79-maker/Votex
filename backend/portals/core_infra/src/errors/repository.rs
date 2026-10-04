use thiserror::Error;

/// Low-level repository errors. Never sent directly to clients.
/// Upper layers convert these into `AppError`.
#[derive(Debug, Error)]
pub enum RepositoryError {
    /// A required record was not found.
    #[error("record not found")]
    NotFound,

    /// A unique constraint was violated. `constraint` is the PG constraint name.
    #[error("unique constraint violated: {constraint}")]
    UniqueViolation { constraint: String },

    /// A foreign key constraint was violated.
    #[error("foreign key constraint violated: {constraint}")]
    ForeignKeyViolation { constraint: String },

    /// Any other database-level failure. The source is preserved for internal
    /// logging but never forwarded to the client.
    #[error("database error")]
    Database(#[source] Box<dyn std::error::Error + Send + Sync>),

    /// Connection or pool acquisition failure.
    #[error("database connection error")]
    Connection(#[source] Box<dyn std::error::Error + Send + Sync>),
}
