-- Optional migration to add receipt_path column to billing table.
-- With spring.jpa.hibernate.ddl-auto=update Hibernate will create this
-- column automatically on startup. This file is kept for reference and
-- can be enabled by setting spring.flyway.enabled=true.

ALTER TABLE billing
    ADD COLUMN IF NOT EXISTS receipt_path VARCHAR(255) NULL;
