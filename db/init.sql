-- Database is created by MySQL container via MYSQL_DATABASE env.
-- This script runs on the empty database the first time the container starts.

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- ─── Schema ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_items (
  id          VARCHAR(16)  NOT NULL PRIMARY KEY,
  category    ENUM('manis', 'asin', 'drink', 'paket') NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  price       INT          NOT NULL,
  monogram    VARCHAR(4)   NOT NULL,
  accent      ENUM('green', 'yellow', 'cream', 'cocoa') NOT NULL,
  tag         VARCHAR(64)  NULL,
  hot         TINYINT(1)   NOT NULL DEFAULT 0,
  sold_out    TINYINT(1)   NOT NULL DEFAULT 0,
  image_mime  VARCHAR(32)  NULL,
  image_data  MEDIUMBLOB   NULL,
  image_updated_at TIMESTAMP NULL DEFAULT NULL,
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0,
  deleted_at  TIMESTAMP    NULL DEFAULT NULL,
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
  rounding        INT          NOT NULL DEFAULT 0,
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

-- Tabel di bawah juga dibuat otomatis oleh backend saat start (ensureSchema)
-- untuk database yang sudah ada sebelumnya.

-- Akun login. Akun pertama dibuat backend dari env ADMIN_USERNAME/PASSWORD.
CREATE TABLE IF NOT EXISTS users (
  id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(64)  NOT NULL UNIQUE,
  name           VARCHAR(128) NOT NULL,
  role           ENUM('operator', 'admin') NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  CHAR(64)   NOT NULL PRIMARY KEY,
  user_id     INT        NOT NULL,
  expires_at  DATETIME   NOT NULL,
  created_at  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Operator yang mencatat pesanan.
ALTER TABLE orders
  ADD COLUMN created_by INT NULL AFTER status,
  ADD CONSTRAINT fk_orders_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Bukti pembayaran (QRIS / transfer) per pesanan. Disimpan di DB supaya
-- ikut ter-backup lewat mysqldump.
CREATE TABLE IF NOT EXISTS order_attachments (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id    INT          NOT NULL,
  kind        VARCHAR(32)  NOT NULL,
  mime        VARCHAR(32)  NOT NULL,
  size_bytes  INT          NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_order_kind (order_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add-on per kategori menu (ukuran, topping, dll). Isi bawaan dimasukkan
-- backend saat start (backend/src/seed/options.ts).
CREATE TABLE IF NOT EXISTS option_groups (
      id          VARCHAR(32)  NOT NULL PRIMARY KEY,
      category    ENUM('manis', 'asin', 'drink', 'paket') NOT NULL,
      label       VARCHAR(64)  NOT NULL,
      kind        ENUM('single', 'multi') NOT NULL,
      max_select  INT          NULL,
      sort_order  INT          NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_options (
      id                VARCHAR(32)  NOT NULL PRIMARY KEY,
      group_id          VARCHAR(32)  NOT NULL,
      label             VARCHAR(64)  NOT NULL,
      sub               VARCHAR(128) NULL,
      price             INT          NOT NULL DEFAULT 0,
      is_default        TINYINT(1)   NOT NULL DEFAULT 0,
      sold_out          TINYINT(1)   NOT NULL DEFAULT 0,
      monogram          VARCHAR(4)   NOT NULL DEFAULT '?',
      accent            ENUM('green', 'yellow', 'cream', 'cocoa') NOT NULL DEFAULT 'cream',
      image_mime        VARCHAR(32)  NULL,
      image_data        MEDIUMBLOB   NULL,
      image_updated_at  TIMESTAMP    NULL DEFAULT NULL,
      sort_order        INT          NOT NULL DEFAULT 0,
      deleted_at        TIMESTAMP    NULL DEFAULT NULL,
      created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES option_groups(id),
      INDEX idx_group (group_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Menu ─────────────────────────────────────────────────────────
-- Isi menu & foto bawaan dimasukkan oleh backend saat start
-- (backend/src/seed/menu.ts + backend/assets/menu/*.jpg).
