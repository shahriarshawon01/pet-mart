# Platform Roadmap: PetMart + Matrimony + Future Verticals

Last updated: 18 November 2026

## Assumptions

- Brand names and domains below are placeholders (`example.com`, `pet.`, `biye.`). Replace them once the real names are chosen.
- Jibonshongi findings come from its public JavaScript bundles (routes, API paths and form field names). I did not see the rendered site, log in or use any account. bibahabd.com findings come from its public page text. Neither site's visual design was reviewed.
- No payment gateway (bKash, Nagad, SSLCommerz, carrier billing) has been chosen. Each one needs a merchant agreement and its own API documentation before we build against it.
- Legal points (privacy, NID handling, refunds, VAT, investigation services) need advice from a qualified Bangladeshi lawyer or accountant. This document does not give legal or tax advice.

---

## 1. Key decisions

### 1.1 Same project or a separate project?

**Same repository, one Laravel backend, one MySQL database. Restructure it as a modular monolith before adding matrimony.**

| Need | Modular monolith (recommended) | Separate project and DB per site |
|---|---|---|
| One admin panel for every site | Native | Admin must call N APIs; RBAC and users duplicated |
| Shared login, payments, SMS, media, locations | Written once | Copied into each project, then drift apart |
| Adding vertical #3, #4 … | New module + new frontend | New repo, new DB, new deploy, new admin integration |
| Cross-site dashboard and revenue reports | One query | ETL or API aggregation |
| Isolation if one site grows a lot | Achievable: each module has its own DB connection name, so it can move to its own DB later | Built in |
| Team size needed | Small | Larger |

Split a module into its own service or database **only** when one of these becomes true: it needs different scaling, a separate team owns it, a regulator or client requires physical separation, or the business is sold or spun off. The structure below keeps that split cheap.

### 1.2 Domains (one parent domain, separate sites)

```
example.com              → company/brand landing (or redirect to pet)
pet.example.com          → PetMart customer SPA (React)
biye.example.com         → Matrimony customer SPA (React + TypeScript)
admin.example.com        → Admin panel (Laravel + Vue), session login
api.example.com          → Laravel REST API for all sites  (/api/v1/pet/*, /api/v1/matrimony/*, /api/v1/core/*)
cdn.example.com          → public images only (S3/R2 + CDN later); private files are never public
```

Rules:
- The customer SPAs use **Bearer tokens (Sanctum)**, not cookies, so the subdomains share nothing by accident.
- Admin session cookie is scoped to `admin.example.com`. **Never** set `SESSION_DOMAIN=.example.com`.
- CORS allows exact origins only (`https://pet.example.com`, `https://biye.example.com`); no wildcard.
- Each token carries a site ability (`site:pet`, `site:matrimony`). Middleware checks that the token's site matches the route group. A pet login token cannot call matrimony APIs.
- One account per phone number across sites, but **each site needs its own opt-in**: a `site_user` membership row and a separate matrimony profile. Nothing from one site is shown on another.
- TLS for every subdomain (Let's Encrypt via Caddy/Traefik, or the hosting provider).

### 1.3 Contact unlock model (combines the three references)

| Source | Model | Problem if copied as-is |
|---|---|---|
| bibahabd | Packages with per-feature quotas (proposals, contact views, …) | Heavy to build first |
| Jibonshongi | Phone-OTP login, bKash recurring subscription and carrier billing, **contact requests approved by admin**, NID + selfie verification | Recurring and carrier billing need merchant/operator agreements |
| Gemini prompt | Pay per biodata via manual bKash/Nagad/Rocket, then contact shown immediately | Anyone who pays gets a person's phone number without that person's consent: a safety risk, especially for women |

**Chosen model:**
1. A payment buys a **plan** (for example "10 contact requests, 30 days") through the entitlement system (§5.4). This covers per-biodata unlock (a 1-credit plan), packages and later subscriptions with one design.
2. Spending a credit sends a **contact request**. Contact details are shown only after the profile owner accepts, or an admin approves it on the owner's behalf (the Jibonshongi pattern), and they can show the guardian's number instead of the candidate's.
3. Version 1 uses manual mobile-banking payments with admin verification (the Gemini idea, made safer). Gateway checkout, bKash recurring and carrier billing come later.

---

## 2. Code structure (API-first, best practice)

### 2.1 Backend layout

```
app/
  Core/                         # shared by every site
    Auth/        (OTP login, tokens, site abilities)
    Sites/       (Site model, SiteContext, middleware ResolveSite)
    Users/       Locations/  Media/  Notifications/  Settings/  Audit/
    Billing/     (PaymentMethod, Order, Payment, Plan, Subscription, EntitlementService)
    Admin/       (RBAC: roles, permissions, RequirePermission middleware)
  Modules/
    Pet/
      Http/Controllers/{Public,Member,Admin}/
      Http/Requests/  Http/Resources/
      Models/  Actions/  Policies/  Queries/  Events/  Listeners/  Jobs/
      Database/{migrations,seeders,factories}/
      routes.php   ModuleServiceProvider.php
    Matrimony/   (same shape)
  Support/       (PhoneNumber, money helpers, …)
```

Conventions:
- **Thin controllers.** Validation lives in FormRequests, business logic in single-purpose Actions (`ApproveProfile`, `SubmitManualPayment`, `SendContactRequest`), reads in Query classes, output in API Resources.
- **Policies** for every "can this user see or do this?" check (profile visibility, contact reveal, chat). No ad-hoc `if` checks in controllers.
- **Events and queued jobs** for SMS, push, email and image processing. Requests never wait on SMS.
- **One response envelope** for every API: `{ "success": bool, "message": string, "data": …, "meta": …, "errors": … }`. The admin API's `status: 2000` format migrates to this (the Vue mixin needs a matching change).
- **Versioned routes** `/api/v1/...`, one route file per module, mounted by its service provider.
- **Money** stored as integer poisha (or `decimal(12,2)`) with a currency column. Never use floats.
- **Enums** as PHP backed enums (`ProfileStatus::Pending`), stored as strings.
- **Every admin write** goes to `audit_logs`.
- **OpenAPI spec** (Scribe or L5-Swagger) generated from the code, so frontends and a future mobile app share one contract.
- **Tests:** a feature test for each endpoint and policy, unit tests for the entitlement service and payment state machine. CI runs Pint, Larastan (static analysis) and the tests on every push.
- No cross-module foreign keys. Modules reference only `Core` tables, which keeps a later split possible. Each module's models use their own connection name (`pet`, `matrimony`), all pointing at the same database for now.

### 2.2 Frontend layout

```
apps/
  pet-web/          (existing frontend/, React + Vite, JS → migrate to TS gradually)
  matrimony-web/    (new, React + Vite + TypeScript + Tailwind)
packages/
  ui/               (shared Tailwind components: Button, Input, Modal, PhoneInput, LocationPicker, Pagination…)
  api-client/       (typed client generated from the OpenAPI spec, auth/token handling)
  config/           (shared Tailwind preset, ESLint, tsconfig)
```
Use an npm/pnpm workspace so both apps share `ui` and `api-client`. Each app has its own theme and brand through the Tailwind preset.

Frontend rules:
- **Fully responsive and mobile-first.** Most users are on phones. Design at 360px width first, then `sm/md/lg/xl`. Every page must work from 360px to 1440px with no horizontal scroll.
- Touch targets at least 44px. Use bottom navigation on mobile for the member area, and full-screen modals and drawers on small screens.
- Bangla + English (i18next) with Noto Sans Bengali. Numbers and dates formatted for the selected language.
- Server state in TanStack Query (caching, retries, pagination). Forms in React Hook Form + Zod, with the same rules as the backend.
- Lazy-load routes and images, use `srcset` for photos, and aim for Lighthouse mobile ≥ 90.
- Accessibility: labels on all inputs, focus states, colour contrast AA, keyboard-usable modals.
- PWA (installable, offline shell), since Jibonshongi relies heavily on this for mobile users.

---

## 3. Database design (normalised to 3NF)

Principles:
- **Repeating groups become rows.** Education history, family members and partner preferences are child tables, never comma lists or text blobs. The Gemini prompt's `education_details` and `family_details` text columns cannot be searched, filtered or validated.
- **Lists that admins edit become lookup tables** (religions, education levels, occupations, report reasons). **Fixed values that code depends on become enums** (gender, profile status).
- **Units are normalised:** height in centimetres (integer), money in a defined unit with a currency, dates as `date`.
- **No derived columns:** store `birth_date`, never `age`. Age filters become birth-date ranges, which can use an index.
- **1:1 attributes stay in the main table**, with one deliberate exception for security: **contact details live in their own table**, so ordinary queries cannot load them by accident and every access is logged.
- **Many-to-many relations use pivot tables** with composite unique keys.
- Intentional denormalisation is limited to counters (`views_count`) and cached `completeness_percent`, each with a clear owner that updates it.

### 3.1 Core tables (shared)

| Table | Key columns | Notes |
|---|---|---|
| `sites` | id, key (`pet`,`matrimony`), name, domain, status | New; enables future verticals |
| `users` | existing | Phone is the login identity |
| `site_user` | user_id, site_id, status (active/banned), banned_reason, joined_at · UNIQUE(user_id, site_id) | Ban on one site only |
| `countries` | id, iso2, name, bn_name | For NRB addresses |
| `locations` | existing (division → district → area); add `upazila` level if needed | |
| `media` | id, disk, path, mime, size_bytes, visibility (public/private), owner_type, owner_id, purpose, sha256 | Single store for photos, NID, payment proofs. `sha256` detects reused screenshots |
| `roles`, `permissions`, `role_permissions`, `modules`, `roles_modules` | existing + `permissions.site_id` nullable | Permission names prefixed by site: `matrimony.payment.verify` |
| `audit_logs` | actor_id, action, subject_type, subject_id, site_id, ip, meta(json), created_at | Every admin write and every sensitive read |
| `notifications` | Laravel standard | |
| `sms_logs` | user_id, phone, template, status, provider_ref, cost | |
| `banners`, `general_settings`, `contact_messages` | existing + `site_id` | Site-scoped |

Billing (core, reusable by any site, e.g. paid "featured listing" on PetMart):

| Table | Key columns |
|---|---|
| `payment_methods` | id, key (bkash/nagad/rocket/bank/card/gateway_x), type (manual/gateway), display_name, account_number, instructions, is_active, sort |
| `plans` | id, site_id, code, name, price, currency, duration_days, is_recurring, is_active, sort |
| `features` | key, site_id, name, type (quota/boolean) |
| `plan_features` | plan_id, feature_key, quota (NULL = unlimited) · UNIQUE(plan_id, feature_key) |
| `orders` | id, user_id, site_id, plan_id, amount, currency, status (pending/paid/cancelled/refunded), invoice_no UNIQUE |
| `payments` | id, order_id, payment_method_id, sender_number, transaction_id, proof_media_id, amount, status (pending/approved/rejected), rejection_reason, verified_by, verified_at, raw_response(json) · **UNIQUE(payment_method_id, transaction_id)** |
| `subscriptions` | id, user_id, site_id, plan_id, order_id, plan_snapshot(json), starts_at, ends_at, status |
| `subscription_quotas` | subscription_id, feature_key, quota, used · UNIQUE(subscription_id, feature_key) |
| `entitlement_usages` | subscription_id, feature_key, subject_type, subject_id, created_at · UNIQUE(subscription_id, feature_key, subject_type, subject_id) |

### 3.2 Matrimony tables (`mat_` prefix)

Lookups: `mat_religions`, `mat_education_levels`, `mat_occupations`, `mat_income_ranges`, `mat_report_reasons` (each: id, name, bn_name, sort, is_active).

| Table | Key columns | Notes |
|---|---|---|
| `mat_profiles` | id, user_id UNIQUE, profile_code UNIQUE (public id), created_for (self/son/daughter/brother/sister/relative/friend), gender, birth_date, height_cm, weight_kg, blood_group, religion_id, marital_status, children_count, occupation_id, occupation_detail, income_range_id, family_type, family_economic_status, about, photo_visibility, status (draft/pending/active/rejected/hidden/suspended), rejection_reason, approved_by, approved_at, verified_at, completeness_percent, last_active_at, timestamps, soft deletes | Index (status, gender, birth_date), religion_id, marital_status |
| `mat_profile_contacts` | profile_id PK/FK, phone (encrypted), email (encrypted), guardian_name, guardian_relation, guardian_phone (encrypted), show_guardian_instead | Separate for security; read only through a policy, every read logged |
| `mat_profile_addresses` | profile_id, type (present/permanent), country_id, location_id, address_line (private) · UNIQUE(profile_id, type) | |
| `mat_profile_educations` | profile_id, education_level_id, subject, institution, passing_year, result, sort | Many rows |
| `mat_family_members` | profile_id, relation (father/mother/brother/sister), occupation_id, is_alive, marital_status, note | Many rows |
| `mat_profile_answers` + `mat_questions` | question: key, label, type, options(json), section, is_required · answer: profile_id, question_id, value · UNIQUE(profile_id, question_id) | Admin-defined lifestyle/religious questions (same idea as pet `category_attributes`) |
| `mat_partner_preferences` | profile_id PK, age_min, age_max, height_min_cm, height_max_cm, note | |
| `mat_pref_religions`, `mat_pref_marital_statuses`, `mat_pref_education_levels`, `mat_pref_locations` | profile_id + lookup id, composite PK | Pivot tables, not JSON |
| `mat_profile_photos` | profile_id, media_id, is_primary, status (pending/approved/rejected), sort | |
| `mat_verifications` | profile_id, type (phone/nid/selfie), nid_number (encrypted), nid_media_id, selfie_media_id, status, reviewed_by, reviewed_at, note | Media on the private disk |
| `mat_interests` | sender_profile_id, receiver_profile_id, status (pending/accepted/declined/withdrawn), responded_at · UNIQUE(sender, receiver) | |
| `mat_contact_requests` | requester_profile_id, target_profile_id, subscription_id, status (pending/approved/declined/expired), decided_by_type (owner/admin), decided_by, admin_note, decided_at · UNIQUE(requester, target) | Credit spent via `entitlement_usages` |
| `mat_shortlists`, `mat_blocks` | profile_id, target_profile_id · UNIQUE pair | |
| `mat_reports` | reporter_profile_id, target_profile_id, reason_id, note, status, handled_by | |
| `mat_profile_views` | viewer_profile_id, viewed_profile_id, viewed_on (date) · UNIQUE(viewer, viewed, viewed_on) | One row per day, not per hit |
| `mat_conversations` | profile_low_id, profile_high_id · UNIQUE pair (ordered) | Only after an accepted interest or contact request |
| `mat_messages` | conversation_id, sender_profile_id, body, read_at | |
| Later: `mat_consultants`, `mat_consultant_schedules`, `mat_appointments` UNIQUE(consultant_id, start_at), `mat_leads` | | Assisted service |

### 3.3 Fixes to the Gemini prompt's schema

| Gemini proposal | Problem | Change |
|---|---|---|
| New `users` table with `role` enum | Conflicts with the existing `users` (`type`, `role_id`) and the RBAC tables | Reuse `users` + `site_user` + existing RBAC |
| `biodatas.education_details`, `family_details`, `expected_partner` as text | Not normalised, cannot filter | Child tables (§3.2) |
| `contact_phone` inside `biodatas` | One careless `select *` leaks it | `mat_profile_contacts`, encrypted |
| `payments.transaction_id` UNIQUE globally | Two gateways can issue the same id | UNIQUE(payment_method_id, transaction_id) |
| `gateway` enum | Adding a method needs a migration | `payment_methods` table |
| Payment tied to one biodata, contact shown immediately | No consent from the profile owner; no packages | Plan → credit → contact request → owner/admin approval |
| `amount` entered by the user | User can claim any amount | Amount comes from the plan; admin confirms the received amount |
| Screenshot stored publicly | Contains phone numbers and balances | Private disk, signed URLs, `sha256` duplicate check |
| No rejection reason or audit | Disputes cannot be traced | `rejection_reason`, `verified_by`, `audit_logs` |
| Inertia.js option | Ties the frontend to Laravel views; no mobile app | Pure REST API + separate SPAs |

---

## 4. Docker review (current files)

Checked: `Dockerfile`, `docker-compose.yml`, `docker/startup.sh`, `docker/nginx.conf`, `docker/default.conf`, `docker/supervisord.conf`, `.dockerignore`.

### Must fix (done 18 November 2026, verified by building both targets and running them against a fresh MySQL)
1. **`startup.sh` runs `db:seed` on every container start.** `ModuleSeeder` truncates `modules`, `permissions`, `role_permissions` and `roles_modules`, so **every restart wipes all role permissions** set in the admin panel. Seed once, manually, never in the start script.
2. **Secrets hardcoded in `docker-compose.yml`:** a real `APP_KEY` and the MySQL root password. Rotate the APP_KEY (`php artisan key:generate`) and move both to an untracked `.env` loaded with `env_file`. Changing APP_KEY logs everyone out and makes previously encrypted values unreadable, so do it before production data exists.
3. **The app connects to MySQL as `root`.** Create a dedicated DB user with rights only on the app database.
4. **`Dockerfile`, `docker-compose.yml` and `docker/` are in `.gitignore`.** The team and CI never get them. Commit them, with no secrets inside.
5. **No `php artisan storage:link`, and no volume for `storage/app`.** Uploaded photos 404, and all uploads are lost when the container is recreated. Add a named volume (or move uploads to S3/R2).
6. **No queue worker or scheduler.** `listings:prune`, `sanctum:prune-expired` and any queued SMS never run. Add `queue:work` and `schedule:work` programs to `supervisord.conf` (or separate containers).
7. **The React customer site (`frontend/`) is not built or served** by any image. Add a build stage and serve it from its own nginx server block or container per subdomain.
8. **GD has no WebP support and `exif` is not installed.** WebP uploads, which the API accepts, fail with "image could not be read", and phone photos are not auto-rotated. Add `libwebp-dev` with `--with-webp`, plus the `exif` extension.

### Should fix
9. `startup.sh` defaults to `APP_DEBUG=true`, `LOG_LEVEL=debug` and `DB_PASSWORD=secret`. Defaults must be production-safe, failing fast if a value is missing.
10. `migrate --force` runs on every start. With two or more replicas this races. Run migrations as a one-off release step.
11. `CACHE_DRIVER=file` and `SESSION_DRIVER=file` break with more than one container (OTP codes, view counters and sessions live in the cache). Use Redis (add the `redis` service and the phpredis extension). This project's `config/cache.php` still reads `CACHE_DRIVER`; keep that name unless the config is upgraded to Laravel 12's `CACHE_STORE`.
12. `.dockerignore` has `node_modules`, which only matches the root. `frontend/node_modules` is copied into the image. Use `**/node_modules`; also ignore `frontend/dist` and `storage/app/*`.
13. Upload limits are 200 MB, memory 512 MB and timeout 300 s while the app accepts 5 MB images. Lower them to around 20 MB / 256 MB / 60 s to reduce abuse.
14. OPcache is installed but not configured. Set `opcache.validate_timestamps=0` and suitable memory in production.
15. No `HEALTHCHECK` for the app container. Use Laravel's `/up` route.
16. `version: '3.8'` in compose is obsolete. phpMyAdmin and the published MySQL port 3309 are dev-only; keep them in a `docker-compose.override.yml` that is not used in production.
17. Add security headers: `Strict-Transport-Security` (behind TLS) and a Content-Security-Policy.
18. Use separate compose profiles or files for dev and prod, and pin image tags (avoid `phpmyadmin:latest`).

---

## 5. TODO by phase

Each phase ends with passing tests and a short demo. Commit per phase on a feature branch.

### Phase 0: Repo and infrastructure hygiene
- [ ] Fix Docker items 1–8 (§4), then 9–18
- [ ] Commit Docker files without secrets; add `.env.docker.example`
- [ ] Rotate APP_KEY and DB passwords used in compose
- [ ] CI pipeline: composer install, Pint, Larastan, PHPUnit, frontend lint and build
- [ ] Separate test database (`pet_mart_test`); stop running tests against the dev DB

### Phase 1: Security baseline (existing admin)
- [ ] Permission middleware on every admin route; remove the `role_id ?? 1` fallback; filter submenus
- [ ] Block privilege escalation (own role, Super Admin, granting permissions you lack)
- [ ] Add `$fillable` to `RolePermission` and `RoleModules` (the Role permissions page currently returns 500)
- [ ] Remove the `user` key from `api/general` (leaks phones)
- [ ] Seeder passwords from env, no demo users in production
- [ ] Decide on member delete: soft delete + anonymise, or hard delete

### Phase 2: Platform core refactor
- [ ] Create `app/Core` and `app/Modules/Pet`; move existing pet code into the Pet module with no behaviour change (tests stay green)
- [ ] `sites` and `site_user` tables; `ResolveSite` middleware; site ability on tokens
- [ ] `site_id` on banners, settings and contact messages; site-scoped queries
- [ ] Unified API response envelope + error format; update both frontends
- [ ] `media` table, private disk, signed URLs, image pipeline (EXIF strip, resize, WebP)
- [ ] `audit_logs` + logging of admin writes
- [ ] Domain setup: subdomains, CORS per origin, admin session domain, TLS
- [ ] OpenAPI generation (Scribe) and a typed `api-client` package
- [ ] Frontend workspace (`apps/`, `packages/ui`, `packages/api-client`)

### Phase 3: Billing core (reused by all sites)
- [ ] `payment_methods`, `plans`, `features`, `plan_features`, `orders`, `payments`, `subscriptions`, `subscription_quotas`, `entitlement_usages`
- [ ] `EntitlementService::consume()` with an atomic conditional update; `quota:` middleware; `QUOTA_EXCEEDED` error code
- [ ] Payment state machine (pending → approved/rejected) with an audit trail
- [ ] Free plan as a row, not special-case code
- [ ] Daily expiry job and SMS reminders (7 days and 1 day before)

### Phase 4: Matrimony data model
- [ ] Migrations for §3.2 with indexes and composite unique keys
- [ ] Lookup seeders (religions, education levels, occupations, income ranges, report reasons; Bangla + English)
- [ ] Models, enums, factories, policies

### Phase 5: Matrimony member API
- [ ] OTP phone login and registration (reuse core auth); `site_user` opt-in
- [ ] Multi-step profile wizard API (basic → address → education → family → lifestyle answers → partner preference → photos), saved as a draft per step
- [ ] Submit for review → `pending`; edits after approval go back to review
- [ ] Photo upload with approval and visibility (all / members / accepted only, blurred otherwise)
- [ ] NID + selfie verification submission (private media)
- [ ] Search API: gender (opposite), age range (birth-date range), religion, marital status, location, education, occupation, height; hides blocked and hidden profiles; paginated
- [ ] Profile detail API with masking: contacts never returned unless the policy allows
- [ ] Interest send/accept/decline/withdraw; shortlist; block; report
- [ ] Contact request: spend a credit, notify owner, owner or admin approves, then contact shown (guardian number if chosen)
- [ ] Rate limits (interests per day, reports, OTP)

### Phase 6: Manual payments (v1 monetisation)
- [ ] Plans page API; order creation for a plan
- [ ] Manual payment submit: method, sender number, TrxID, screenshot (private, sha256)
- [ ] Fraud checks: duplicate TrxID per method, duplicate screenshot hash, amount must match the plan, one pending payment per order, submission rate limit
- [ ] Admin verify/reject (with reason); approval activates the subscription in one transaction; SMS to the user
- [ ] Invoice/receipt

### Phase 7: Admin panel, matrimony section
- [ ] Site switcher; menus and permissions per site
- [ ] Profile approval queue (side-by-side view, approve/reject with reason)
- [ ] Photo approval queue; verification queue (NID/selfie via signed URLs, each view audited)
- [ ] **Payment verification table:** high-density view with user, plan, method, sender, TrxID, amount, thumbnail, duplicate warnings, approve/reject
- [ ] Contact request queue (admin-mediated approvals)
- [ ] Reports and blocks; plans and payment methods CRUD; subscriptions (grant/extend with audit)
- [ ] Dashboard: per-site cards, revenue, pending queues

### Phase 8: Matrimony frontend (`apps/matrimony-web`)
- [ ] **Fully responsive, mobile-first** (360px → 1440px), Bangla/English, PWA
- [ ] Pages: landing (hero + quick search + how it works + plans + trust/safety), login/OTP, register wizard, search with filter drawer (mobile) / sidebar (desktop), profile card grid, profile detail with locked contact section, plans and compare, payment modal (method tabs, copyable account numbers, amount, TrxID, screenshot preview, "Pending verification" state), my profile, my plan with quota bars, interests (received/sent), contact requests, shortlist, blocked, messages, settings, verification, help/FAQ/terms/privacy/safety
- [ ] Empty, loading and error states on every page; skeleton loaders
- [ ] Our own brand, colours and copy. Do not copy another site's logo, text or images.

### Phase 9: Engagement
- [ ] Chat (accepted pairs only), unread counts; polling first, WebSockets later
- [ ] Notifications: in-app, SMS, web push; per-user notification settings
- [ ] Match suggestions (rule-based on partner preferences), "new matches" alerts
- [ ] Profile completeness score and prompts

### Phase 10: Payment v2
- [ ] Gateway checkout (bKash Tokenised / SSLCommerz, after merchant approval and API docs): server-side validation, idempotent IPN, reconciliation report
- [ ] bKash recurring subscription, if the merchant account allows it
- [ ] Carrier billing (DCB) only if an operator agreement exists
- [ ] Refunds and coupons

### Phase 11: Assisted service and growth
- [ ] Consultants, schedules, appointments, dedicated executive, quotation leads
- [ ] Customer support agent role (limited view, impersonation with audit) as in Jibonshongi's `cs` area
- [ ] Marketing: UTM capture, lead tracking, landing-page variants, Facebook/Google pixels (with consent), referral codes, short links

### Phase 12: Launch readiness
- [ ] Security review: IDOR on profile, contact and media ids; payment tampering; rate limits; OTP abuse
- [ ] `noindex` on profiles; only public marketing pages indexed; sitemap
- [ ] Backups (encrypted, tested restore), monitoring, error tracking, uptime alerts
- [ ] Load test search and listing endpoints
- [ ] Privacy policy, terms, refund policy reviewed by a lawyer

### Adding a future vertical (checklist)
1. Insert a row in `sites`; add a subdomain and CORS origin
2. `php artisan make:module <Name>` (scaffold from the Pet/Matrimony shape)
3. Prefix tables (`xyz_`), own DB connection name, no foreign keys to other modules
4. Permissions prefixed `xyz.*`; admin menu group
5. Reuse core: auth, media, billing/plans, notifications, locations, settings
6. New app in `apps/xyz-web` using `packages/ui` and `packages/api-client`

---

## 6. What we learned from Jibonshongi (public JS, inferred)

- Phone OTP and SMS login, no password-first flow
- Many landing/login page variants (A/B tests for ad traffic), heavy UTM/pixel/lead tracking, PWA install and push notifications
- Profile fields: profile for, gender, date of birth, marital status, religion, height, education, occupation, city/country, bio, photos; partner age range
- Verification by NID image + selfie, reviewed manually (face detection on the client)
- Contact requests that admins approve or reject with notes
- Payments: bKash recurring subscription, carrier billing (DCB) and bank deposit with a receipt image
- Customer-support agent portal, and a multi-tenant white-label system (other businesses run branded copies). We do not need multi-tenancy now; the `sites` design leaves room for it.
