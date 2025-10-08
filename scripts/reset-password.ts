import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') }); // Carrega .env.local

import { getPool } from '../lib/db';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const email = 'contato@edsonferreira.com';
  const newPassword = '@Efdg0586';

  const pool = getPool();

  // Gera novo hash da senha
  const passwordHash = bcrypt.hashSync(newPassword, 10);

  // Atualiza a senha
  const { rowCount } = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE email = $2',
    [passwordHash, email]
  );

  if (rowCount === 0) {
    console.log('❌ Usuário não encontrado!');
  } else {
    console.log('✅ Senha resetada com sucesso!');
    console.log('   Email:', email);
    console.log('   Nova senha:', newPassword);
  }

  await pool.end();
}

resetPassword().catch(console.error);
