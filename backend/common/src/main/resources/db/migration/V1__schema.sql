CREATE TABLE accounts (
 id VARCHAR(64) PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, role VARCHAR(255) NOT NULL, blocked BIT NOT NULL DEFAULT 0,
 balance DECIMAL(19,2) NOT NULL DEFAULT 12500, auth_version BIGINT NOT NULL DEFAULT 0, version BIGINT NOT NULL DEFAULT 0,
 CONSTRAINT ck_account_role CHECK(role IN ('ADMIN','CLIENTE')), CONSTRAINT ck_balance CHECK(balance>=0)
);
CREATE TABLE products (
 id VARCHAR(64) PRIMARY KEY, name VARCHAR(100) NOT NULL, weapon VARCHAR(255), finish VARCHAR(255),
 category VARCHAR(255) NOT NULL, rarity VARCHAR(255) NOT NULL, color VARCHAR(255), price DECIMAL(19,2) NOT NULL,
 stock INT NOT NULL, collection VARCHAR(255), wear VARCHAR(255), image VARCHAR(1000) NOT NULL,
 featured BIT NOT NULL DEFAULT 0, deleted BIT NOT NULL DEFAULT 0, version BIGINT NOT NULL DEFAULT 0,
 CONSTRAINT ck_price CHECK(price>=0), CONSTRAINT ck_stock CHECK(stock>=0)
);
CREATE TABLE cart_items (
 id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) NOT NULL, product_id VARCHAR(64) NOT NULL, quantity INT NOT NULL,
 CONSTRAINT uq_cart UNIQUE(user_id,product_id),
 CONSTRAINT fk_cart_user FOREIGN KEY(user_id) REFERENCES accounts(id) ON DELETE CASCADE,
 CONSTRAINT fk_cart_product FOREIGN KEY(product_id) REFERENCES products(id), CONSTRAINT ck_quantity CHECK(quantity>0)
);
CREATE TABLE purchases (
 id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) NOT NULL, request_key VARCHAR(255) NOT NULL,
 created_at TIMESTAMP(6) NOT NULL, total DECIMAL(19,2) NOT NULL, items_json LONGTEXT NOT NULL,
 CONSTRAINT uq_purchase_request UNIQUE(user_id,request_key),
 CONSTRAINT fk_purchase_user FOREIGN KEY(user_id) REFERENCES accounts(id), CONSTRAINT ck_total CHECK(total>=0)
);
CREATE TABLE refresh_sessions (
 hash VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) NOT NULL, expires_at TIMESTAMP(6) NOT NULL, auth_version BIGINT NOT NULL,
 CONSTRAINT fk_refresh_user FOREIGN KEY(user_id) REFERENCES accounts(id) ON DELETE CASCADE
);
CREATE INDEX ix_purchase_user_date ON purchases(user_id,created_at);
