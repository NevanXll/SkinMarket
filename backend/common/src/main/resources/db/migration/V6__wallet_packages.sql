CREATE TABLE wallet_packages (
 id VARCHAR(32) PRIMARY KEY,
 credits DECIMAL(12,2) NOT NULL,
 price_usd DECIMAL(12,2) NOT NULL,
 CONSTRAINT ck_wallet_credits CHECK (credits > 0),
 CONSTRAINT ck_wallet_price CHECK (price_usd BETWEEN 0.01 AND 100000)
);

INSERT INTO wallet_packages (id, credits, price_usd) VALUES
 ('pack-500', 500.00, 500.00),
 ('pack-1000', 1000.00, 1000.00),
 ('pack-2500', 2500.00, 2500.00),
 ('pack-5000', 5000.00, 5000.00);

CREATE TABLE wallet_top_ups (
 id VARCHAR(64) PRIMARY KEY,
 user_id VARCHAR(64) NOT NULL,
 request_key VARCHAR(80) NOT NULL,
 package_id VARCHAR(32) NOT NULL,
 CONSTRAINT uq_wallet_request UNIQUE (user_id, request_key),
 CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
 CONSTRAINT fk_wallet_package FOREIGN KEY (package_id) REFERENCES wallet_packages(id)
);
