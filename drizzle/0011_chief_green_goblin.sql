CREATE TABLE `pdi_blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pdiId` int NOT NULL,
	`blockType` enum('valor_stellar','competencia_tecnica') NOT NULL,
	`competencia` varchar(255) NOT NULL,
	`iaAcoes70` text,
	`iaAcoes20` text,
	`iaAcoes10` text,
	`acoes70` text,
	`acoes70Justificativa` text,
	`acoes20` text,
	`acoes10` text,
	`preenchidoPeloColaborador` boolean NOT NULL DEFAULT false,
	`validadoPeloLider` boolean NOT NULL DEFAULT false,
	`liderComentario` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdi_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pdis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`leaderId` int NOT NULL,
	`valorStellar` varchar(100),
	`valorEmpate` boolean NOT NULL DEFAULT false,
	`valorEmpateJustificativa` text,
	`competenciaTecnica` text,
	`iaCompetenciaSugestao` text,
	`status` enum('draft','leader_defined','employee_filling','leader_validating','completed') NOT NULL DEFAULT 'draft',
	`liderObservacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `pdis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `pdi_blocks` ADD CONSTRAINT `pdi_blocks_pdiId_pdis_id_fk` FOREIGN KEY (`pdiId`) REFERENCES `pdis`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pdis` ADD CONSTRAINT `pdis_cycleId_evaluation_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `evaluation_cycles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pdis` ADD CONSTRAINT `pdis_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pdis` ADD CONSTRAINT `pdis_leaderId_employees_id_fk` FOREIGN KEY (`leaderId`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;