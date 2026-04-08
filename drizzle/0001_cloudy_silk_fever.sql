CREATE TABLE `calibration_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`managerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calibration_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calibration_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`scheduledAt` timestamp,
	`status` enum('draft','active','completed') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calibration_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`jobTitle` varchar(255),
	`department` varchar(255),
	`managerId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`semester` varchar(10) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`status` enum('draft','open','closed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluation_cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`managerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`evaluationId` int,
	`aiFeedbackContent` text,
	`aiActionPlan` text,
	`finalContent` text,
	`finalActionPlan` text,
	`sentAt` timestamp,
	`viewedAt` timestamp,
	`status` enum('draft','sent','viewed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flash_feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`requesterId` int NOT NULL,
	`receiverId` int NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`agenda` text,
	`status` enum('scheduled','completed','overdue','cancelled') NOT NULL DEFAULT 'scheduled',
	`formalizedAt` timestamp,
	`feedbackContent` text,
	`actionPlan` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flash_feedbacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manager_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`managerId` int NOT NULL,
	`employeeId` int NOT NULL,
	`ambicao` enum('below','within','above'),
	`ambicaoComment` text,
	`sonharGrande` enum('below','within','above'),
	`sonharGrandeComment` text,
	`accountability` enum('below','within','above'),
	`accountabilityComment` text,
	`juntosSomosMaisFortes` enum('below','within','above'),
	`juntosSomosMaisfortesComment` text,
	`qualidade` enum('below','within','above'),
	`qualidadeComment` text,
	`contribuicao` enum('below','within','above'),
	`contribuicaoComment` text,
	`adaptacao` enum('below','within','above'),
	`adaptacaoComment` text,
	`usoDeIA` enum('below','within','above'),
	`usoDeIAComment` text,
	`potencialAxis` enum('low','medium','high'),
	`performanceAxis` enum('low','medium','high'),
	`nineboxQuadrant` varchar(5),
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manager_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ninebox_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`employeeId` int NOT NULL,
	`quadrant` varchar(5) NOT NULL,
	`potencialAxis` enum('low','medium','high') NOT NULL,
	`performanceAxis` enum('low','medium','high') NOT NULL,
	`isManuallyAdjusted` boolean NOT NULL DEFAULT false,
	`adjustedBy` int,
	`adjustmentNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ninebox_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('flash_feedback_scheduled','flash_feedback_due_soon','flash_feedback_overdue','evaluation_available','report_sent') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedId` int,
	`relatedType` varchar(50),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `self_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int,
	`employeeId` int NOT NULL,
	`ambicao` enum('below','within','above'),
	`ambicaoComment` text,
	`sonharGrande` enum('below','within','above'),
	`sonharGrandeComment` text,
	`accountability` enum('below','within','above'),
	`accountabilityComment` text,
	`juntosSomosMaisFortes` enum('below','within','above'),
	`juntosSomosMaisfortesComment` text,
	`qualidade` enum('below','within','above'),
	`qualidadeComment` text,
	`contribuicao` enum('below','within','above'),
	`contribuicaoComment` text,
	`adaptacao` enum('below','within','above'),
	`adaptacaoComment` text,
	`usoDeIA` enum('below','within','above'),
	`usoDeIAComment` text,
	`potencialAxis` enum('low','medium','high'),
	`performanceAxis` enum('low','medium','high'),
	`nineboxQuadrant` varchar(5),
	`status` enum('draft','submitted') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `self_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `platformRole` enum('rh','gestor','colaborador') DEFAULT 'colaborador' NOT NULL;--> statement-breakpoint
ALTER TABLE `calibration_participants` ADD CONSTRAINT `calibration_participants_roomId_calibration_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `calibration_rooms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_participants` ADD CONSTRAINT `calibration_participants_managerId_employees_id_fk` FOREIGN KEY (`managerId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_rooms` ADD CONSTRAINT `calibration_rooms_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calibration_rooms` ADD CONSTRAINT `calibration_rooms_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_reports` ADD CONSTRAINT `feedback_reports_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_reports` ADD CONSTRAINT `feedback_reports_managerId_employees_id_fk` FOREIGN KEY (`managerId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_reports` ADD CONSTRAINT `feedback_reports_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `feedback_reports` ADD CONSTRAINT `feedback_reports_evaluationId_manager_evaluations_id_fk` FOREIGN KEY (`evaluationId`) REFERENCES `manager_evaluations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flash_feedbacks` ADD CONSTRAINT `flash_feedbacks_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flash_feedbacks` ADD CONSTRAINT `flash_feedbacks_requesterId_employees_id_fk` FOREIGN KEY (`requesterId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flash_feedbacks` ADD CONSTRAINT `flash_feedbacks_receiverId_employees_id_fk` FOREIGN KEY (`receiverId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manager_evaluations` ADD CONSTRAINT `manager_evaluations_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manager_evaluations` ADD CONSTRAINT `manager_evaluations_managerId_employees_id_fk` FOREIGN KEY (`managerId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manager_evaluations` ADD CONSTRAINT `manager_evaluations_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ninebox_positions` ADD CONSTRAINT `ninebox_positions_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ninebox_positions` ADD CONSTRAINT `ninebox_positions_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ninebox_positions` ADD CONSTRAINT `ninebox_positions_adjustedBy_users_id_fk` FOREIGN KEY (`adjustedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `self_evaluations` ADD CONSTRAINT `self_evaluations_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `self_evaluations` ADD CONSTRAINT `self_evaluations_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;