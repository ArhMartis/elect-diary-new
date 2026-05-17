CREATE TABLE `diary_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`surname` text,
	`name` text,
	`grade` text,
	`homeroom_teacher` text,
	`homeroom_teacher_phone` text,
	`subjects` text,
	`electives` text,
	`bell_schedule` text,
	`months` text,
	`grades` text,
	`decision_text` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `diary_data_studentId_idx` ON `diary_data` (`student_id`);--> statement-breakpoint
CREATE TABLE `diary_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`academic_year` text,
	`school_name` text,
	`school_address` text,
	`director` text,
	`director_phone` text,
	`vice_principal` text,
	`vice_principal_phone` text,
	`vice_principal_edu` text,
	`vice_principal_edu_phone` text,
	`psychologist` text,
	`psychologist_phone` text,
	`social_pedagogue` text,
	`social_pedagogue_phone` text,
	`holidays_autumn` text,
	`holidays_winter` text,
	`holidays_spring` text,
	`holidays_summer` text,
	`updated_at` integer NOT NULL
);
