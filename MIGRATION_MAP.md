# LAAS Real Estate — Laravel → React + Node.js Migration Map

Saldhigga: `C:\xampp\htdocs\laas-real-estate` (Laravel 12, SQLite, Blade, Tailwind v4, Alpine.js)
Mashruuca cusub: `C:\xampp\htdocs\laas-real-estate-react`

## QANEEYNTA GUUD

| Laravel | Node.js/React |
|---|---|
| PHP 8.2 / Laravel 12 | Node.js v24 + Express |
| Eloquent ORM | better-sqlite3 (SQL toos ah — schema lama taablin) |
| Blade + Alpine.js | React 18 + Vite + Tailwind CSS v4 |
| Session auth (database driver) | JWT (Authorization: Bearer) |
| bcrypt ($2y$12$) | bcryptjs (wuxuu aqbalaa $2y$ si toos ah) |
| Storage disk `public` | express.static + multer |
| Flash messages (session) | Toast/banner state (React context) |
| `lang/en`, `lang/so` | JSON locales (en.json, so.json) |

## DATABASE

Waa la copy-gareeyay `database/database.sqlite` → `backend/database/database.sqlite`
(Xogta iyo schema-ka OO DHAN waa kuwa asalka ah — wax lama beddelin).
`DB_PATH` ee `.env` ayaa xukuma halka uu faylku yaal.

Tables: users, customers, properties, land_sales, house_rentals, house_sales,
used_items, payments, cleaners, notifications, activity_logs, settings (+ Laravel system tables: sessions, cache, jobs, migrations, password_reset_tokens).

Soft deletes (deleted_at): users, customers, properties, land_sales, house_sales,
house_rentals, used_items, payments, cleaners.

## ROUTES MAPPING (web.php → Express)

### Public
| Laravel | Node API |
|---|---|
| GET /login (page) | GET /api/auth/me (check token) |
| POST /login | POST /api/auth/login {email,password,remember} |
| GET/POST /logout | POST /api/auth/logout |

### Authenticated (auth middleware)
| Laravel route | Controller@method | Node API |
|---|---|---|
| GET /dashboard | DashboardController@index | GET /api/dashboard |
| GET/POST /register | RegisterController | GET/POST /api/register (super_admin only — same as Laravel: auth-required page) |
| GET api/properties/{id} | PropertyController@apiShow | GET /api/properties/:id/show-json |
| resource customers | CustomerController | GET/POST /api/customers, GET/PUT/DELETE /api/customers/:id |
| GET properties/create/{type} | PropertyController@createByType | GET /api/properties/meta/create-types (React wuxuu leeyahay bogga doorashada) |
| resource properties | PropertyController | GET/POST /api/properties, GET/PUT/DELETE /api/properties/:id |
| resource land-sales | LandSaleController | /api/land-sales CRUD |
| PATCH land-sales/{id}/toggle-status | @toggleStatus | PATCH /api/land-sales/:id/toggle-status |
| resource house-rentals | HouseRentalController | /api/house-rentals CRUD + toggle-status |
| resource house-sales | HouseSaleController | /api/house-sales CRUD + toggle-status |
| resource used-items | UsedItemController | /api/used-items CRUD + toggle-status |
| resource payments | PaymentController | /api/payments CRUD |
| resource cleaners | CleanerController | /api/cleaners CRUD + toggle-status |
| resource users (role:super_admin) | UserController | /api/users CRUD (super_admin middleware) |
| GET/POST /backups, download, destroy | BackupController | GET/POST /api/backups, GET /api/backups/:filename/download, DELETE /api/backups/:filename |
| GET /notifications, read, read-all | NotificationController | GET /api/notifications, POST /api/notifications/:id/read, POST /api/notifications/read-all |
| GET /search?q= | SearchController | GET /api/search?q= |
| GET /recycle-bin, restore, force-delete | RecycleBinController | GET /api/recycle-bin?type=, POST /api/recycle-bin/:type/:id/restore, DELETE /api/recycle-bin/:type/:id/force-delete |
| GET /activity-logs | closure | GET /api/activity-logs?search=&module=&action=&page= |
| GET /settings + dhammaan POSTs | SettingsController | GET /api/settings, POST /api/settings/language/:locale, /two-factor/toggle, /security, /profile, /password, /profile-picture, /profile-picture/remove, /color, /font, /clear-data |

## BUSINESS LOGIC (la ilaaliyay sidaas oo kale)

1. **Customer number**: `CUST-00001` auto-generation on create (max+1 across withTrashed, LIKE 'CUST-%').
2. **Payment reference**: `PAY-YYYYMMDD-XXXXXX` (uniqid last 6 uppercase) on store; update ma beddelo.
3. **Activity logs**: created/updated/deleted/restored/permanently_deleted × modules (property, customer, land_sale, house_sale, house_rental, used_item, payment, cleaner, user, backup).
4. **Login rate limiting**: settings login_max_attempts (5), login_lockout_minutes (15), key = email|ip.
5. **Session timeout** → JWT expiry = session_timeout_minutes setting (default 120); sliding refresh.
6. **Password policy**: min length (8), uppercase/numeric/special toggles from settings.
7. **Roles**: super_admin, manager, agent, accountant. Users CRUD = super_admin only. Register = role 'agent'.
8. **Property types**: house, land, apartment, commercial, villa (+ UI aliases land-sale/house-sale/house-rental normalized). Conditional validation per type (house_type/bedrooms/bathrooms vs land_type; location in neighborhoods list).
9. **Neighborhoods**: Daami, Ex Control, Cadhootay, Saamaley, Sayidka, Dhakhtarka Wayn, Jaamalaaye, Dhiif, Farxaskulle, Buulaha Dowladda.
10. **Toggle statuses**: cleaner active↔inactive; rental/sale available↔not_available; used_item available↔sold (JSON responses).
11. **Recycle bin**: 9 model registry, restore + force-delete, display names per type.
12. **Backups**: SQLite file copy `backup-Y-m-d-H-i-s.sqlite` in storage/backups; download/delete.
13. **Settings keys**: password_min_length, password_require_uppercase/numeric/special, login_max_attempts, login_lockout_minutes, session_timeout_minutes, accent_color, font_size, font_family.
14. **Pagination**: 15/page lists; notifications & activity-logs 20/page; recycle-bin 15/page manual merge.
15. **Dashboard stats**: exact queries from DashboardController (total/available/rented/sold properties, customers, revenue sums, sales counts by status, this-month/last-month, recent 5s).

## UI MAPPING (Blade → React pages)

| Blade view | React page/component |
|---|---|
| layouts/app.blade.php | components/layout/AppLayout.jsx (sidebar + header + flash + delete modal) |
| layouts/guest.blade.php | components/layout/GuestLayout.jsx |
| auth/login, register | pages/Login.jsx, pages/Register.jsx |
| dashboard.blade.php | pages/Dashboard.jsx (stat cards + lists, isku design) |
| properties/type-select | pages/properties/TypeSelect.jsx |
| properties/index | pages/properties/Index.jsx (sort headers ▲▼, filters, status pills) |
| properties/create-* (7 files) | pages/properties/Create.jsx (type param) |
| properties/edit, show | pages/properties/Edit.jsx, Show.jsx |
| customers/* | pages/customers/{Index,Create,Edit,Show}.jsx |
| land-sales/* | pages/landSales/* |
| house-rentals/* | pages/houseRentals/* |
| house-sales/* | pages/houseSales/* |
| used-items/* | pages/usedItems/* |
| payments/* (show = receipt print) | pages/payments/* (Show.jsx w/ window.print) |
| cleaners/* | pages/cleaners/* |
| users/* | pages/users/* |
| backups/index | pages/Backups.jsx |
| notifications/index | pages/Notifications.jsx |
| search/results | pages/SearchResults.jsx |
| recycle-bin/index | pages/RecycleBin.jsx |
| activity-logs/index | pages/ActivityLogs.jsx |
| settings/index | pages/Settings.jsx (sections stacked) |
| components/phone-input | components/PhoneInput.jsx (country dropdown w/ flags) |

Design tokens (la ilaaliyay): Instrument Sans font, accent default #EAB308 (DB: #1c5197),
dark mode class-based localStorage, sidebar bg = accent, sky table heads, yellow focus rings,
rounded-lg inputs/buttons, rounded-xl cards, status pill colors, Laravel-style pagination.

## FILE UPLOADS

- Property image: multer → STORAGE_PATH/properties/, JSON array column `images`.
- Profile picture: STORAGE_PATH/profile-pictures/ (delete old then save).
- Allowed: jpeg,png,jpg,gif,webp; max 2MB.
- STORAGE_PATH (.env) hadda tuujinaya storage/app/public ee project-ka ASALKA AH si sawirrada hore u muuqdaan.

## WAXA AAN LA BEDDELIN (khasab ma aha)

- sessions/cache/jobs tables (Laravel internals) — Node uma baahnida.
- welcome.blade.php (unused).
- Chart.js salesChart component (registered laakiin unused) — optional.
