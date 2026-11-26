CREATE TABLE IF NOT EXISTS `buyer_enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_id` text NOT NULL,
	`request_id` text NOT NULL,
	`property_id` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`buyer_id`) REFERENCES `buyer_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `buyer_enquiries_request` ON `buyer_enquiries` (`buyer_id`,`request_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `buyer_enquiries_user` ON `buyer_enquiries` (`buyer_id`,`created`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `buyer_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `buyer_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `buyer_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `buyer_sessions_user` ON `buyer_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `buyer_state` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `buyer_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `buyer_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `buyer_users_email_unique` ON `buyer_users` (`email`);