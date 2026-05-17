ALTER TABLE `grades` ADD `academic_period_id` integer REFERENCES academic_periods(id);--> statement-breakpoint
ALTER TABLE `schedule` ADD `name` text;