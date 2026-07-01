<?php
// Modèle de config.php — à copier en "config.php" (jamais commité, voir .gitignore)
// et à déposer manuellement à côté de api_friends_event.php sur le serveur (/API/).
// Ne jamais remplir ce fichier .example avec de vraies valeurs.

define('DB_HOST', '127.0.0.1');
define('DB_NAME', '');
define('DB_USER', '');
define('DB_PASS', '');

// Chaîne longue et aléatoire, pas un code à 4 chiffres.
define('ADMIN_PASSWORD', '');

// Clé secrète Stripe (sk_test_... ou sk_live_...), jamais la clé publique ici.
define('STRIPE_SECRET_KEY', '');
