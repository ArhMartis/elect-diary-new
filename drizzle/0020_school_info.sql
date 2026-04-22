CREATE TABLE IF NOT EXISTS `school_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
