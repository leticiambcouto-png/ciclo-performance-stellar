CREATE TABLE `calibration_consequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`employeeId` int NOT NULL,
	`cycleId` int,
	`consequence` enum('merito','promocao','desligamento','plano_recuperacao','nenhuma') NOT NULL DEFAULT 'nenhuma',
	`notes` text,
	`decidedBy` int,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibration_consequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibration_scope` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`employeeId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibration_scope_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `calibration_consequences` ADD CONSTRAINT `calibration_consequences_roomId_calibration_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `calibration_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_consequences` ADD CONSTRAINT `calibration_consequences_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_consequences` ADD CONSTRAINT `calibration_consequences_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_consequences` ADD CONSTRAINT `calibration_consequences_decidedBy_users_id_fk` FOREIGN KEY (`decidedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_scope` ADD CONSTRAINT `calibration_scope_roomId_calibration_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `calibration_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_scope` ADD CONSTRAINT `calibration_scope_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;