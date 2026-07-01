// Upload du contenu de dist/ vers le serveur FTP de prod.
// Les identifiants viennent de .env (jamais commité) — voir .env.example.
import 'dotenv/config';
import { Client } from 'basic-ftp';
import { existsSync } from 'node:fs';

const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR, FTP_SECURE, FTP_CLEAN } = process.env;

for (const [key, val] of Object.entries({ FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR })) {
  if (!val) {
    console.error(`Variable d'environnement manquante: ${key} (voir .env.example)`);
    process.exit(1);
  }
}

if (!existsSync('dist')) {
  console.error("Le dossier dist/ n'existe pas. Lance 'npm run build' avant de déployer.");
  process.exit(1);
}

const client = new Client();
client.ftp.verbose = false;

try {
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure: FTP_SECURE !== 'false', // FTPS par défaut
  });

  console.log(`Upload de dist/ vers ${FTP_REMOTE_DIR} ...`);
  await client.ensureDir(FTP_REMOTE_DIR);
  if (FTP_CLEAN === 'true') {
    // Supprime tout ce qui existe déjà dans FTP_REMOTE_DIR avant l'upload.
    // Opt-in volontaire : à activer seulement si ce dossier ne contient QUE ce build.
    console.log('FTP_CLEAN=true -> nettoyage du dossier distant avant upload...');
    await client.clearWorkingDir();
  }
  await client.uploadFromDir('dist');
  console.log('Déploiement terminé.');
} catch (err) {
  console.error('Echec du déploiement:', err);
  process.exitCode = 1;
} finally {
  client.close();
}
