use actix_cors::Cors;
use actix_web::http::header;

pub fn configure(frontend_url: &str) -> Cors {
    Cors::default()
        .allowed_origin(frontend_url)
        .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE"])
        .allowed_headers(vec![header::CONTENT_TYPE, header::AUTHORIZATION])
        .supports_credentials()
}
