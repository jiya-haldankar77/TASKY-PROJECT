ALTER TABLE `user`
  ADD COLUMN `password_reset_token_hash` CHAR(64) NULL,
  ADD COLUMN `password_reset_expires_at` DATETIME NULL;
