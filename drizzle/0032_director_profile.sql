CREATE TABLE IF NOT EXISTS `director_profile` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `full_name` text NOT NULL DEFAULT '',
  `phone` text DEFAULT '',
  `workdays_hours` text DEFAULT 'Пн–Пт: 8:00 – 17:00',
  `weekend_hours` text DEFAULT 'Сб–Вс: выходной',
  `reception_hours` text DEFAULT 'Вт: 14:00 – 16:00',
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
