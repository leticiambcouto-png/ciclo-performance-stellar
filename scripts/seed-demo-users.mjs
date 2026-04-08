/**
 * Seed script: creates demo users for Stellar Gaming Performance Cycle
 * Run: node scripts/seed-demo-users.mjs
 */
import mysql from "mysql2/promise";
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
  console.log("🌱 Seeding demo users...\n");

  // ── 1. Insert users ──────────────────────────────────────────────────────────
  const demoUsers = [
    {
      openId: "demo-rh-001",
      name: "Ana Rodrigues",
      email: "rh@estrelabet.com",
      loginMethod: "demo",
      role: "admin",
      platformRole: "rh",
    },
    {
      openId: "demo-gestor-001",
      name: "Carlos Mendes",
      email: "gestor@estrelabet.com",
      loginMethod: "demo",
      role: "user",
      platformRole: "gestor",
    },
    {
      openId: "demo-colaborador-001",
      name: "Letícia Couto",
      email: "colaborador@estrelabet.com",
      loginMethod: "demo",
      role: "user",
      platformRole: "colaborador",
    },
  ];

  const userIds = {};

  for (const u of demoUsers) {
    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE openId = ? OR email = ? LIMIT 1",
      [u.openId, u.email]
    );

    if (existing.length > 0) {
      // Update existing user
      await conn.execute(
        `UPDATE users SET name=?, email=?, loginMethod=?, role=?, platformRole=?, lastSignedIn=NOW() WHERE openId=? OR email=?`,
        [u.name, u.email, u.loginMethod, u.role, u.platformRole, u.openId, u.email]
      );
      userIds[u.platformRole] = existing[0].id;
      console.log(`  ✓ Updated user: ${u.email} (id=${existing[0].id})`);
    } else {
      const [result] = await conn.execute(
        `INSERT INTO users (openId, name, email, loginMethod, role, platformRole, lastSignedIn, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [u.openId, u.name, u.email, u.loginMethod, u.role, u.platformRole]
      );
      userIds[u.platformRole] = result.insertId;
      console.log(`  ✓ Created user: ${u.email} (id=${result.insertId})`);
    }
  }

  // ── 2. Insert employees ──────────────────────────────────────────────────────
  const demoEmployees = [
    {
      userId: userIds["rh"],
      name: "Ana Rodrigues",
      email: "rh@estrelabet.com",
      jobTitle: "Analista de RH",
      department: "Recursos Humanos",
      managerId: null,
      platformRole: "rh",
    },
    {
      userId: userIds["gestor"],
      name: "Carlos Mendes",
      email: "gestor@estrelabet.com",
      jobTitle: "Gerente de Produto",
      department: "Produto",
      managerId: null, // will be updated after insert
      platformRole: "gestor",
    },
    {
      userId: userIds["colaborador"],
      name: "Letícia Couto",
      email: "colaborador@estrelabet.com",
      jobTitle: "Analista de Marketing",
      department: "Marketing",
      managerId: null, // will be set to Carlos's employee id
      platformRole: "colaborador",
    },
  ];

  const employeeIds = {};

  for (const e of demoEmployees) {
    const [existing] = await conn.execute(
      "SELECT id FROM employees WHERE email = ? LIMIT 1",
      [e.email]
    );

    if (existing.length > 0) {
      await conn.execute(
        `UPDATE employees SET userId=?, name=?, jobTitle=?, department=?, platformRole=?, isActive=1 WHERE email=?`,
        [e.userId, e.name, e.jobTitle, e.department, e.platformRole, e.email]
      );
      employeeIds[e.platformRole] = existing[0].id;
      console.log(`  ✓ Updated employee: ${e.email} (id=${existing[0].id})`);
    } else {
      const [result] = await conn.execute(
        `INSERT INTO employees (userId, name, email, jobTitle, department, managerId, platformRole, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [e.userId, e.name, e.email, e.jobTitle, e.department, e.managerId, e.platformRole]
      );
      employeeIds[e.platformRole] = result.insertId;
      console.log(`  ✓ Created employee: ${e.email} (id=${result.insertId})`);
    }
  }

  // ── 3. Set Letícia's manager to Carlos ────────────────────────────────────────
  if (employeeIds["gestor"] && employeeIds["colaborador"]) {
    await conn.execute(
      "UPDATE employees SET managerId=? WHERE id=?",
      [employeeIds["gestor"], employeeIds["colaborador"]]
    );
    console.log(`\n  ✓ Letícia vinculada ao gestor Carlos (managerId=${employeeIds["gestor"]})`);
  }

  // ── 4. Check for active cycle ────────────────────────────────────────────────
  const [cycles] = await conn.execute(
    "SELECT id FROM evaluation_cycles WHERE status='open' LIMIT 1"
  );
  const cycleId = cycles.length > 0 ? cycles[0].id : null;

  if (cycleId && employeeIds["colaborador"]) {
    // Check if ninebox position already exists for Letícia
    const [existingPos] = await conn.execute(
      "SELECT id FROM ninebox_positions WHERE employeeId=? AND cycleId=? LIMIT 1",
      [employeeIds["colaborador"], cycleId]
    );
    if (existingPos.length === 0) {
      await conn.execute(
        `INSERT INTO ninebox_positions (cycleId, employeeId, quadrant, potencialAxis, performanceAxis, isManuallyAdjusted, createdAt, updatedAt)
         VALUES (?, ?, 'Q5', 'medium', 'medium', 0, NOW(), NOW())`,
        [cycleId, employeeIds["colaborador"]]
      );
      console.log(`  ✓ Posição demo no 9-Box criada para Letícia (Q5 - Mantenedor)`);
    }
  }

  console.log("\n✅ Seed concluído com sucesso!\n");
  console.log("Usuários criados:");
  console.log("  📧 rh@estrelabet.com          → Perfil: RH (Ana Rodrigues)");
  console.log("  📧 gestor@estrelabet.com       → Perfil: Gestor (Carlos Mendes)");
  console.log("  📧 colaborador@estrelabet.com  → Perfil: Colaborador (Letícia Couto)");
  console.log("\nNota: Para fazer login com esses usuários, use o OAuth Manus com os emails acima.");

} catch (err) {
  console.error("❌ Erro durante o seed:", err);
  process.exit(1);
} finally {
  await conn.end();
}
