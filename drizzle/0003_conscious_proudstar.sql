CREATE TABLE `cycle_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`phaseNumber` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isContinuous` boolean NOT NULL DEFAULT false,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cycle_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cycle_phases` ADD CONSTRAINT `cycle_phases_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cycle_phases` ADD CONSTRAINT `cycle_phases_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;