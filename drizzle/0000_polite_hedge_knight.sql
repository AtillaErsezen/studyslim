CREATE TABLE `account` (
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
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
-- Missing tables from schema

-- user table
CREATE TABLE `user` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `email` text NOT NULL UNIQUE,
  `role` text NOT NULL DEFAULT 'student',
  `name` text NOT NULL,
  `image` text,
  `password` text NOT NULL DEFAULT '123456',
  `is_active` integer DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint

-- Universities table
CREATE TABLE `universities` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `short_name` text NOT NULL,
  `city` text NOT NULL DEFAULT 'Amsterdam',
  `country` text NOT NULL DEFAULT 'Netherlands',
  `is_active` integer DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint

-- Courses table
CREATE TABLE `courses` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `code` text NOT NULL,
  `department` text NOT NULL,
  `university_id` integer,
  `description` text,
  `tags` text,
  `is_active` integer DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`)
);
--> statement-breakpoint

-- Tutors table
CREATE TABLE `tutors` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer,
  `university_id` integer,
  `bio` text,
  `hourly_rate` real NOT NULL,
  `languages` text,
  `course_tags` text,
  `verified` integer DEFAULT 0,
  `is_available` integer DEFAULT 1,
  `rating_avg` real DEFAULT 0,
  `review_count` integer DEFAULT 0,
  `total_earnings` real DEFAULT 0,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`)
);
--> statement-breakpoint

-- Tutor-course junction table
CREATE TABLE `tutor_courses` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tutor_id` integer,
  `course_id` integer,
  `experience_level` text NOT NULL DEFAULT 'beginner',
  `created_at` text NOT NULL,
  FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`)
);
--> statement-breakpoint

-- Availability slots
CREATE TABLE `availability_slots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tutor_id` integer,
  `day_of_week` integer NOT NULL,
  `start_time` text NOT NULL,
  `end_time` text NOT NULL,
  `timezone` text NOT NULL DEFAULT 'Europe/Amsterdam',
  `is_recurring` integer DEFAULT 1,
  `specific_date` text,
  `is_active` integer DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`)
);
--> statement-breakpoint

-- Bookings
CREATE TABLE `bookings` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `student_id` integer,
  `tutor_id` integer,
  `course_id` integer,
  `session_date` text NOT NULL,
  `start_time` text NOT NULL,
  `end_time` text NOT NULL,
  `duration` integer NOT NULL,
  `hourly_rate` real NOT NULL,
  `total_amount` real NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `payment_intent_id` text,
  `session_notes` text,
  `qr_code` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`)
);
--> statement-breakpoint

-- Booking events
CREATE TABLE `booking_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `booking_id` integer,
  `event_type` text NOT NULL,
  `event_data` text,
  `triggered_by` integer,
  `created_at` text NOT NULL,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`),
  FOREIGN KEY (`triggered_by`) REFERENCES `user`(`id`)
);
--> statement-breakpoint

-- Payouts
CREATE TABLE `payouts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `tutor_id` integer,
  `booking_id` integer,
  `amount` real NOT NULL,
  `platform_fee` real NOT NULL,
  `net_amount` real NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `stripe_transfer_id` text,
  `processed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`),
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`)
);
--> statement-breakpoint

-- Reviews
CREATE TABLE `reviews` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `booking_id` integer,
  `student_id` integer,
  --`tutor_id` integer,
  `rating` integer NOT NULL,
  `comment` text,
  `is_public` integer DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`),
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`)
);
--> statement-breakpoint

-- Messages
CREATE TABLE `messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `sender_id` integer,
  `receiver_id` integer,
  `booking_id` integer,
  `content` text NOT NULL,
  `message_type` text NOT NULL DEFAULT 'text',
  `file_url` text,
  `is_read` integer DEFAULT 0,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`receiver_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`)
);
--> statement-breakpoint

-- Files
CREATE TABLE `files` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `uploader_id` integer,
  `file_name` text NOT NULL,
  `file_url` text NOT NULL,
  `file_type` text NOT NULL,
  `mime_type` text NOT NULL,
  `file_size` integer NOT NULL,
  `is_public` integer DEFAULT 0,
  `created_at` text NOT NULL,
  FOREIGN KEY (`uploader_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint

-- Notifications
CREATE TABLE `notifications` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer,
  `type` text NOT NULL,
  `title` text NOT NULL,
  `message` text NOT NULL,
  `data` text,
  `is_read` integer DEFAULT 0,
  `created_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
--> statement-breakpoint

-- AI Matches
CREATE TABLE `ai_matches` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `student_id` integer,
  `tutor_id` integer,
  `course_id` integer,
  `university_id` integer,
  `match_score` real NOT NULL,
  `preferences` text,
  `reasoning` text,
  `is_viewed` integer DEFAULT 0,
  `is_bookmarked` integer DEFAULT 0,
  `created_at` text NOT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`),
  FOREIGN KEY (`tutor_id`) REFERENCES `tutors`(`id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`),
  FOREIGN KEY (`university_id`) REFERENCES `universities`(`id`)
);
