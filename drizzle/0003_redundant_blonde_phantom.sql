CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`paymeId` varchar(128),
	`amountTiyin` int NOT NULL,
	`state` enum('created','performed','cancelled_before_perform','cancelled_after_perform') NOT NULL DEFAULT 'created',
	`reason` varchar(128),
	`createTime` bigint,
	`performTime` bigint,
	`cancelTime` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleUz` varchar(255) NOT NULL,
	`titleRu` varchar(255) NOT NULL,
	`titleEn` varchar(255) NOT NULL,
	`city` varchar(120) NOT NULL,
	`region` varchar(120) NOT NULL,
	`homeTypeUz` varchar(80) NOT NULL DEFAULT 'Uy',
	`homeTypeRu` varchar(80) NOT NULL DEFAULT 'Дом',
	`homeTypeEn` varchar(80) NOT NULL DEFAULT 'Home',
	`description` text,
	`descUz` text,
	`descRu` text,
	`descEn` text,
	`imageUrl` text NOT NULL,
	`images` text NOT NULL,
	`amenities` text,
	`pricePerNight` int NOT NULL,
	`pricePerWeek` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL DEFAULT 5,
	`reviewCount` int NOT NULL DEFAULT 0,
	`guestCount` int NOT NULL DEFAULT 2,
	`hostId` int NOT NULL,
	`hostName` varchar(120) NOT NULL,
	`hostAvatar` text,
	`featured` int NOT NULL DEFAULT 0,
	`category` varchar(80) NOT NULL DEFAULT 'historic',
	`source` varchar(30) NOT NULL DEFAULT 'curated',
	`address` text,
	`lat` double(10,6),
	`lng` double(10,6),
	`email` varchar(320),
	`phone1` varchar(40),
	`phone2` varchar(40),
	`telegram` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('pending','paid','cancelled','expired') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','host','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `bookings` ADD `stayId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `totalAmountUzs` int NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `pricePerWeek` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `listingId`;--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `totalPrice`;