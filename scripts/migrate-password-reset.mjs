import mysql from "mysql2/promise";

const sql = `
CREATE TABLE IF NOT EXISTS \`password_reset_tokens\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`employeeId\` int NOT NULL,
  \`token\` varchar(128) NOT NULL,
  \`expiresAt\` timestamp NOT NULL,
  \`usedAt\` timestamp,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`password_reset_tokens_id\` PRIMARY KEY(\`id\`),
  CONSTRAINT \`password_reset_tokens_token_unique\` UNIQUE(\`token\`)
);
`;

const fkSql = `
ALTER TABLE \`password_reset_tokens\` 
ADD CONSTRAINT IF NOT EXISTS \`password_reset_tokens_employeeId_employees_id_fk\` 
FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`) ON DELETE no action ON UPDATE no action;
`;

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await conn.execute(sql);
    console.log("✅ password_reset_tokens table created");
    try {
      await conn.execute(fkSql);
      console.log("✅ Foreign key added");
    } catch (e) {
      if (e.code === "ER_DUP_KEYNAME" || e.message?.includes("Duplicate key")) {
        console.log("ℹ️ Foreign key already exists, skipping");
      } else {
        console.warn("⚠️ FK warning:", e.message);
      }
    }
  } finally {
    await conn.end();
  }
}

run().catch(console.error);
