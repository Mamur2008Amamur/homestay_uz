CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`checkIn` timestamp NOT NULL,
	`checkOut` timestamp NOT NULL,
	`guests` int NOT NULL DEFAULT 1,
	`totalPrice` int NOT NULL,
	`status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`city` varchar(120) NOT NULL,
	`region` varchar(120) NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`pricePerNight` int NOT NULL,
	`rating` int NOT NULL DEFAULT 5,
	`reviewCount` int NOT NULL DEFAULT 0,
	`guestCount` int NOT NULL DEFAULT 2,
	`homeType` varchar(80) NOT NULL DEFAULT 'Mehmon uyi',
	`hostName` varchar(120) NOT NULL,
	`hostAvatar` text,
	`amenities` text,
	`featured` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlists_userId_listingId_unique` UNIQUE(`userId`,`listingId`)
);
