-- Database is created by MySQL container via MYSQL_DATABASE env.
-- This script runs on the empty database the first time the container starts.

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ─── Schema ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_items (
  id          VARCHAR(16)  NOT NULL PRIMARY KEY,
  category    ENUM('manis', 'asin', 'drink', 'paket') NOT NULL,
  name        VARCHAR(255) NOT NULL,
  price       INT          NOT NULL,
  monogram    VARCHAR(4)   NOT NULL,
  accent      ENUM('green', 'yellow', 'cream', 'cocoa') NOT NULL,
  tag         VARCHAR(64)  NULL,
  hot         TINYINT(1)   NOT NULL DEFAULT 0,
  sold_out    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type            VARCHAR(32)  NOT NULL DEFAULT 'dine-in',
  table_no        VARCHAR(16)  NULL,
  customer_name   VARCHAR(128) NULL,
  subtotal        INT          NOT NULL,
  discount        INT          NOT NULL DEFAULT 0,
  tax             INT          NOT NULL DEFAULT 0,
  total           INT          NOT NULL,
  payment_method  VARCHAR(32)  NOT NULL,
  cash_received   INT          NOT NULL DEFAULT 0,
  change_due      INT          NOT NULL DEFAULT 0,
  status          ENUM('paid', 'cancelled', 'refunded') NOT NULL DEFAULT 'paid',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_lines (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id    INT          NOT NULL,
  menu_id     VARCHAR(16)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  mods        TEXT         NULL,
  qty         INT          NOT NULL,
  unit_price  INT          NOT NULL,
  monogram    VARCHAR(4)   NOT NULL,
  accent      VARCHAR(16)  NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Seed: menu_items ────────────────────────────────────────────
-- Sama dengan src/data/menu.ts di frontend supaya cocok kalau frontend
-- nanti fetch dari API.

INSERT INTO menu_items (id, category, name, price, monogram, accent, tag, hot, sold_out) VALUES
  ('m1', 'manis', 'Martabak Manis Cokelat Keju',          45000, 'C', 'cocoa',  NULL,      1, 0),
  ('m2', 'manis', 'Martabak Manis Pisang Cokelat',        50000, 'P', 'cream',  NULL,      0, 0),
  ('m3', 'manis', 'Martabak Manis Nutella Tiramisu',      65000, 'N', 'cocoa',  'Premium', 0, 0),
  ('m4', 'manis', 'Martabak Manis Greentea Keju',         55000, 'G', 'green',  NULL,      0, 0),
  ('m5', 'manis', 'Martabak Manis Spesial Iqbal',         75000, 'S', 'yellow', NULL,      1, 0),
  ('m6', 'manis', 'Martabak Manis Mini (12 pcs)',         38000, 'M', 'cream',  NULL,      0, 0),
  ('m7', 'manis', 'Martabak Red Velvet Cheese',           60000, 'R', 'cocoa',  NULL,      0, 0),
  ('m8', 'manis', 'Martabak Manis Original Wijen',        32000, 'W', 'yellow', NULL,      0, 1),
  ('a1', 'asin',  'Martabak Telur Sapi',                  40000, 'T', 'yellow', NULL,      1, 0),
  ('a2', 'asin',  'Martabak Telur Ayam',                  38000, 'A', 'yellow', NULL,      0, 0),
  ('a3', 'asin',  'Martabak Telur Spesial 4 Telur',       58000, 'S', 'cream',  'Premium', 0, 0),
  ('a4', 'asin',  'Martabak Telur Mini Sapi',             28000, 'M', 'cream',  NULL,      0, 0);
