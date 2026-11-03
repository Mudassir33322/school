-- Apply ONCE to an EXISTING CampusOS PHP preview database.
-- Back up first. Fresh installs use database/schema.sql instead.
-- Does not alter or delete existing payments, invoices or concessions.
CREATE TABLE IF NOT EXISTS fee_refunds (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 invoice_id BIGINT UNSIGNED NOT NULL,
 payment_id BIGINT UNSIGNED NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 mode ENUM('cash','bank','cheque','online_manual') NOT NULL,
 reference VARCHAR(100) DEFAULT NULL,
 reason VARCHAR(255) NOT NULL,
 refunded_by BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_refund_invoice (school_id,invoice_id),
 INDEX idx_refund_payment (school_id,payment_id),
 FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id),
 FOREIGN KEY (payment_id) REFERENCES fee_payments(id),
 FOREIGN KEY (refunded_by) REFERENCES users(id),
 CONSTRAINT chk_refund_amount CHECK (amount > 0)
) ENGINE=InnoDB;
