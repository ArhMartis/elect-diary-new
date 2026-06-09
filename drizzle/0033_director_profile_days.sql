DROP TABLE IF EXISTS `director_profile`;
CREATE TABLE `director_profile` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `full_name` text NOT NULL DEFAULT '',
  `phone` text DEFAULT '',
  `mon_hours` text DEFAULT '8:00 – 17:00',
  `tue_hours` text DEFAULT '8:00 – 17:00',
  `wed_hours` text DEFAULT '8:00 – 17:00',
  `thu_hours` text DEFAULT '8:00 – 17:00',
  `fri_hours` text DEFAULT '8:00 – 17:00',
  `sat_hours` text DEFAULT 'выходной',
  `sun_hours` text DEFAULT 'выходной',
  `reception_hours` text DEFAULT 'Вт: 14:00 – 16:00',
  `updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
