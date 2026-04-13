import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [users] = await conn.execute("SELECT id, name, email, platformRole FROM users");
const [employees] = await conn.execute("SELECT id, name, email, platformRole, isActive, mustChangePassword FROM employees");
const [cycles] = await conn.execute("SELECT id, name, semester, status FROM evaluation_cycles");
const [phases] = await conn.execute("SELECT phaseNumber, titulo FROM cycle_phases ORDER BY phaseNumber");

console.log("\n=== USERS ===");
console.table(users);
console.log("\n=== EMPLOYEES ===");
console.table(employees);
console.log("\n=== CYCLES ===");
console.table(cycles);
console.log("\n=== PHASES ===");
console.table(phases);

await conn.end();
