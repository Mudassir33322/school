-- Apply exactly once when upgrading an EXISTING installation from the previous preview.
-- Back up MySQL first. Fresh installations should use database/schema.sql instead.
-- MySQL 8+ required. Do not import twice: ADD COLUMN is intentionally non-repeatable.
ALTER TABLE transport_routes ADD COLUMN seat_capacity INT UNSIGNED NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS transport_assignments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 branch_id BIGINT UNSIGNED NOT NULL,
 route_id BIGINT UNSIGNED NOT NULL,
 student_user_id BIGINT UNSIGNED NOT NULL,
 assigned_on DATE NOT NULL,
 released_at DATETIME DEFAULT NULL,
 assigned_by BIGINT UNSIGNED NOT NULL,
 released_by BIGINT UNSIGNED DEFAULT NULL,
 active_student_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN released_at IS NULL THEN student_user_id ELSE NULL END) STORED,
 UNIQUE KEY uq_transport_active_student (school_id,active_student_id),
 INDEX idx_transport_route (school_id,route_id,released_at),
 FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY (branch_id) REFERENCES branches(id),
 FOREIGN KEY (route_id) REFERENCES transport_routes(id),
 FOREIGN KEY (student_user_id) REFERENCES users(id),
 FOREIGN KEY (assigned_by) REFERENCES users(id),
 FOREIGN KEY (released_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_movements (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 school_id BIGINT UNSIGNED NOT NULL,
 branch_id BIGINT UNSIGNED NOT NULL,
 item_id BIGINT UNSIGNED NOT NULL,
 movement_type ENUM('opening','receipt','issue') NOT NULL,
 quantity INT UNSIGNED NOT NULL,
 balance_before INT NOT NULL,
 balance_after INT NOT NULL,
 reason VARCHAR(255) NOT NULL,
 performed_by BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_item_history (school_id,item_id,created_at),
 FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
 FOREIGN KEY (branch_id) REFERENCES branches(id),
 FOREIGN KEY (item_id) REFERENCES inventory_items(id),
 FOREIGN KEY (performed_by) REFERENCES users(id),
 CONSTRAINT chk_inventory_positive CHECK (quantity > 0),
 CONSTRAINT chk_inventory_balance CHECK (balance_after >= 0)
) ENGINE=InnoDB;
