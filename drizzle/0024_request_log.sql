CREATE TABLE IF NOT EXISTS `request_log` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `user_id` text,
  `method` text NOT NULL,
  `path` text NOT NULL,
  `status_code` integer,
  `user_agent` text,
  `ip_address` text,
  `created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);

CREATE INDEX IF NOT EXISTS `request_log_user_id_idx` ON `request_log` (`user_id`);
CREATE INDEX IF NOT EXISTS `request_log_created_at_idx` ON `request_log` (`created_at`);