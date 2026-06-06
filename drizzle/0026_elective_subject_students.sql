-- Удаляем временную таблицу elective_subject_students (если была создана)
DROP TABLE IF EXISTS `elective_subject_students`;

-- Создаём таблицу electives (если не существует)
CREATE TABLE IF NOT EXISTS `electives` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `subject_id` integer REFERENCES `subjects`(`id`) ON DELETE CASCADE,
  `teacher_id` text REFERENCES `user`(`id`) ON DELETE SET NULL,
  `teacher_name` text,
  `schedule` text,
  `group_id` integer REFERENCES `groups`(`id`) ON DELETE SET NULL,
  `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

-- Создаём записи в electives для уже существующих спецпредметов (если их ещё нет)
INSERT OR IGNORE INTO `electives` (`name`, `subject_id`)
SELECT `name`, `id` FROM `subjects` WHERE `type` IN ('elective', 'olympiad');
