CREATE TABLE `parent_verification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`week_start` text NOT NULL,
	`parent_id` text NOT NULL,
	`verified_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `parent_verification_studentId_idx` ON `parent_verification` (`student_id`);--> statement-breakpoint
CREATE INDEX `parent_verification_weekStart_idx` ON `parent_verification` (`week_start`);--> statement-breakpoint
CREATE INDEX `parent_verification_unique_idx` ON `parent_verification` (`student_id`,`week_start`);--> statement-breakpoint
ALTER TABLE `user` ADD `group_id` integer REFERENCES groups(id);