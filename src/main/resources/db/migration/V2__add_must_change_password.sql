-- Adds must_change_password flag to employees. New users (and the seeded
-- admin) will be forced to set a new password on first login.
-- Kept for reference; Hibernate (ddl-auto=update) will create it automatically.

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 1;

-- Mark every existing user to force a password change once.
UPDATE employees SET must_change_password = 1;
