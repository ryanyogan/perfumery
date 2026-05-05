CREATE TABLE `briefs` (
	`ref` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tagline` text NOT NULL,
	`application` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL
);
