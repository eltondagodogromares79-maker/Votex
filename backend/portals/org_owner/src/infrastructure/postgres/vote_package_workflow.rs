use async_trait::async_trait;
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::vote_package_workflow::VotePackageWorkflow,
    domain::vote_package::VotePackage,
};

pub struct PostgresVotePackageWorkflow {
    pool: PgPool,
}

impl PostgresVotePackageWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct VotePackageRow {
    id: Uuid,
    pageant_id: Uuid,
    name: String,
    description: Option<String>,
    vote_quantity: i32,
    price_amount: Decimal,
    currency: String,
    is_active: bool,
    created_by: Option<Uuid>,
}

impl From<VotePackageRow> for VotePackage {
    fn from(row: VotePackageRow) -> Self {
        Self {
            id: row.id,
            pageant_id: row.pageant_id,
            name: row.name,
            description: row.description,
            vote_quantity: row.vote_quantity,
            price_amount: row.price_amount,
            currency: row.currency.trim().to_owned(),
            is_active: row.is_active,
            created_by: row.created_by,
        }
    }
}

const RETURNING_COLUMNS: &str = r#"
    id, pageant_id, name, description, vote_quantity,
    price_amount, currency, is_active, created_by
"#;
const PACKAGE_COLUMNS: &str = r#"
    package.id, package.pageant_id, package.name, package.description,
    package.vote_quantity, package.price_amount, package.currency,
    package.is_active, package.created_by
"#;

#[async_trait]
impl VotePackageWorkflow for PostgresVotePackageWorkflow {
    async fn list(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<VotePackage>, AppError> {
        let query = format!(
            "SELECT {PACKAGE_COLUMNS} FROM pageant_vote_packages package \
             INNER JOIN pageants pageant ON pageant.id = package.pageant_id \
             WHERE pageant.organization_id = $1 AND package.pageant_id = $2 \
             ORDER BY package.created_at, package.name"
        );
        let rows = sqlx::query_as::<_, VotePackageRow>(&query)
            .bind(organization_id)
            .bind(pageant_id)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(VotePackage::from).collect())
    }

    async fn create(
        &self,
        organization_id: Uuid,
        package: VotePackage,
    ) -> Result<VotePackage, AppError> {
        let query = format!(
            "INSERT INTO pageant_vote_packages \
             (id, pageant_id, name, description, vote_quantity, price_amount, currency, created_by) \
             SELECT $1, pageant.id, $3, $4, $5, $6, $7, $8 \
             FROM pageants pageant \
             WHERE pageant.id = $2 AND pageant.organization_id = $9 \
             RETURNING {RETURNING_COLUMNS}"
        );
        let row = sqlx::query_as::<_, VotePackageRow>(&query)
            .bind(package.id)
            .bind(package.pageant_id)
            .bind(&package.name)
            .bind(&package.description)
            .bind(package.vote_quantity)
            .bind(package.price_amount)
            .bind(&package.currency)
            .bind(package.created_by)
            .bind(organization_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_package_write_error)?
            .ok_or_else(|| AppError::NotFound("pageant".to_owned()))?;
        Ok(row.into())
    }

    async fn update(
        &self,
        organization_id: Uuid,
        package: VotePackage,
    ) -> Result<VotePackage, AppError> {
        let query = format!(
            "UPDATE pageant_vote_packages package \
             SET name = $4, description = $5, vote_quantity = $6, price_amount = $7, currency = $8 \
             FROM pageants pageant \
             WHERE package.id = $1 AND package.pageant_id = $2 \
               AND pageant.id = package.pageant_id AND pageant.organization_id = $3 \
             RETURNING package.id, package.pageant_id, package.name, package.description, \
                       package.vote_quantity, package.price_amount, package.currency, \
                       package.is_active, package.created_by"
        );
        let row = sqlx::query_as::<_, VotePackageRow>(&query)
            .bind(package.id)
            .bind(package.pageant_id)
            .bind(organization_id)
            .bind(&package.name)
            .bind(&package.description)
            .bind(package.vote_quantity)
            .bind(package.price_amount)
            .bind(&package.currency)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_package_write_error)?
            .ok_or_else(|| AppError::NotFound("vote package".to_owned()))?;
        Ok(row.into())
    }

    async fn deactivate(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        package_id: Uuid,
    ) -> Result<(), AppError> {
        let changed = sqlx::query_scalar::<_, Uuid>(
            r#"
            UPDATE pageant_vote_packages package
            SET is_active = FALSE
            FROM pageants pageant
            WHERE package.id = $1
              AND package.pageant_id = $2
              AND pageant.id = package.pageant_id
              AND pageant.organization_id = $3
              AND package.is_active = TRUE
            RETURNING package.id
            "#,
        )
        .bind(package_id)
        .bind(pageant_id)
        .bind(organization_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;

        changed
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("active vote package".to_owned()))
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}

fn map_package_write_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.code().as_deref() == Some("23505")
            && database_error
                .constraint()
                .is_some_and(|constraint| constraint == "pageant_vote_packages_pageant_id_name_key")
        {
            return AppError::Conflict(
                "a package with this name already exists for the pageant".to_owned(),
            );
        }
    }
    database_error(error)
}
