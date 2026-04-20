CREATE TABLE `impact_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`feedbackId` int NOT NULL,
	`valorDesenvolver` varchar(255),
	`valorAcoes` text,
	`competenciaTecnica` text,
	`comoDesenvolver` text,
	`prazoDias` int,
	`resultadoEsperado` text,
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `impact_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `structured_feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`leaderId` int NOT NULL,
	`employeeId` int NOT NULL,
	`entregasRelevantes` text,
	`metaAtingidaAuto` boolean,
	`abaixoEsperado` text,
	`valorConsistente` varchar(255),
	`valorConsistenteDesc` text,
	`valorEvoluir` varchar(255),
	`valorEvoluirComportamento` text,
	`proximoCicloDiferente` text,
	`proximoCicloExpectativa` text,
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `structured_feedbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `impact_plans` ADD CONSTRAINT `impact_plans_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `impact_plans` ADD CONSTRAINT `impact_plans_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `impact_plans` ADD CONSTRAINT `impact_plans_feedbackId_structured_feedbacks_id_fk` FOREIGN KEY (`feedbackId`) REFERENCES `structured_feedbacks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `structured_feedbacks` ADD CONSTRAINT `structured_feedbacks_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `structured_feedbacks` ADD CONSTRAINT `structured_feedbacks_leaderId_employees_id_fk` FOREIGN KEY (`leaderId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `structured_feedbacks` ADD CONSTRAINT `structured_feedbacks_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;