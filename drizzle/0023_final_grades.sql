CREATE TABLE IF NOT EXISTS `final_grades` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `student_id` text NOT NULL,
  `subject_id` integer NOT NULL,
  `academic_year` text NOT NULL,
  `q1` text,
  `q2` text,
  `q3` text,
  `q4` text,
  `year` text,
  `exam` text,
  `final` text,
  `grade_type` text DEFAULT 'numeric',
  `updated_at` integer,
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `final_grades_unique_idx` ON `final_grades` (`student_id`, `subject_id`, `academic_year`);
