import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    base: './',
    plugins: [
      react(),
      VitePWA({
        // On NE désactive PLUS le plugin, sinon pas de bouton d'install
        disable: false, 
        
        // On choisit 'null' en dev pour éviter que le Service Worker ne tente de s'enregistrer
        // car c'est lui qui fait planter StackBlitz.
        injectRegister: isDev ? null : 'script', 
        
        registerType: 'autoUpdate',
        
        devOptions: {
          enabled: true, // On l'active pour que le manifest soit généré en mode dev
          type: 'module'
        },
        
        manifest: {
          id: "/webappperso/FriendsEvent/index.html",
          name: "Friends Event Booking",
          short_name: "FriendsEvent",
          description: "Application de réservation pour événements entre amis",
          start_url: "index.html",
          display: "standalone",
          background_color: "#111827",
          theme_color: "#111827",
          lang: "fr",
          scope: "./",
          icons: [
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable" // Très important pour Android
          }
        ],
        screenshots: [
          {
            src: "screenshot-mobile.png",
            sizes: "1080x1920",
            type: "image/png",
            form_factor: "narrow",
            label: "Application Friends Event sur Mobile"
          },
          {
            src: "screenshot-desktop.png",
            sizes: "1920x1080",
            type: "image/png",
            form_factor: "wide",
            label: "Application Friends Event sur Ordinateur"
          }
        ]
        }
      })
    ],
    server: {
      watch: {
        ignored: ['**/dist/**']
      }
    }
  };
});