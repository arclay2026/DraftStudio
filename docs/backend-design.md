# Draft Studio backend: design

Status: **draft for review**. Nothing here is built yet. Mark anything you want changed and the
plan updates before the first line of code.

Stack: **PHP 8.3 + MySQL 8 on Hostinger Premium**, no framework. The site stays static HTML/CSS/JS.

---

## 1. Decisions and assumptions

| # | Decision | Why | Status |
|---|---|---|---|
| D1 | PHP + MySQL on Hostinger, no framework | Runs on the plan we're buying, no build step, few dependencies to patch; PayFast's own docs are PHP | Agreed |
| D2 | Payments through **PayFast** (Rand, South African bank payouts) | Prices are in Rand and the business is in South Africa; Stripe doesn't onboard SA businesses directly | **Assumed: confirm country** |
| D3 | We sell **exclusive logos** (one buyer each) and **paid packs** (many buyers) | Covers what's on the site now plus bundles later | **Assumed: confirm** |
| D4 | Membership (monthly access) is **not** in version 1 | Recurring billing adds a lot; the tables leave room for it | Later |
| D5 | **Guest checkout**; an account is optional | Forcing sign-up before paying loses sales. Guests get the download link by email and can claim the order into an account later | Recommended |
| D6 | The whole site moves from GitHub Pages to Hostinger, one domain | Pages, API and private files share one origin: simpler cookies, no cross-site requests | Recommended |
| D7 | `js/data.js` stays the catalogue the site shows; **the database is the authority for price and stock** | The site keeps working as now; the browser is never trusted for a price | Agreed |
| D8 | Money is stored as **whole cents** (`45000` = R450.00) | No rounding errors | Agreed |
| D9 | One dependency: **PHPMailer** for sending email over Hostinger SMTP | PHP's `mail()` lands in spam; everything else is plain PHP | Recommended |
| D10 | Exclusive logos come with a signed **copyright transfer PDF** in the buyer's name, not a decorative certificate | South African copyright law expects a transfer to be in writing and signed; a lawyer should check the wording once | Agreed |

---

## 2. How it fits together

```
Visitor's browser
   │  same domain, HTTPS only
   ▼
Hostinger
 ├─ public_html/              ← what the web can reach
 │   ├─ index.html, browse.html, item.html, …   (the current static site)
 │   ├─ account.html, signin.html, checkout/…   (new pages, same design)
 │   └─ api/index.php         ← the ONLY PHP file the public can call (one front door)
 │
 └─ app/                      ← outside public_html: the web can't reach it
     ├─ src/                  ← the PHP code (routes, auth, payments, mail)
     ├─ config.php            ← database password, PayFast keys, SMTP (never in git)
     ├─ storage/products/     ← the paid files (zips): only handed out by the API
     └─ storage/logs/

MySQL database (Hostinger)          PayFast
   ▲  PDO, prepared statements         │  1. browser goes to PayFast to pay
   └──────── app/src ◄─────────────────┘  2. PayFast calls api/payfast/itn (server to server)
```

- **One front door.** Every request to `/api/...` goes to `api/index.php`, which loads the code from `app/`. A mistake in a code file can't expose it, because the web can't reach `app/` at all.
- **Paid files never sit in `public_html`.** They're streamed by the API only after a paid order is checked.
- **Deploys:** GitHub stays the source. Hostinger's Git deploy pulls `main` into `public_html`; `app/` is synced from the repo's `server/` folder. `config.php` and `storage/` are created once on the server and never committed.
- **Scheduled job:** a Hostinger cron job runs `app/src/cron.php` every 5 minutes to release expired logo holds and clean up old tokens.

---

## 3. Database

MySQL 8, `utf8mb4`, InnoDB (so transactions and row locks work), all times stored in UTC.

### 3.1 Tables at a glance

| Table | Holds |
|---|---|
| `users` | Accounts: email, password hash, name, verified yet |
| `sessions` | Who is signed in on which device |
| `auth_tokens` | One-time links: verify email, reset password, claim a guest order |
| `login_attempts` | Recent sign-in attempts, to slow down password guessing |
| `products` | Everything for sale: price, kind (exclusive or pack), stock status, the hold |
| `product_files` | The private files that make up each product |
| `orders` | One checkout: who, total, status |
| `order_items` | The products inside an order (and the price paid at the time) |
| `payments` | Every message PayFast sends us, kept as proof |
| `download_tokens` | Expiring, limited download links |

### 3.2 Schema

```sql
CREATE TABLE users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(254) NOT NULL,
  email_verified_at DATETIME NULL,
  password_hash   VARCHAR(255) NOT NULL,          -- password_hash(..., PASSWORD_ARGON2ID)
  name            VARCHAR(100) NOT NULL DEFAULT '',
  role            ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME NULL,                  -- account deletion (POPIA): personal fields wiped, orders kept
  UNIQUE KEY uq_users_email (email)               -- stored lower-cased
);

CREATE TABLE sessions (
  id              CHAR(64) PRIMARY KEY,           -- SHA-256 of the cookie value; the raw value is only in the cookie
  user_id         BIGINT UNSIGNED NOT NULL,
  csrf_secret     CHAR(64) NOT NULL,
  ip              VARBINARY(16) NULL,
  user_agent      VARCHAR(255) NOT NULL DEFAULT '',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME NOT NULL,              -- 30 days, sliding
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY ix_sessions_user (user_id)
);

CREATE TABLE auth_tokens (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token_hash      CHAR(64) NOT NULL,              -- SHA-256; the raw token is only in the email link
  purpose         ENUM('verify_email','reset_password','claim_order') NOT NULL,
  user_id         BIGINT UNSIGNED NULL,
  order_id        BIGINT UNSIGNED NULL,
  expires_at      DATETIME NOT NULL,              -- verify 48h, reset 1h, claim 30 days
  used_at         DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_auth_tokens_hash (token_hash)
);

CREATE TABLE login_attempts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(254) NOT NULL,
  ip              VARBINARY(16) NOT NULL,
  succeeded       BOOLEAN NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_login_email_time (email, created_at),
  KEY ix_login_ip_time (ip, created_at)
);

CREATE TABLE products (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(100) NOT NULL,          -- same as the id in js/data.js, e.g. 'kaven-logo'
  title           VARCHAR(200) NOT NULL,
  kind            ENUM('exclusive','pack') NOT NULL,
  price_cents     INT UNSIGNED NOT NULL,          -- the price actually charged
  price_from      BOOLEAN NOT NULL DEFAULT FALSE, -- "From R450": see 5.5
  currency        CHAR(3) NOT NULL DEFAULT 'ZAR',
  status          ENUM('draft','available','held','sold','retired') NOT NULL DEFAULT 'draft',
  held_until      DATETIME NULL,                  -- exclusive logos only
  held_by_order   BIGINT UNSIGNED NULL,
  sold_at         DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_products_slug (slug)
);

CREATE TABLE product_files (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id      BIGINT UNSIGNED NOT NULL,
  label           VARCHAR(100) NOT NULL,          -- 'All formats (ZIP)'
  storage_path    VARCHAR(255) NOT NULL,          -- relative to app/storage/products/
  bytes           BIGINT UNSIGNED NOT NULL,
  sha256          CHAR(64) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  public_ref      CHAR(12) NOT NULL,              -- shown to customers, e.g. 'DS-7K2M9QX4'; never the numeric id
  user_id         BIGINT UNSIGNED NULL,           -- NULL for guest checkout until claimed
  email           VARCHAR(254) NOT NULL,          -- where the receipt and links go
  name            VARCHAR(100) NOT NULL DEFAULT '',
  status          ENUM('pending','paid','failed','cancelled','expired','refunded') NOT NULL DEFAULT 'pending',
  total_cents     INT UNSIGNED NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'ZAR',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at         DATETIME NULL,
  UNIQUE KEY uq_orders_ref (public_ref),
  KEY ix_orders_user (user_id),
  KEY ix_orders_email (email)
);

CREATE TABLE order_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT UNSIGNED NOT NULL,
  product_id      BIGINT UNSIGNED NOT NULL,
  unit_price_cents INT UNSIGNED NOT NULL,         -- frozen at checkout, even if the price changes later
  title_snapshot  VARCHAR(200) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY uq_order_product (order_id, product_id)
);

CREATE TABLE payments (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT UNSIGNED NULL,
  provider        VARCHAR(20) NOT NULL DEFAULT 'payfast',
  provider_ref    VARCHAR(64) NULL,               -- PayFast pf_payment_id
  status          VARCHAR(20) NOT NULL,           -- COMPLETE / FAILED / CANCELLED as PayFast sent it
  amount_cents    INT NULL,
  raw_payload     JSON NOT NULL,                  -- everything PayFast sent, for disputes
  verified        BOOLEAN NOT NULL,               -- passed every check in 5.2
  received_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payments_ref (provider, provider_ref, status)   -- the same notice twice is ignored
);

CREATE TABLE download_tokens (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token_hash      CHAR(64) NOT NULL,
  order_item_id   BIGINT UNSIGNED NOT NULL,
  product_file_id BIGINT UNSIGNED NOT NULL,
  expires_at      DATETIME NOT NULL,              -- 7 days; signed-in users can mint a fresh one any time
  max_uses        TINYINT UNSIGNED NOT NULL DEFAULT 5,
  uses            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_download_hash (token_hash),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id),
  FOREIGN KEY (product_file_id) REFERENCES product_files(id)
);
```

Room for later: a `subscriptions` table (membership) and a `coupons` table slot in without changing the tables above.

---

## 4. API

All under `/api`, JSON in and out. "CSRF" means the request must carry the `X-CSRF-Token` header (section 6). Errors come back as `{ "error": { "code": "...", "message": "..." } }` with a matching HTTP status.

| Method | Path | Who | CSRF | Does |
|---|---|---|---|---|
| GET | `/api/me` | anyone | | The signed-in user (or `null`) and a fresh CSRF token |
| POST | `/api/auth/signup` | anyone | ✓ | Create an account, send the verification email |
| POST | `/api/auth/verify` | anyone | ✓ | Confirm the email from the link |
| POST | `/api/auth/signin` | anyone | ✓ | Sign in, set the session cookie |
| POST | `/api/auth/signout` | signed in | ✓ | End this session |
| POST | `/api/auth/forgot` | anyone | ✓ | Email a reset link (same reply whether or not the email exists) |
| POST | `/api/auth/reset` | anyone | ✓ | Set a new password from the link; signs out every other device |
| POST | `/api/account/password` | signed in | ✓ | Change password (needs the current one) |
| POST | `/api/account/delete` | signed in | ✓ | Delete the account (needs the password) |
| GET | `/api/products/status` | anyone | | `{ "kaven-logo": "available", "mato-logo": "sold", … }` so the site can show Sold badges live |
| POST | `/api/checkout` | anyone | ✓ | Body `{ product, email, name }` → holds the item, creates the order, returns the PayFast form to post |
| POST | `/api/payfast/itn` | PayFast only | | Payment notice (section 5.2) |
| GET | `/api/orders` | signed in | | My purchases |
| GET | `/api/orders/{ref}` | owner, or the link from the email | | One order and its download links |
| POST | `/api/orders/claim` | signed in | ✓ | Attach a guest order to my account (from the claim link) |
| GET | `/api/download/{token}` | link holder | | Streams the file |
| | `/api/admin/...` | admin | ✓ | Orders list, mark sold or available, refund note (version 1.1) |

---

## 5. The important flows

### 5.1 Checkout

```
Buyer clicks "Buy now" on item.html
  → POST /api/checkout { product: 'kaven-logo', email, name }
       BEGIN
         SELECT … FROM products WHERE slug = ? FOR UPDATE          ← locks the row
         exclusive and status = 'available' (or held but expired)?
             → status = 'held', held_until = now + 15 min
         pack and status = 'available'? → no hold needed
         otherwise → 409 "Just sold" (or "Someone is checking out, try again in a few minutes")
         INSERT orders (pending) + order_items (price from the DATABASE, never the browser)
       COMMIT
  ← the PayFast fields, signed with our passphrase
Browser posts them to PayFast → buyer pays
PayFast sends the buyer back to /checkout/thanks.html?ref=DS-…   (shows "Confirming your payment…")
PayFast calls /api/payfast/itn                                   (the only thing that marks it paid)
```

- **Why the hold:** two people can't pay for the same one-of-a-kind logo. If payment doesn't arrive in 15 minutes, the cron job puts it back on sale and the order becomes `expired`.
- **Late payment edge case:** if a payment arrives after the hold expired *and* someone else already bought the logo, the order is marked paid, flagged for a refund, and you get an email. That should be very rare, and it's handled rather than ignored.
- The return page doesn't trust the redirect. It polls `GET /api/orders/{ref}` until the ITN has arrived.

### 5.2 PayFast payment notice (ITN): every check, in order

1. Read the posted fields exactly as received.
2. **Signature:** rebuild it with our passphrase and compare (`hash_equals`).
3. **Source:** the request comes from PayFast's published hosts (resolved by DNS, not a hard-coded list).
4. **Amount:** `amount_gross` equals the order's `total_cents`.
5. **Server confirmation:** post the data back to PayFast's validate endpoint; it must answer `VALID`.
6. **Once only:** insert into `payments` with the unique key `(provider, provider_ref, status)`; a duplicate notice changes nothing.
7. Only if all pass and the status is `COMPLETE`, in **one transaction**:
   - the order becomes `paid`
   - an exclusive product becomes `sold` and its hold is cleared
   - download tokens are created
8. Then send the receipt email with the download links (and the claim link for a guest).
9. Always answer `200` quickly; any failure is logged and emailed to you, never shown to PayFast.

All of this is first built against **PayFast's sandbox**, with a switch in `config.php`.

### 5.3 Downloads

- A link looks like `/api/download/<random 32-byte token>`. Only its SHA-256 is stored.
- Checks: the token exists, hasn't expired, has uses left, and the order is still `paid` (a refund turns the links off).
- The file is streamed in chunks from `app/storage/products/` with `Content-Disposition: attachment`, and nothing is cached publicly.
- Signed-in buyers can always get fresh links from "My purchases", so expired emails aren't a problem.

### 5.4 Copyright transfer (exclusive logos)

When an exclusive logo is paid, the ITN step also fills in a one-page PDF from a fixed template: buyer name, logo, order number, date, price and Draft Studio's signature image. It's saved with the order and listed with the other files, so it shows on the order page, in the email and under My purchases. One small PDF library (for example FPDF, no other dependencies) does this.

### 5.5 "From R450" prices

Wiltz and Mato are "From R450": the base logo is R450 and extra work costs more. Version 1 charges the base price online, and the receipt invites the buyer to WhatsApp for extras. **Confirm this is what "From" means.**

### 5.6 Accounts

- **Sign up:** email, password (at least 10 characters, checked against a list of common passwords), name. A verification email is sent. Buying works before verification; viewing past orders needs it.
- **Sign in:** same error for a wrong email or a wrong password, so nobody can test which emails exist.
- **Forgot password:** always replies "If that email has an account, a link is on its way."
- **Guest to account:** the receipt email has a "Save this purchase to an account" link (`claim_order` token). Signing up with the same email also attaches past guest orders once the email is verified.

---

## 6. Security rules

| Area | Rule |
|---|---|
| Passwords | `password_hash($p, PASSWORD_ARGON2ID)` (bcrypt if the server lacks Argon2); `password_needs_rehash` on sign-in |
| Session cookie | `__Host-ds_sid`: random 32 bytes, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`; only its hash is stored; a new one is issued at sign-in |
| CSRF | Every state-changing request needs `X-CSRF-Token` matching an HMAC of the session's `csrf_secret` (guests get a signed cookie token). The `Origin` header must be our domain |
| Guessing limits | Per email: 5 failed sign-ins per 15 minutes. Per IP: 30 per 15 minutes. Then a short wait. Same idea for forgot password and checkout |
| Database | PDO with real prepared statements (`ATTR_EMULATE_PREPARES = false`), `ERRMODE_EXCEPTION`, `utf8mb4`. No SQL is ever built from input |
| Input | Every endpoint validates its JSON against an explicit list of allowed fields, types and lengths |
| Secrets | `config.php` outside `public_html`, readable only by the account, never in git. PayFast passphrase, DB password and SMTP password live only there |
| Headers | `Strict-Transport-Security`, `Content-Security-Policy` (scripts only from our domain and the CDNs we already use), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'` |
| Errors | Customers see a short message; details go to `app/storage/logs` (rotated) and serious ones are emailed to you |
| Privacy (POPIA) | We collect only email, name and order history. Privacy policy page, account deletion, no card data ever touches our server (PayFast handles it) |
| Backups | Hostinger daily backups, plus a weekly database export kept off the server |

---

## 7. Changes to the website

- **Header:** a "Sign in" button; once signed in, the user's initial with a menu (My purchases, Account, Sign out).
- **Item page:** for a paid item, **Buy now** (blue, opens a small checkout sheet: email and name, or prefilled when signed in). WhatsApp stays as "Ask a question".
- **Sold badges:** the site asks `/api/products/status` and shows Sold / On hold live, so `sold: true` no longer has to be edited by hand in `data.js`.
- **New pages, in the current design:** `signin.html` (sign in / sign up / forgot, one page with tabs), `account.html` (My purchases, Account settings), `checkout/thanks.html`, `checkout/cancelled.html`, `verify.html`, `reset.html`, `privacy.html`.
- **Translations:** every new string goes into the five language files as usual.
- Everything keeps working if the API is down: the shop shows "Payments are paused, message us on WhatsApp".

---

## 8. Products: keeping the site and the database in step

`js/data.js` keeps describing products for display. A small tool, `tools/sync-products.php` (run on the server after a deploy), reads a generated `products.json` (built from `data.js` by `tools/bump.sh`) and upserts the `products` rows: title, kind and price. It **never** changes `status`, so it can't un-sell a logo. Paid zips are uploaded once to `app/storage/products/` through Hostinger's File Manager (or SFTP) and listed in `product_files`.

---

## 9. Build order

| Step | What | Done when |
|---|---|---|
| 0 | Hostinger set up: domain, SSL, PHP 8.3, database, Git deploy, `config.php`, cron | `GET /api/health` answers `ok` on the real domain |
| 1 | Database + core (router, JSON, errors, PDO, config, logging, security headers) | Tables created by a migration script; health check reads the DB |
| 2 | Accounts: sign up, verify, sign in/out, forgot/reset, rate limits, CSRF | Automated tests pass for every flow, including the attacks in section 6 |
| 3 | Products, checkout, holds, PayFast sandbox ITN | A sandbox purchase goes from Buy to `paid`, and two parallel checkouts of one exclusive logo can't both win |
| 4 | Downloads + emails (receipt, links, claim, verify, reset) | Real emails arrive, links expire and count uses |
| 5 | Website UI: sign-in page, account page, Buy now, live Sold badges, translations | Desktop and phone screenshots checked in light and dark |
| 6 | Go live | Switch PayFast to live; one real low-price test purchase; remove the paid zips from the public GitHub history; GitHub Pages turned off |

Each step is tested before the next starts. Steps 1 to 4 can be built and tested here against a local PHP + MySQL before Hostinger is ready; step 0 is the only one that needs your Hostinger login.

---

## 10. Open questions for you

1. **Country:** South Africa? (decides PayFast)
2. **Hostinger:** bought yet? Which domain?
3. **What you sell:** exclusive logos only, or packs too? Membership later?
4. **"From R450":** is charging the base price online, with extras arranged on WhatsApp, right?
5. **Accounts:** guest checkout with optional accounts (recommended), or must buyers sign up?
6. **Sign in with Google:** wanted? (Doable in PHP later; it's the one place Supabase would have been quicker.)
7. **Email address** for receipts: e.g. `orders@yourdomain` (needs the domain on Hostinger).
