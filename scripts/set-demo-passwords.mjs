/**
 * Script: set bcrypt passwords for demo users
 * Run: node scripts/set-demo-passwords.mjs
 * 
 * Passwords:
 *   rh@estrelabet.com          → Stellar@2026
 *   gestor@estrelabet.com      → Stellar@2026
 *   colaborador@estrelabet.com → Stellar@2026
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

try {
  console.log("🔐 Setting passwords for demo users...\n");

  const DEFAULT_PASSWORD = "Stellar@2026";
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log(`  Hash gerado para "${DEFAULT_PASSWORD}"`);

  const demoEmails = [
    "rh@estrelabet.com",
    "gestor@estrelabet.com",
    "colaborador@estrelabet.com",
  ];

  for (const email of demoEmails) {
    const [result] = await conn.execute(
      "UPDATE employees SET accessPassword = ? WHERE email = ?",
      [hash, email]
    );
    if (result.affectedRows > 0) {
      console.log(`  ✓ Senha definida para: ${email}`);
    } else {
      console.log(`  ⚠ Usuário não encontrado: ${email}`);
    }
  }

  console.log("\n✅ Senhas configuradas com sucesso!");
  console.log("\nCredenciais de acesso:");
  console.log("  📧 rh@estrelabet.com          → Stellar@2026");
  console.log("  📧 gestor@estrelabet.com       → Stellar@2026");
  console.log("  📧 colaborador@estrelabet.com  → Stellar@2026");

} catch (err) {
  console.error("❌ Erro:", err);
  process.exit(1);
} finally {
  await conn.end();
}
