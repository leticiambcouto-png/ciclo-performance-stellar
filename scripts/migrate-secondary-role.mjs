import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Check if column already exists
  const [rows] = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'employees' 
     AND COLUMN_NAME = 'secondaryPlatformRole'`
  );
  
  if (rows.length > 0) {
    console.log('Column secondaryPlatformRole already exists, skipping.');
  } else {
    await conn.execute(
      `ALTER TABLE \`employees\` ADD \`secondaryPlatformRole\` enum('rh','gestor','colaborador')`
    );
    console.log('✓ Column secondaryPlatformRole added to employees table.');
  }
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
} finally {
  await conn.end();
}
