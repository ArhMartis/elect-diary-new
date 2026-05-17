CREATE TABLE `teacher_subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` text NOT NULL,
	`subject_id` integer NOT NULL,
	`assigned_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
