-- Добавление поля created_at в таблицу grades
ALTER TABLE `grades` ADD COLUMN `created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer));

-- Создание индекса для быстрого поиска по дате создания
CREATE INDEX IF NOT EXISTS `grades_created_at_idx` ON `grades` (`created_at`);
