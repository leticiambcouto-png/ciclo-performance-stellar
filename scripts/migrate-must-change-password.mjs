import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await createConnection(url);

try {
  await conn.execute("ALTER TABLE `employees` ADD `mustChangePassword` boolean DEFAULT true NOT NULL");
  console.log("✓ Column mustChangePassword added to employees table");
} catch (err) {
  if (err.code === "ER_DUP_FIELDNAME") {
    console.log("✓ Column mustChangePassword already exists, skipping");
  } else {
    console.error("Migration failed:", err.message);
    process.exit(1);
  }
}

// Set existing demo users to mustChangePassword = false (they already have real passwords)
await conn.execute("UPDATE `employees` SET `mustChangePassword` = false WHERE `accessPassword` IS NOT NULL");
console.log("✓ Existing users with passwords set to mustChangePassword = false");

await conn.end();
console.log("Migration complete.");
