// Upload du backend PHP (api_friends_event.php, success.php, config.php) vers le
// dossier API du serveur. Utilise le même FTP restreint à webappperso/ que deploy.mjs.
// NE gère PAS le dossier vendor stripe-php : à déposer une fois manuellement
// s'il n'est pas déjà présent côté serveur.
import 'dotenv/config';
import { Client } from 'basic-ftp';
import { existsSync } from 'node:fs';

const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_SECURE, FTP_REMOTE_DIR_API } = process.env;
const remoteDir = FTP_REMOTE_DIR_API || '/API';

for (const [key, val] of Object.entries({ FTP_HOST, FTP_USER, FTP_PASSWORD })) {
  if (!val) {
    console.error(`Variable d'environnement manquante: ${key} (voir .env.example)`);
    process.exit(1);
  }
}

const files = ['src/api_friends_event.php', 'src/success.php', 'src/config.php'];
for (const f of files) {
  if (!existsSync(f)) {
    console.error(`Fichier introuvable: ${f}`);
    process.exit(1);
  }
}

const client = new Client();
client.ftp.verbose = false;

try {
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure: FTP_SECURE !== 'false',
  });

  console.log(`Upload du backend PHP vers ${remoteDir} ...`);
  await client.ensureDir(remoteDir);
  for (const f of files) {
    await client.uploadFrom(f, f.split('/').pop());
  }
  console.log('Backend déployé. Vérifie que stripe-php/ est bien présent côté serveur (non géré par ce script).');
} catch (err) {
  console.error('Echec du déploiement API:', err);
  process.exitCode = 1;
} finally {
  client.close();
}
