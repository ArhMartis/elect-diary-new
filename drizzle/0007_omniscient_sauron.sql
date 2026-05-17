PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`avatar` text,
	`role` text DEFAULT 'student',
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer,
	`group_id` integer
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "email_verified", "image", "created_at", "updated_at", "avatar", "role", "banned", "ban_reason", "ban_expires", "group_id") SELECT "id", "name", "email", "email_verified", "image", "created_at", "updated_at", "avatar", "role", "banned", "ban_reason", "ban_expires", "group_id" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `__new_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`teacher_id` text NOT NULL,
	`lesson_date` text,
	`day_of_week` integer,
	`lesson_number` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_schedule`("id", "group_id", "subject_id", "teacher_id", "lesson_date", "day_of_week", "lesson_number") SELECT "id", "group_id", "subject_id", "teacher_id", "lesson_date", "day_of_week", "lesson_number" FROM `schedule`;--> statement-breakpoint
DROP TABLE `schedule`;--> statement-breakpoint
ALTER TABLE `__new_schedule` RENAME TO `schedule`;