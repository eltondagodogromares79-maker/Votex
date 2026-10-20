use std::sync::Arc;

use actix_web::web;
use core_infra::{
    api::middleware::{AuthorizationGuard, JwtAuthentication},
    application::ports::security::TokenAuthenticator,
};

use crate::api::handler::{
    contestants::{
        create as create_contestant, deactivate as deactivate_contestant, get as get_contestant,
        get_placements as get_contestant_placements, list as list_contestants,
        save_placements as save_contestant_placements, update as update_contestant,
    },
    judges::{
        activate, activate_tabulator, assign, assign_tabulators, delete_assignment,
        delete_tabulator_assignment, list, list_tabulators, revoke, revoke_tabulators,
    },
    pageant_setup::{
        activate_category, activate_criterion, create_category, create_criterion,
        deactivate_category, deactivate_criterion, get_category, get_criterion, get_leaderboard,
        get_round_configuration, list_categories, list_criteria, save_round_configuration,
        update_category, update_category_status, update_criterion,
    },
    pageants::{get_assigned, get_resource_limits, list_assigned, update_assigned},
    rounds::{
        create as create_round, delete as delete_round, get as get_round, list as list_rounds,
        update as update_round,
    },
};

/// Register coordinator endpoints behind JWT authentication and pageant RBAC.
pub fn configure(config: &mut web::ServiceConfig, token_validator: Arc<dyn TokenAuthenticator>) {
    config.service(
        web::scope("/api/v1/coordinator")
            .wrap(JwtAuthentication::new(token_validator))
            .route("/pageants", web::get().to(list_assigned))
            .service(
                web::resource("/pageants/{pageant_id}")
                    .route(
                        web::get()
                            .to(get_assigned)
                            .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
                    )
                    .route(
                        web::put()
                            .to(update_assigned)
                            .wrap(AuthorizationGuard::pageant("pageant.update", "pageant_id")),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/judges")
                    .route(
                        web::get()
                            .to(list)
                            .wrap(AuthorizationGuard::pageant("judge.assign", "pageant_id")),
                    )
                    .route(
                        web::post()
                            .to(assign)
                            .wrap(AuthorizationGuard::pageant("judge.assign", "pageant_id")),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/judges/{user_id}").route(
                    web::delete()
                        .to(revoke)
                        .wrap(AuthorizationGuard::pageant("judge.assign", "pageant_id")),
                ),
            )
            .route(
                "/pageants/{pageant_id}/judges/{user_id}/activate",
                web::post()
                    .to(activate)
                    .wrap(AuthorizationGuard::pageant("judge.assign", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/judges/{user_id}/permanent",
                web::delete()
                    .to(delete_assignment)
                    .wrap(AuthorizationGuard::pageant("judge.assign", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/resource-limits",
                web::get()
                    .to(get_resource_limits)
                    .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
            )
            .service(
                web::resource("/pageants/{pageant_id}/tabulators")
                    .route(
                        web::get()
                            .to(list_tabulators)
                            .wrap(AuthorizationGuard::pageant(
                                "tabulator.assign",
                                "pageant_id",
                            )),
                    )
                    .route(
                        web::post()
                            .to(assign_tabulators)
                            .wrap(AuthorizationGuard::pageant(
                                "tabulator.assign",
                                "pageant_id",
                            )),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/tabulators/{user_id}").route(
                    web::delete()
                        .to(revoke_tabulators)
                        .wrap(AuthorizationGuard::pageant(
                            "tabulator.assign",
                            "pageant_id",
                        )),
                ),
            )
            .route(
                "/pageants/{pageant_id}/tabulators/{user_id}/activate",
                web::post()
                    .to(activate_tabulator)
                    .wrap(AuthorizationGuard::pageant(
                        "tabulator.assign",
                        "pageant_id",
                    )),
            )
            .route(
                "/pageants/{pageant_id}/tabulators/{user_id}/permanent",
                web::delete()
                    .to(delete_tabulator_assignment)
                    .wrap(AuthorizationGuard::pageant(
                        "tabulator.assign",
                        "pageant_id",
                    )),
            )
            .service(
                web::resource("/pageants/{pageant_id}/contestants")
                    .route(
                        web::get()
                            .to(list_contestants)
                            .wrap(AuthorizationGuard::pageant("contestant.read", "pageant_id")),
                    )
                    .route(
                        web::post()
                            .to(create_contestant)
                            .wrap(AuthorizationGuard::pageant(
                                "contestant.create",
                                "pageant_id",
                            )),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/contestants/{contestant_id}")
                    .route(
                        web::get()
                            .to(get_contestant)
                            .wrap(AuthorizationGuard::pageant("contestant.read", "pageant_id")),
                    )
                    .route(
                        web::put()
                            .to(update_contestant)
                            .wrap(AuthorizationGuard::pageant(
                                "contestant.update",
                                "pageant_id",
                            )),
                    )
                    .route(web::delete().to(deactivate_contestant).wrap(
                        AuthorizationGuard::pageant("contestant.delete", "pageant_id"),
                    )),
            )
            .service(
                web::resource("/pageants/{pageant_id}/categories")
                    .route(
                        web::get()
                            .to(list_categories)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::post()
                            .to(create_category)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/contestants/{contestant_id}/placements")
                    .route(
                        web::get()
                            .to(get_contestant_placements)
                            .wrap(AuthorizationGuard::pageant("contestant.read", "pageant_id")),
                    )
                    .route(web::put().to(save_contestant_placements).wrap(
                        AuthorizationGuard::pageant("contestant.update", "pageant_id"),
                    )),
            )
            .service(
                web::resource("/pageants/{pageant_id}/categories/{category_id}")
                    .route(
                        web::get()
                            .to(get_category)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::put()
                            .to(update_category)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::delete()
                            .to(deactivate_category)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::patch()
                            .to(update_category_status)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    ),
            )
            .route(
                "/pageants/{pageant_id}/categories/{category_id}/activate",
                web::post()
                    .to(activate_category)
                    .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
            )
            .service(
                web::resource("/pageants/{pageant_id}/criteria")
                    .route(
                        web::get()
                            .to(list_criteria)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::post()
                            .to(create_criterion)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/criteria/{criterion_id}")
                    .route(
                        web::get()
                            .to(get_criterion)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::put()
                            .to(update_criterion)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::delete()
                            .to(deactivate_criterion)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    ),
            )
            .route(
                "/pageants/{pageant_id}/criteria/{criterion_id}/activate",
                web::post()
                    .to(activate_criterion)
                    .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
            )
            .service(
                web::resource("/pageants/{pageant_id}/rounds")
                    .route(
                        web::get()
                            .to(list_rounds)
                            .wrap(AuthorizationGuard::pageant("round.manage", "pageant_id")),
                    )
                    .route(
                        web::post()
                            .to(create_round)
                            .wrap(AuthorizationGuard::pageant("round.manage", "pageant_id")),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/rounds/{round_id}")
                    .route(
                        web::get()
                            .to(get_round)
                            .wrap(AuthorizationGuard::pageant("round.manage", "pageant_id")),
                    )
                    .route(
                        web::put()
                            .to(update_round)
                            .wrap(AuthorizationGuard::pageant("round.manage", "pageant_id")),
                    )
                    .route(
                        web::delete()
                            .to(delete_round)
                            .wrap(AuthorizationGuard::pageant("round.manage", "pageant_id")),
                    ),
            )
            .service(
                web::resource("/pageants/{pageant_id}/rounds/{round_id}/judging-configuration")
                    .route(
                        web::get()
                            .to(get_round_configuration)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    )
                    .route(
                        web::put()
                            .to(save_round_configuration)
                            .wrap(AuthorizationGuard::pageant("criteria.manage", "pageant_id")),
                    ),
            )
            .route(
                "/pageants/{pageant_id}/rounds/{round_id}/leaderboard",
                web::get()
                    .to(get_leaderboard)
                    .wrap(AuthorizationGuard::pageant("results.review", "pageant_id")),
            ),
    );
}
