import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const conn = await createConnection(url);

const sqls = [
  `CREATE TABLE IF NOT EXISTS \`pdis\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`cycleId\` int NOT NULL,
    \`employeeId\` int NOT NULL,
    \`leaderId\` int NOT NULL,
    \`valorStellar\` varchar(100),
    \`valorEmpate\` boolean NOT NULL DEFAULT false,
    \`valorEmpateJustificativa\` text,
    \`competenciaTecnica\` text,
    \`iaCompetenciaSugestao\` text,
    \`status\` enum('draft','leader_defined','employee_filling','leader_validating','completed') NOT NULL DEFAULT 'draft',
    \`liderObservacoes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    \`completedAt\` timestamp,
    CONSTRAINT \`pdis_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`pdi_blocks\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`pdiId\` int NOT NULL,
    \`blockType\` enum('valor_stellar','competencia_tecnica') NOT NULL,
    \`competencia\` varchar(255) NOT NULL,
    \`iaAcoes70\` text,
    \`iaAcoes20\` text,
    \`iaAcoes10\` text,
    \`acoes70\` text,
    \`acoes70Justificativa\` text,
    \`acoes20\` text,
    \`acoes10\` text,
    \`preenchidoPeloColaborador\` boolean NOT NULL DEFAULT false,
    \`validadoPeloLider\` boolean NOT NULL DEFAULT false,
    \`liderComentario\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`pdi_blocks_id\` PRIMARY KEY(\`id\`)
  )`,
  `ALTER TABLE \`pdis\` ADD CONSTRAINT \`pdis_cycleId_evaluation_cycles_id_fk\` FOREIGN KEY (\`cycleId\`) REFERENCES \`evaluation_cycles\`(\`id\`) ON DELETE no action ON UPDATE no action`,
  `ALTER TABLE \`pdis\` ADD CONSTRAINT \`pdis_employeeId_employees_id_fk\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`) ON DELETE no action ON UPDATE no action`,
  `ALTER TABLE \`pdis\` ADD CONSTRAINT \`pdis_leaderId_employees_id_fk\` FOREIGN KEY (\`leaderId\`) REFERENCES \`employees\`(\`id\`) ON DELETE no action ON UPDATE no action`,
  `ALTER TABLE \`pdi_blocks\` ADD CONSTRAINT \`pdi_blocks_pdiId_pdis_id_fk\` FOREIGN KEY (\`pdiId\`) REFERENCES \`pdis\`(\`id\`) ON DELETE no action ON UPDATE no action`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log('OK:', sql.slice(0, 60).replace(/\n/g, ' '));
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME' || err.message.includes('Duplicate')) {
      console.log('SKIP (already exists):', sql.slice(0, 60).replace(/\n/g, ' '));
    } else {
      console.error('ERROR:', err.message);
    }
  }
}

await conn.end();
console.log('Migration complete!');
