-- Apply once to an EXISTING CampusOS development preview database.
-- Back up the database first. Fresh installations use database/schema.sql instead.
-- This is additive and leaves all original payment/refund/concession history untouched.
CREATE TABLE IF NOT EXISTS fee_installment_plans (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 invoice_id BIGINT UNSIGNED NOT NULL,
 installment_count TINYINT UNSIGNED NOT NULL,
 created_by BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_installment_invoice (school_id,invoice_id),
 FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id),
 FOREIGN KEY (created_by) REFERENCES users(id),
 CONSTRAINT chk_installment_count CHECK (installment_count BETWEEN 2 AND 12)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS fee_installments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 plan_id BIGINT UNSIGNED NOT NULL,
 sequence_no TINYINT UNSIGNED NOT NULL,
 due_date DATE NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 UNIQUE KEY uq_installment_sequence (plan_id,sequence_no),
 INDEX idx_installment_due (school_id,due_date),
 FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY (plan_id) REFERENCES fee_installment_plans(id),
 CONSTRAINT chk_installment_amount CHECK (amount > 0)
) ENGINE=InnoDB;
