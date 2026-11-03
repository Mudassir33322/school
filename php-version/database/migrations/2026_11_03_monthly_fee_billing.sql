-- Execute exactly once for an existing CampusOS PHP preview database.
-- Back up MySQL first. Fresh installations should import database/schema.sql instead.
-- Requires all earlier transport/inventory and payroll migrations if upgrading an old preview.
CREATE TABLE IF NOT EXISTS fee_plans (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 branch_id BIGINT UNSIGNED NOT NULL,
 class_id BIGINT UNSIGNED NOT NULL,
 monthly_tuition DECIMAL(12,2) NOT NULL,
 created_by BIGINT UNSIGNED NOT NULL,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY unique_fee_plan_class (school_id,branch_id,class_id),
 FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY (branch_id) REFERENCES branches(id),
 FOREIGN KEY (class_id) REFERENCES classes(id),
 FOREIGN KEY (created_by) REFERENCES users(id),
 CONSTRAINT chk_monthly_tuition CHECK (monthly_tuition >= 0)
) ENGINE=InnoDB;

ALTER TABLE fee_invoices
 ADD COLUMN billing_month CHAR(7) DEFAULT NULL AFTER due_date,
 ADD COLUMN source ENUM('manual','monthly') NOT NULL DEFAULT 'manual' AFTER billing_month,
 ADD COLUMN fee_plan_id BIGINT UNSIGNED DEFAULT NULL AFTER source,
 ADD UNIQUE KEY unique_student_billing_month (school_id,student_user_id,billing_month),
 ADD CONSTRAINT fk_monthly_invoice_plan FOREIGN KEY (fee_plan_id) REFERENCES fee_plans(id);

CREATE TABLE IF NOT EXISTS fee_invoice_items (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 invoice_id BIGINT UNSIGNED NOT NULL,
 item_type ENUM('tuition','transport') NOT NULL,
 description VARCHAR(190) NOT NULL,
 amount DECIMAL(12,2) NOT NULL,
 route_id BIGINT UNSIGNED DEFAULT NULL,
 UNIQUE KEY unique_invoice_item_type (invoice_id,item_type),
 INDEX idx_fee_item_route (route_id),
 FOREIGN KEY(school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY(invoice_id) REFERENCES fee_invoices(id),
 CONSTRAINT chk_fee_item_nonnegative CHECK (amount >= 0)
) ENGINE=InnoDB;
