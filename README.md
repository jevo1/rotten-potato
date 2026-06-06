# Rotten Potato
GamâLokal: An online commerce platform connecting clients with local artists for custom commissions and artwork sales.

| Internal Release Code | Date Released |
| :--- | :--- |
| RP.010.004 | 2026-06-06 |
| RP.010.003 | 2026-06-04 |
| RP.010.002 | 2026-06-02 |
| RP.010.001 | 2026-02-29 |

## RP.010.004 Release Notes
* feat(onboarding): add role selection page to allow users to choose between Artist and Client roles
* feat(auth): enhance login and signup pages with error/success feedback and role-based redirection
* refactor(core): reorganize server actions into a dedicated directory structure (`app/actions/`)
* fix(auth): update callback route to handle onboarding redirects for users with missing roles

## RP.010.003 Release Notes
* feat(commissions): implement Secure Workspace with milestone-based payments (Deposit & Final)
* feat(commissions): add multi-stage fulfillment support (Courier, Pickup, Artist Delivery)
* feat(profile): overhaul profile UI with cover photos, bio, and social links
* feat(profile): implement follow/unfollow system and unified gallery (Artworks + Posts)
* feat(payments): integrate PayMongo for secure milestone transactions and webhooks

## RP.010.002 Release Notes
* feat(marketplace): implement fully functional shopping cart with database-backed persistence
* feat(marketplace): add real-time cart badge and stock-aware quantity management
* feat(marketplace): implement checkout flow with order and order_item tracking
* refactor(database): add stock management to artworks and support for cart/order relationships

## RP.010.001 Release Notes (reverse chronological order)
* feat: add signup UI and update metadata
* feat: setup Supabase database schema, RLS policies, and auth triggers
* chore: setup Supabase SSR and auth utilities
* NOTES: Initial Supabase auth trigger setup complete; email confirmations currently disabled for local development testing.

## RP.010.000 Release Notes
* Initial repository and project setup.

Important Links:
* Design Specs: https://github.com/jevo1/rotten-potato-docportal
