/**
 * clean-and-seed.mjs
 * Limpa todo o banco de dados e cria apenas o usuário Leticia (RH).
 */
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não encontrada.");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
console.log("✅ Conectado ao banco de dados.");

// ── 1. Desabilitar FK checks para truncar na ordem correta ──────────────────
await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

const tables = [
  "password_reset_tokens",
  "notifications",
  "calibration_consequences",
  "calibration_scope",
  "calibration_participants",
  "calibration_rooms",
  "feedback_reports",
  "flash_feedbacks",
  "ninebox_positions",
  "manager_evaluations",
  "self_evaluations",
  "cycle_phases",
  "evaluation_cycles",
  "employees",
  "users",
];

for (const table of tables) {
  await connection.execute(`TRUNCATE TABLE \`${table}\``);
  console.log(`🗑️  Tabela ${table} limpa.`);
}

await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

// ── 2. Criar usuário Leticia na tabela users ────────────────────────────────
const [userResult] = await connection.execute(
  `INSERT INTO users (openId, name, email, loginMethod, role, platformRole, createdAt, updatedAt, lastSignedIn)
   VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
  [
    "leticia-couto-rh-stellar",
    "Leticia Couto",
    "leticia.couto@estrelabet.com",
    "password",
    "user",
    "rh",
  ]
);
const userId = userResult.insertId;
console.log(`✅ Usuário criado na tabela users (id=${userId}).`);

// ── 3. Criar employee vinculado ao usuário ──────────────────────────────────
const passwordHash = await bcrypt.hash("Stellar@2026", 12);

await connection.execute(
  `INSERT INTO employees
     (userId, name, email, accessPassword, platformRole, area, diretoria,
      isActive, mustChangePassword, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())`,
  [
    userId,
    "Leticia Couto",
    "leticia.couto@estrelabet.com",
    passwordHash,
    "rh",
    "RH",
    "Pessoas & Cultura",
  ]
);
console.log("✅ Employee Leticia criado com perfil RH.");

// ── 4. Criar ciclo ativo S1/2026 ────────────────────────────────────────────
const [cycleResult] = await connection.execute(
  `INSERT INTO evaluation_cycles (name, semester, startDate, endDate, status, createdAt)
   VALUES (?, ?, ?, ?, ?, NOW())`,
  ["S1/2026", "S1/26", "2026-01-01 00:00:00", "2026-06-30 23:59:59", "open"]
);
const cycleId = cycleResult.insertId;
console.log(`✅ Ciclo S1/2026 criado (id=${cycleId}).`);

// ── 5. Criar fases do ciclo ─────────────────────────────────────────────────
const phases = [
  { num: 1, titulo: "Autoavaliação",       descricao: "Colaboradores e gestores realizam a autoavaliação",                    start: "2026-07-01", end: "2026-07-15", continuous: false },
  { num: 2, titulo: "Avaliação do Gestor", descricao: "Gestores avaliam seus reports diretos",                                start: "2026-07-16", end: "2026-07-31", continuous: false },
  { num: 3, titulo: "Calibração",          descricao: "Comitê de calibração do RH",                                           start: "2026-08-01", end: "2026-08-15", continuous: false },
  { num: 4, titulo: "Devolutiva",          descricao: "Gestores entregam a devolutiva aos colaboradores",                     start: "2026-08-16", end: "2026-08-31", continuous: false },
  { num: 5, titulo: "PDI",                 descricao: "Plano de Desenvolvimento Individual",                                  start: "2026-09-01", end: "2026-09-30", continuous: false },
  { num: 6, titulo: "Reconhecimento",      descricao: "Execução das consequências definidas na calibração",                   start: "2026-10-01", end: "2026-10-31", continuous: false },
  { num: 7, titulo: "Flash Feedbacks",     descricao: "Conversas contínuas de desenvolvimento ao longo do semestre",         start: "2026-01-01", end: "2026-06-30", continuous: true  },
];

for (const phase of phases) {
  await connection.execute(
    `INSERT INTO cycle_phases (cycleId, phaseNumber, titulo, descricao, startDate, endDate, isContinuous, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [cycleId, phase.num, phase.titulo, phase.descricao, `${phase.start} 00:00:00`, `${phase.end} 23:59:59`, phase.continuous ? 1 : 0]
  );
}
console.log("✅ 7 fases do ciclo criadas.");

await connection.end();
console.log("\n🎉 Banco limpo e pronto!");
console.log("   Usuário: leticia.couto@estrelabet.com");
console.log("   Senha:   Stellar@2026");
console.log("   Perfil:  RH");
