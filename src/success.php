<?php
// 1. RECHERCHE DYNAMIQUE DU CHEMIN STRIPE
$stripe_init = __DIR__ . '/../API/stripe-php/init.php';
if (!file_exists($stripe_init)) {
    $stripe_init = '../stripe-php/init.php';
}

if (file_exists($stripe_init)) {
    require_once($stripe_init);
} else {
    die("Erreur critique : Le dossier stripe-php est introuvable.");
}

// 2. CONFIGURATION STRIPE & BDD
require_once __DIR__ . '/config.php';
\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

$host = DB_HOST;
$db   = DB_NAME;
$user = DB_USER;
$pass = DB_PASS;

$customer_name = "Ami";
$session_id = $_GET['session_id'] ?? null;
$event_id = $_GET['event_id'] ?? null; 

if ($session_id) {
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);

        // Rï¿½cupï¿½ration de la session Stripe
        $session = \Stripe\Checkout\Session::retrieve($session_id);
        
        if ($session->payment_status === 'paid') {
            $customer_name = $session->customer_details->name ?? "Ami";
            $customer_email = $session->customer_details->email;
            $total_amount = $session->amount_total / 100;

            // Dï¿½BUT DE LA TRANSACTION BDD
            $pdo->beginTransaction();

            // A. On vï¿½rifie si cette session n'a pas dï¿½jï¿½ ï¿½tï¿½ enregistrï¿½e (prï¿½vention doublons)
            $check = $pdo->prepare("SELECT id FROM registrations WHERE stripe_session_id = ?");
            $check->execute([$session_id]);
            
            if (!$check->fetch()) {
                // B. Insertion dans 'registrations'
                $stmt = $pdo->prepare("INSERT INTO registrations (event_id, client_nom, client_email, total_amount, stripe_session_id, payment_status, created_at) VALUES (?, ?, ?, ?, ?, 'paid', NOW())");
                $stmt->execute([$event_id, $customer_name, $customer_email, $total_amount, $session_id]);
                $registration_id = $pdo->lastInsertId();

                // C. Insertion des options dï¿½taillï¿½es (CORRECTION POUR LE FORMAT OBJET)
                if (isset($session->metadata->options_ids)) {
                    $selections = json_decode($session->metadata->options_ids, true);
                    
                    if (is_array($selections)) {
                        // On prï¿½pare la requï¿½te avec la colonne quantite
                        $stmtOpt = $pdo->prepare("INSERT INTO registration_options (registration_id, option_id, quantite) VALUES (?, ?, ?)");
                        
                        foreach ($selections as $sel) {
                            // On extrait l'ID et la quantitï¿½ de l'objet
                            $opt_id = $sel['optionId'];
                            $qty = $sel['quantite'];
                            
                            $stmtOpt->execute([$registration_id, $opt_id, $qty]);
                        }
                    }
                }
            }
            
            $pdo->commit();
        }

    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paiement Rï¿½ussi</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <style>
        :root {
            --bg: #0f172a;
            --card: #1e293b;
            --text: #f8fafc;
            --muted: #94a3b8;
            --cyan: #22d3ee;
            --indigo: #6366f1;
        }
        body {
            margin: 0;
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Inter', system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        .success-container {
            text-align: center;
            padding: 40px;
            background: var(--card);
            border-radius: 32px;
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .check-icon {
            font-size: 80px;
            color: var(--cyan);
            margin-bottom: 20px;
            display: inline-block;
            animation: scaleIn 0.5s 0.2s both cubic-bezier(0.16, 1, 0.3, 1);
        }
        h1 { font-size: 2rem; margin: 0 0 10px 0; font-weight: 800; }
        p { color: var(--muted); line-height: 1.6; margin-bottom: 35px; font-size: 1.05rem; }
        strong { color: white; }
        
        .home-button {
            display: block;
            background: var(--indigo);
            color: white;
            text-decoration: none;
            padding: 18px;
            border-radius: 20px;
            font-weight: 700;
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
            transition: all 0.2s;
        }
        .home-button:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .home-button:active { transform: translateY(0); }

        @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="success-container">
        <div class="check-icon">
            <i class="ph-fill ph-check-circle"></i>
        </div>
        <h1>C'est validé !</h1>
        <p>
            Merci <strong><?php echo htmlspecialchars($customer_name); ?></strong>, ta participation a bien été enregistrée. On se voit trés vite !
        </p>
        
        <a href="https://seme-et-tisse.fr/webappperso/FriendsEvent/" class="home-button">
            Retour à l'accueil
        </a>
    </div>
</body>
</html>