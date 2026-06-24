Pour transformer ton application React en une application installable sur smartphone (sans passer par l'App Store ou le Play Store),
la solution standard est d'en faire une PWA (Progressive Web App).

Cela permettra à tes amis de voir une bannière "Ajouter à l'écran d'accueil" et l'app s'ouvrira sans la barre d'adresse du navigateur, comme une application native.

1. Créer le fichier manifest.json
   C'est la carte d'identité de ton application. Crée ce fichier dans ton dossier public/ :

JSON
{
"short_name": "FriendsEvent",
"name": "Friends Event Booking",
"icons": [
{
"src": "favicon.ico",
"sizes": "64x64 32x32 24x24 16x16",
"type": "image/x-icon"
},
{
"src": "logo192.png",
"type": "image/png",
"sizes": "192x192"
},
{
"src": "logo512.png",
"type": "image/png",
"sizes": "512x512"
}
],
"start_url": ".",
"display": "standalone",
"theme_color": "#111827",
"background_color": "#111827"
}

2. Référencer le Manifest dans index.html
   Dans ton fichier index.html (également dans public/ ou à la racine selon ta config Vite), ajoute cette ligne dans le <head> :

<link rel="manifest" href="/FriendsEvent/manifest.json">
<meta name="theme-color" content="#111827">

Gemini a dit
Pour transformer ton application React en une application installable sur smartphone (sans passer par l'App Store ou le Play Store), la solution standard est d'en faire une PWA (Progressive Web App).

Cela permettra à tes amis de voir une bannière "Ajouter à l'écran d'accueil" et l'app s'ouvrira sans la barre d'adresse du navigateur, comme une application native.

1. Créer le fichier manifest.json
   C'est la carte d'identité de ton application. Crée ce fichier dans ton dossier public/ :

JSON
{
"short_name": "FriendsEvent",
"name": "Friends Event Booking",
"icons": [
{
"src": "favicon.ico",
"sizes": "64x64 32x32 24x24 16x16",
"type": "image/x-icon"
},
{
"src": "logo192.png",
"type": "image/png",
"sizes": "192x192"
},
{
"src": "logo512.png",
"type": "image/png",
"sizes": "512x512"
}
],
"start_url": ".",
"display": "standalone",
"theme_color": "#111827",
"background_color": "#111827"
}
Note : Le mode standalone est ce qui retire la barre d'adresse du navigateur pour donner l'aspect "App".

2. Référencer le Manifest dans index.html
   Dans ton fichier index.html (également dans public/ ou à la racine selon ta config Vite), ajoute cette ligne dans le <head> :

HTML

<link rel="manifest" href="/FriendsEvent/manifest.json">
<meta name="theme-color" content="#111827">

3. Ajouter un Service Worker (Optionnel mais recommandé)
   Pour être "installable" sur Chrome/Android, l'app doit techniquement pouvoir fonctionner (ou au moins afficher une page) hors ligne. Vite possède un plugin génial pour ça : Vite PWA Plugin.

Installe le plugin :

Bash
npm add -D vite-plugin-pwa

Configure vite.config.ts :

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
plugins: [
react(),
VitePWA({
registerType: 'autoUpdate',
manifest: {
// ... (recopie ici la configuration du manifest.json ci-dessus)
}
})
]
});

4. Comment l'installer sur le smartphone ?
   Une fois que tu as déployé ton build sur ton serveur FTP :

Sur Android (Chrome) : Une bannière "Ajouter à l'écran d'accueil" apparaîtra souvent automatiquement. Sinon, clique sur les 3 petits points en haut à droite > Installer l'application.

Sur iPhone (Safari) : Clique sur l'icône Partager (le carré avec une flèche vers le haut) > fais défiler vers le bas > Sur l'écran d'accueil.

⚠️ Les conditions impératives
Pour que l'installation soit proposée par le smartphone :

HTTPS obligatoire : Ton site seme-et-tisse.fr doit être sécurisé (c'est déjà ton cas).

Manifest valide : Il faut au moins une icône de 192x192px et une de 512x512px.
Place les deux fichiers (logo192.png et logo512.png) dans le dossier public/ de ton projet Vite.

Service Worker : Il doit être enregistré (le plugin Vite s'en occupe pour toi).


------------------------------
bonton install sur mobile
------------------------------

2. Comment ajouter le bouton "Installer" à Friends Event
Puisque tu veux le même comportement, voici le code à ajouter dans ton App.tsx. Ce code capture l'invitation d'installation et l'affiche sur un bouton.

Étape A : Ajoute cet état dans ton composant App :

const [installPrompt, setInstallPrompt] = useState<any>(null);

useEffect(() => {
  const handler = (e: any) => {
    e.preventDefault();
    setInstallPrompt(e); // L'app est installable, on stocke l'événement
  };
  window.addEventListener('beforeinstallprompt', handler);
  return () => window.removeEventListener('beforeinstallprompt', handler);
}, []);



Étape B : Ajoute la fonction de clic :

TypeScript
const handleInstallClick = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  if (outcome === 'accepted') {
    setInstallPrompt(null);
  }
};
Étape C : Affiche le bouton dans ton JSX (Header) :

TypeScript
{installPrompt && (
  <button 
    onClick={handleInstallClick}
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
  >
    <Download size={20} />
    Installer l'app
  </button>
)}
---

npm run build

---
