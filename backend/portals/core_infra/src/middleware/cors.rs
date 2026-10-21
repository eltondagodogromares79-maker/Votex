use actix_cors::Cors;
use actix_web::http::header;

pub fn configure(frontend_origins: &[String]) -> Cors {
    let allowed_origins = frontend_origins.to_vec();
    Cors::default()
        .allowed_origin_fn(move |origin, _request| {
            allowed_origins
                .iter()
                .any(|allowed| origin.as_bytes() == allowed.as_bytes())
        })
        .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE"])
        .allowed_headers(vec![header::CONTENT_TYPE, header::AUTHORIZATION])
        .supports_credentials()
}
