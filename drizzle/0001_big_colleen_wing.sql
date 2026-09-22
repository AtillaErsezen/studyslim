CREATE TABLE `ai_matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`tutor_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`university_id` integer NOT NULL,
	`match_score` real NOT NULL,
	`preferences` text,
	`reasoning` text,
	`is_viewed` integer DEFAULT false,
	`is_bookmarked` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `availability_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tutor_id` integer NOT NULL,
	`day_of_week` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`timezone` text DEFAULT 'Europe/Amsterdam' NOT NULL,
	`is_recurring` integer DEFAULT true,
	`specific_date` text,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `booking_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_id` integer NOT NULL,
	`event_type` text NOT NULL,
	`event_data` text,
	`triggered_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`triggered_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` text NOT NULL,
	`tutor_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`session_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`duration` integer NOT NULL,
	`hourly_rate` real NOT NULL,
	`total_amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_intent_id` text,
	`session_notes` text,
	`qr_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`department` text NOT NULL,
	`university_id` integer,
	`description` text,
	`tags` text,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uploader_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`is_public` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`uploader_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	`booking_id` integer,
	`content` text NOT NULL,
	`message_type` text DEFAULT 'text' NOT NULL,
	`file_url` text,
	`is_read` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`is_read` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tutor_id` integer NOT NULL,
	`booking_id` integer NOT NULL,
	`amount` real NOT NULL,
	`platform_fee` real NOT NULL,
	`net_amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`stripe_transfer_id` text,
	`processed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_id` integer NOT NULL,
	`student_id` text NOT NULL,
	`tutor_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`is_public` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tutor_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tutor_id` integer NOT NULL,
	`course_id` integer NOT NULL,
	`experience_level` text DEFAULT 'beginner' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tutors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`image` text,
	`university_id` integer NOT NULL,
	`bio` text NOT NULL,
	`hourly_rate` real NOT NULL,
	`languages` text NOT NULL,
	`course_tags` text NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`rating_avg` real DEFAULT 0 NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`total_earnings` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `universities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`city` text DEFAULT 'Amsterdam' NOT NULL,
	`country` text DEFAULT 'Netherlands' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_account`("id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at") SELECT "id", "account_id", "provider_id", "user_id", "access_token", "refresh_token", "id_token", "access_token_expires_at", "refresh_token_expires_at", "scope", "password", "created_at", "updated_at" FROM `account`;--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `__new_account` RENAME TO `account`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_session`("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id") SELECT "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "email_verified" TO "email_verified" integer DEFAULT false;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "email_verified" TO "email_verified" integer;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "created_at" TO "created_at" text NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "updated_at" TO "updated_at" text NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `password` text DEFAULT '123456' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `image` text;--> statement-breakpoint
ALTER TABLE `user` ADD `is_active` integer DEFAULT true;