CREATE TABLE IF NOT EXISTS `holidays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`academic_year` text NOT NULL,
	`autumn_start` text,
	`autumn_end` text,
	`winter_start` text,
	`winter_end` text,
	`spring_start` text,
	`spring_end` text,
	`summer_start` text,
	`summer_end` text
);
