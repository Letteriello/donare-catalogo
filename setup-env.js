/**
 * Script para configurar automaticamente as variáveis de ambiente
 * Execute com: node setup-env.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Valores das variáveis de ambiente
const envVars = {
  // API Tokens
  VITE_OLIST_API_TOKEN: '15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53',
  VITE_TINY_INTEGRATOR_ID: '8471',
  VITE_TINY_API_TOKEN: '15e1c07a36aef142a17114caf354c42ad3daeb673bedb496d34357ad486fad53',
  
  // Firebase Config
  VITE_FIREBASE_API_KEY: 'AIzaSyAJ9cw5uNQGFd4VH13cD_WgxE1PLaC4DdM',
  VITE_FIREBASE_AUTH_DOMAIN: 'donare-catalogo.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'donare-catalogo',
  VITE_FIREBASE_STORAGE_BUCKET: 'donare-catalogo.appspot.com',
  VITE_FIREBASE_MSG_SENDER_ID: '12091397107',
  VITE_FIREBASE_APP_ID: '1:12091397107:web:c19ef6fe250cdb6778f886',
  VITE_FIREBASE_MEASUREMENT_ID: 'G-15BG5CH1VW',
  
  // API Config
  VITE_API_MODE: 'embedded',
  VITE_OLIST_BASE_URL: 'https://api.olist.com',
  VITE_OLIST_API_VERSION: 'v3'
};

// Gerar conteúdo do arquivo .env
const envContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Caminho para o arquivo .env
const envPath = path.join(__dirname, '.env');

// Escrever no arquivo
fs.writeFileSync(envPath, envContent);

console.log('✅ Arquivo .env criado com sucesso!');
console.log(`📁 Local: ${envPath}`);
console.log('🔒 As variáveis de ambiente foram configuradas para desenvolvimento local.');
