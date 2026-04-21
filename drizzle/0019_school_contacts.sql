CREATE TABLE IF NOT EXISTS `school_contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_name` text NOT NULL,
	`school_address` text,
	`school_phone` text,
	`director` text,
	`vice_principal` text,
	`vice_principal_edu` text,
	`homeroom_teacher` text,
	`psychologist` text,
	`social_pedagogue` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
);
