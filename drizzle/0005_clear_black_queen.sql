CREATE TABLE `diary_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`week_start` text NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `diary_notes_studentId_idx` ON `diary_notes` (`student_id`);--> statement-breakpoint
CREATE INDEX `diary_notes_weekStart_idx` ON `diary_notes` (`week_start`);--> statement-breakpoint
CREATE TABLE `diary_verification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`week_start` text NOT NULL,
	`teacher_id` text NOT NULL,
	`verified_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `diary_verification_studentId_idx` ON `diary_verification` (`student_id`);--> statement-breakpoint
CREATE INDEX `diary_verification_weekStart_idx` ON `diary_verification` (`week_start`);--> statement-breakpoint
CREATE INDEX `diary_verification_unique_idx` ON `diary_verification` (`student_id`,`week_start`);