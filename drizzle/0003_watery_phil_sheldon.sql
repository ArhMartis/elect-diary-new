CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`homeroom_teacher_id` text,
	FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
