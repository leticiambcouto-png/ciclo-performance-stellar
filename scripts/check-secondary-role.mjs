import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("DESCRIBE employees");
const col = rows.find((r) => r.Field === "secondary_platform_role");
if (col) {
  console.log("✅ Column secondary_platform_role EXISTS:", JSON.stringify(col));
} else {
  console.log("❌ Column secondary_platform_role NOT FOUND");
  console.log("Available columns:", rows.map((r) => r.Field).join(", "));
}
await conn.end();
