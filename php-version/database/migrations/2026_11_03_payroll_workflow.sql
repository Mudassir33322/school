-- Apply ONCE when upgrading a deployed older CampusOS PHP preview.
-- BACK UP YOUR DATABASE FIRST. Fresh installations must use database/schema.sql instead.
-- Existing 'paid' payroll rows are preserved as paid, without fabricated approval details.
-- Existing 'unpaid' payroll rows are migrated to editable drafts.
ALTER TABLE payroll_entries
  ADD COLUMN branch_id BIGINT UNSIGNED DEFAULT NULL AFTER school_id,
  MODIFY COLUMN status ENUM('unpaid','draft','approved','paid') NOT NULL DEFAULT 'draft',
  ADD COLUMN notes VARCHAR(255) NOT NULL DEFAULT '' AFTER status,
  ADD COLUMN created_by BIGINT UNSIGNED DEFAULT NULL AFTER notes,
  ADD COLUMN approved_by BIGINT UNSIGNED DEFAULT NULL AFTER created_by,
  ADD COLUMN approved_at DATETIME DEFAULT NULL AFTER approved_by,
  ADD COLUMN paid_by BIGINT UNSIGNED DEFAULT NULL AFTER approved_at,
  ADD COLUMN paid_at DATETIME DEFAULT NULL AFTER paid_by,
  ADD COLUMN payment_mode ENUM('cash','bank','cheque','manual_transfer') DEFAULT NULL AFTER paid_at,
  ADD COLUMN payment_reference VARCHAR(100) DEFAULT NULL AFTER payment_mode,
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER payment_reference,
  ADD INDEX idx_payroll_school_branch_status (school_id,branch_id,status),
  ADD CONSTRAINT fk_payroll_branch_v2 FOREIGN KEY (branch_id) REFERENCES branches(id),
  ADD CONSTRAINT fk_payroll_creator_v2 FOREIGN KEY (created_by) REFERENCES users(id),
  ADD CONSTRAINT fk_payroll_approver_v2 FOREIGN KEY (approved_by) REFERENCES users(id),
  ADD CONSTRAINT fk_payroll_payer_v2 FOREIGN KEY (paid_by) REFERENCES users(id);
UPDATE payroll_entries p INNER JOIN users u
  ON u.school_id=p.school_id AND u.id=p.employee_user_id
  SET p.branch_id=u.branch_id WHERE p.branch_id IS NULL;
UPDATE payroll_entries SET status='draft' WHERE status='unpaid';
ALTER TABLE payroll_entries
  MODIFY COLUMN status ENUM('draft','approved','paid') NOT NULL DEFAULT 'draft',
  ADD CONSTRAINT chk_payroll_nonnegative CHECK (basic>=0 AND allowance>=0 AND deduction>=0),
  ADD CONSTRAINT chk_payroll_net CHECK (basic+allowance-deduction>0);
CREATE TABLE IF NOT EXISTS payroll_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 payroll_id BIGINT UNSIGNED NOT NULL,
 event_type ENUM('created','approved','paid') NOT NULL,
 actor_user_id BIGINT UNSIGNED NOT NULL,
 note VARCHAR(255) NOT NULL DEFAULT '',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_payroll_events (school_id,payroll_id,created_at),
 FOREIGN KEY(school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY(payroll_id) REFERENCES payroll_entries(id),
 FOREIGN KEY(actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
