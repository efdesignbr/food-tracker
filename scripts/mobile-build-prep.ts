import fs from 'fs';
import path from 'path';

const APP_DIR = path.join(process.cwd(), 'app');
const API_DIR = path.join(APP_DIR, 'api');
const BACKUP_DIR = path.join(APP_DIR, '_api_hidden');

const action = process.argv[2]; // 'hide' or 'restore'

const AUTH_LAYOUT_PATH = path.join(process.cwd(), 'components/AuthenticatedLayout.tsx');
const MOBILE_LAYOUT_PATH = path.join(process.cwd(), 'components/AuthenticatedLayout.mobile.tsx');
const AUTH_LAYOUT_BACKUP = path.join(process.cwd(), 'components/AuthenticatedLayout.tsx.bak');

if (action === 'hide') {
  // 1. Hide API Folder
  if (fs.existsSync(API_DIR)) {
    console.log('📦 Escondendo pasta API para build mobile...');
    fs.renameSync(API_DIR, BACKUP_DIR);
  } else {
    console.log('⚠️ Pasta API não encontrada (já escondida?)');
  }

  // 2. Swap AuthenticatedLayout
  if (fs.existsSync(AUTH_LAYOUT_PATH)) {
    console.log('📱 Trocando AuthenticatedLayout para versão Mobile...');
    fs.copyFileSync(AUTH_LAYOUT_PATH, AUTH_LAYOUT_BACKUP); // Backup original
    fs.copyFileSync(MOBILE_LAYOUT_PATH, AUTH_LAYOUT_PATH); // Overwrite with mobile
  }

} else if (action === 'restore') {
  // 1. Restore API Folder
  if (fs.existsSync(BACKUP_DIR)) {
    console.log('🔙 Restaurando pasta API...');
    fs.renameSync(BACKUP_DIR, API_DIR);
  } else {
    if (!fs.existsSync(API_DIR)) {
      console.error('❌ ERRO CRÍTICO: Pasta API backup não encontrada!');
    } else {
       console.log('✅ Pasta API já está no lugar.');
    }
  }

  // 2. Restore AuthenticatedLayout
  if (fs.existsSync(AUTH_LAYOUT_BACKUP)) {
    console.log('🔙 Restaurando AuthenticatedLayout original...');
    fs.copyFileSync(AUTH_LAYOUT_BACKUP, AUTH_LAYOUT_PATH);
    fs.unlinkSync(AUTH_LAYOUT_BACKUP); // Delete backup
  }
}
