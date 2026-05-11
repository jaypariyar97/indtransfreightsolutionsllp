-- Stores single-use password reset tokens. Hibernate (ddl-auto=update) will
-- create this automatically on first boot; this file is for teams that
-- enable Flyway later.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id           VARCHAR(64)   NOT NULL,
    employee_id  VARCHAR(64)   NOT NULL,
    token        VARCHAR(64)   NOT NULL,
    expires_at   DATETIME(6)   NOT NULL,
    used         TINYINT(1)    NOT NULL DEFAULT 0,
    created_at   DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_prt_token (token)
);
