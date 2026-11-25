ALTER TABLE products
 ADD COLUMN seller_id VARCHAR(64),
 ADD COLUMN source_order_id VARCHAR(64),
 ADD COLUMN source_product_id VARCHAR(64),
 ADD COLUMN acquired_quantity INT NOT NULL DEFAULT 0,
 ADD COLUMN sold_units INT NOT NULL DEFAULT 0,
 ADD CONSTRAINT uq_seller_lot UNIQUE (source_order_id, source_product_id),
 ADD CONSTRAINT ck_listing_stock CHECK (seller_id IS NULL OR (sold_units >= 0 AND stock + sold_units <= acquired_quantity)),
 ADD CONSTRAINT fk_listing_seller FOREIGN KEY (seller_id) REFERENCES accounts(id),
 ADD CONSTRAINT fk_listing_source FOREIGN KEY (source_order_id) REFERENCES purchases(id);

CREATE TABLE seller_sales (
 id VARCHAR(64) PRIMARY KEY,
 seller_id VARCHAR(64) NOT NULL,
 purchase_id VARCHAR(64) NOT NULL,
 product_id VARCHAR(64) NOT NULL,
 product_name VARCHAR(100) NOT NULL,
 quantity INT NOT NULL,
 unit_price DECIMAL(19,2) NOT NULL,
 created_at TIMESTAMP(6) NOT NULL,
 CONSTRAINT fk_sale_seller FOREIGN KEY (seller_id) REFERENCES accounts(id),
 CONSTRAINT fk_sale_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id),
 CONSTRAINT fk_sale_product FOREIGN KEY (product_id) REFERENCES products(id),
 CONSTRAINT uq_sale_item UNIQUE (purchase_id, product_id)
);
CREATE INDEX ix_seller_sales_date ON seller_sales(seller_id, created_at);
