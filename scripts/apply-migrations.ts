import { config } from 'dotenv';
import { init } from '../lib/init';

config({ path: './.env.local' });

async function main() {
  await init();
  console.log('Migrations and bootstrap applied successfully.');
}

main().catch((e) => {
  console.error('Migration apply failed:', e);
  process.exit(1);
});

