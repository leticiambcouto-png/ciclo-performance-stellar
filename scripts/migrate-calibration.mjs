import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const sqls = [
  `CREATE TABLE IF NOT EXISTS \`calibration_scope\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`roomId\` int NOT NULL,
    \`employeeId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`calibration_scope_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`calibration_scope_roomId_fk\` FOREIGN KEY (\`roomId\`) REFERENCES \`calibration_rooms\`(\`id\`),
    CONSTRAINT \`calibration_scope_employeeId_fk\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`calibration_consequences\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`roomId\` int NOT NULL,
    \`employeeId\` int NOT NULL,
    \`cycleId\` int,
    \`consequence\` enum('merito','promocao','desligamento','plano_recuperacao','nenhuma') NOT NULL DEFAULT 'nenhuma',
    \`notes\` text,
    \`decidedBy\` int,
    \`decidedAt\` timestamp,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`calibration_consequences_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`calibration_consequences_roomId_fk\` FOREIGN KEY (\`roomId\`) REFERENCES \`calibration_rooms\`(\`id\`),
    CONSTRAINT \`calibration_consequences_employeeId_fk\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`)
  )`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log("✓ SQL executed successfully");
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("⚠ Table already exists, skipping");
    } else {
      console.error("✗ Error:", e.message);
    }
  }
}

await conn.end();
console.log("Migration complete.");
