ALTER TABLE accounts DROP CHECK ck_account_role;
ALTER TABLE accounts ADD CONSTRAINT ck_account_role CHECK (role IN ('ADMIN', 'CLIENTE', 'VENDEDOR'));

CREATE TABLE seller_applications (
 user_id VARCHAR(64) PRIMARY KEY,
 skins VARCHAR(500) NOT NULL,
 reason VARCHAR(1000) NOT NULL,
 status VARCHAR(16) NOT NULL,
 submitted_at TIMESTAMP(6) NOT NULL,
 reviewed_at TIMESTAMP(6),
 review_note VARCHAR(500),
 CONSTRAINT fk_seller_applicant FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
 CONSTRAINT ck_seller_application_status CHECK (status IN ('PENDIENTE', 'APROBADA', 'RECHAZADA'))
);
