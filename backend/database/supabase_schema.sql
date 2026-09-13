-- =====================================================================
-- LAAS Real Estate — Supabase / PostgreSQL schema
-- Generated from: backend/database/database.sqlite (SQLite -> Postgres)
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- Migrated by: LAAS Real Estate Node.js/React migration
--
-- Conventions compared to SQLite:
--   INTEGER PRIMARY KEY AUTOINCREMENT  -> serial
--   tinyint(1) 0/1  (is_active, is_buyer, two_factor_enabled ...) -> smallint
--   datetime                          -> timestamp
--   REAL                              -> double precision
--   date('now')                       -> CURRENT_DATE
-- =====================================================================

-- ---------------------------------------------------------------
-- users
-- ---------------------------------------------------------------
create table if not exists users (
  id                  serial primary key,
  name                varchar not null,
  email               varchar not null,
  email_verified_at   timestamp,
  password            varchar not null,
  remember_token      varchar,
  phone               varchar,
  role                varchar not null default 'agent',
  is_active           smallint not null default 1,
  created_at          timestamp,
  updated_at          timestamp,
  two_factor_enabled  smallint not null default 0,
  username            varchar,
  profile_picture     varchar,
  deleted_at          timestamp
);

create unique index if not exists users_email_unique    on users (email);
create unique index if not exists users_username_unique on users (username);

-- ---------------------------------------------------------------
-- settings
-- ---------------------------------------------------------------
create table if not exists settings (
  id          serial primary key,
  key         varchar not null,
  value       text,
  created_at  timestamp,
  updated_at  timestamp
);

create unique index if not exists settings_key_unique on settings (key);

-- ---------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------
create table if not exists customers (
  id              serial primary key,
  first_name      varchar not null,
  last_name       varchar not null,
  email           varchar,
  phone           varchar,
  address         varchar,
  id_type         varchar,
  is_buyer        smallint not null default 0,
  is_tenant       smallint not null default 0,
  notes           text,
  created_at      timestamp,
  updated_at      timestamp,
  customer_number varchar,
  deleted_at      timestamp
);

create unique index if not exists customers_email_unique          on customers (email);
create unique index if not exists customers_customer_number_unique on customers (customer_number);

-- ---------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------
create table if not exists properties (
  id              serial primary key,
  title           varchar not null,
  description     text,
  type            varchar not null,
  status          varchar not null default 'available',
  location        varchar,
  price           numeric,
  area            varchar,
  bedrooms        integer,
  bathrooms       integer,
  amenities       text,
  images          text,
  notes           text,
  registered_by   integer references users (id),
  created_at      timestamp,
  updated_at      timestamp,
  deleted_at      timestamp,
  address         varchar,
  house_type      varchar,
  floors          integer,
  land_type       varchar,
  phone           varchar,
  owner           varchar
);

create index if not exists properties_registered_by_index on properties (registered_by);

-- ---------------------------------------------------------------
-- land_sales
-- ---------------------------------------------------------------
create table if not exists land_sales (
  id             serial primary key,
  property_id    integer not null references properties (id),
  customer_id    integer not null references customers (id),
  sale_price     numeric not null,
  commission     numeric not null default 0,
  sale_date      date not null,
  payment_method varchar,
  notes          text,
  registered_by  integer references users (id),
  created_at     timestamp,
  updated_at     timestamp,
  status         varchar(20) not null default 'available',
  deleted_at     timestamp,
  meters         varchar,
  location       varchar
);

create index if not exists land_sales_property_id_index  on land_sales (property_id);
create index if not exists land_sales_customer_id_index on land_sales (customer_id);

-- ---------------------------------------------------------------
-- house_sales
-- ---------------------------------------------------------------
create table if not exists house_sales (
  id             serial primary key,
  property_id    integer not null references properties (id),
  customer_id    integer not null references customers (id),
  sale_price     numeric not null,
  commission     numeric not null default 0,
  sale_date      date not null,
  payment_method varchar,
  notes          text,
  registered_by  integer references users (id),
  created_at     timestamp,
  updated_at     timestamp,
  status         varchar(20) not null default 'available',
  deleted_at     timestamp,
  location       varchar
);

create index if not exists house_sales_property_id_index  on house_sales (property_id);
create index if not exists house_sales_customer_id_index on house_sales (customer_id);

-- ---------------------------------------------------------------
-- house_rentals
-- ---------------------------------------------------------------
create table if not exists house_rentals (
  id             serial primary key,
  property_id    integer not null references properties (id),
  customer_id    integer not null references customers (id),
  rent_amount    numeric not null,
  deposit        numeric not null default 0,
  start_date     date not null,
  end_date       date,
  notes          text,
  registered_by  integer references users (id),
  created_at     timestamp,
  updated_at     timestamp,
  status         varchar(20) not null default 'available',
  deleted_at     timestamp,
  location       varchar,
  commission     double precision not null default 0
);

create index if not exists house_rentals_property_id_index  on house_rentals (property_id);
create index if not exists house_rentals_customer_id_index on house_rentals (customer_id);

-- ---------------------------------------------------------------
-- used_items
-- ---------------------------------------------------------------
create table if not exists used_items (
  id             serial primary key,
  name           varchar not null,
  description    text,
  category       varchar,
  price          numeric not null,
  condition      varchar check (condition in ('new', 'good', 'fair', 'poor')) not null default 'good',
  status         varchar check (status in ('available', 'sold')) not null default 'available',
  images         text,
  customer_id    integer references customers (id),
  sold_to        integer references customers (id),
  sold_date      date,
  notes          text,
  registered_by  integer references users (id),
  created_at     timestamp,
  updated_at     timestamp,
  deleted_at     timestamp
);

create index if not exists used_items_customer_id_index on used_items (customer_id);

-- ---------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------
create table if not exists payments (
  id               serial primary key,
  payable_type     varchar,
  payable_id       integer,
  customer_id      integer,
  property_id      integer,
  amount           numeric not null default 0,
  payment_method   varchar not null default 'cash',
  reference_number varchar,
  payment_date     date not null default current_date,
  status           varchar not null default 'completed',
  notes            text,
  processed_by     integer,
  created_at       timestamp,
  updated_at       timestamp,
  deleted_at       timestamp
);

create index if not exists payments_customer_id_index on payments (customer_id);

-- ---------------------------------------------------------------
-- commissions
-- ---------------------------------------------------------------
create table if not exists commissions (
  id               serial primary key,
  commission_type  text not null,
  commission_id    integer not null,
  property_id      integer,
  customer_id      integer,
  amount           double precision not null default 0,
  rate             double precision not null default 0,
  commission       double precision not null default 0,
  status           text not null default 'pending',
  registered_by    integer,
  created_at       timestamp,
  updated_at       timestamp,
  deleted_at       timestamp
);

create index if not exists commissions_commission_type_id_index on commissions (commission_type, commission_id);

-- ---------------------------------------------------------------
-- cleaners
-- ---------------------------------------------------------------
create table if not exists cleaners (
  id             serial primary key,
  first_name     varchar not null,
  last_name      varchar not null,
  phone          varchar,
  email          varchar,
  address        text,
  salary         numeric not null default 0,
  status         varchar check (status in ('active', 'inactive')) not null default 'active',
  notes          text,
  registered_by  integer references users (id),
  created_at     timestamp,
  updated_at     timestamp,
  deleted_at     timestamp
);

-- ---------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------
create table if not exists notifications (
  id               varchar primary key,
  type             varchar not null,
  notifiable_type  varchar not null,
  notifiable_id    integer not null,
  data             text not null,
  read_at          timestamp,
  created_at       timestamp,
  updated_at       timestamp
);

create index if not exists notifications_notifiable_type_notifiable_id_index on notifications (notifiable_type, notifiable_id);

-- ---------------------------------------------------------------
-- activity_logs
-- ---------------------------------------------------------------
create table if not exists activity_logs (
  id           serial primary key,
  user_id      integer references users (id),
  action       varchar not null,
  module       varchar,
  description  text,
  old_values   text,
  new_values   text,
  created_at   timestamp,
  updated_at   timestamp
);

create index if not exists activity_logs_user_id_index on activity_logs (user_id);

-- ---------------------------------------------------------------
-- public_inquiries
-- ---------------------------------------------------------------
create table if not exists public_inquiries (
  id         serial primary key,
  type       text not null,
  name       text not null,
  email      text not null,
  phone      text,
  interest   text,
  subject    text,
  message    text,
  created_at timestamp,
  updated_at timestamp
);