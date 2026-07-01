<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (\PDOException $e) {
    die(json_encode(["error" => "BDD: " . $e->getMessage()]));
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents('php://input'), true);
$admin_pass = $data['pass'] ?? '';

switch ($action) {

    // 1. LISTE CLIENTS (Uniquement actifs avec descriptions d'options)
    case 'get_all_events':
        try {
            $stmt = $pdo->query("SELECT * FROM events WHERE is_active = 1 ORDER BY date_event ASC");
            $events = $stmt->fetchAll();
            foreach ($events as &$ev) {
                // On récupère id, label, description et prix
                $s = $pdo->prepare("SELECT id, label, description, prix FROM event_options WHERE event_id = ?");
                $s->execute([$ev['id']]);
                $ev['options'] = $s->fetchAll();
                $ev['date'] = date('d M Y', strtotime($ev['date_event']));
            }
            echo json_encode($events);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    // 2. LISTE ADMIN (Tous les events)
    case 'get_admin_events':
        if ($admin_pass !== ADMIN_PASSWORD) { echo json_encode(["error" => "Auth"]); exit; }
        $stmt = $pdo->query("SELECT id, titre, date_event, is_active FROM events ORDER BY date_event DESC");
        $res = $stmt->fetchAll();
        foreach($res as &$r) { $r['date'] = date('d/m/Y', strtotime($r['date_event'])); }
        echo json_encode($res);
        break;

    // 3. MISE À JOUR D'UN EVENT
    case 'update_event':
        if ($admin_pass !== ADMIN_PASSWORD) { http_response_code(403); exit; }
        try {
            $pdo->beginTransaction();
            // 1. Mise à jour des infos de base
            $stmt = $pdo->prepare("UPDATE events SET titre = ?, description = ?, date_event = ?, lieu = ? WHERE id = ?");
            $stmt->execute([
                $data['titre'],
                $data['description'],
                $data['date'],
                $data['lieu'],
                $data['id']
            ]);

            // 2. Mise à jour des options (Suppression et ré-insertion avec description)
            $pdo->prepare("DELETE FROM event_options WHERE event_id = ?")->execute([$data['id']]);
            $stmtOpt = $pdo->prepare("INSERT INTO event_options (event_id, label, description, prix) VALUES (?, ?, ?, ?)");
            foreach ($data['options'] as $opt) {
                $stmtOpt->execute([
                    $data['id'], 
                    $opt['label'], 
                    $opt['description'] ?? '', 
                    $opt['prix']
                ]);
            }

            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;
        
    // 4. DETAILS D'UN EVENT (Participants et Stats)
   case 'get_admin_list':
        if ($admin_pass !== ADMIN_PASSWORD) { echo json_encode(["error" => "Auth"]); exit; }
        $eventId = (int)($_GET['event_id'] ?? 0);
        
        try {
            // Liste des participants avec noms d'options ET quantités
            $stmt = $pdo->prepare("
                SELECT 
                    r.client_nom, 
                    r.client_email, 
                    r.total_amount, 
                    r.created_at,
                    GROUP_CONCAT(CONCAT(eo.label, ' (x', ro.quantite, ')') SEPARATOR ', ') as options_choisies
                FROM registrations r
                LEFT JOIN registration_options ro ON r.id = ro.registration_id
                LEFT JOIN event_options eo ON ro.option_id = eo.id
                WHERE r.event_id = ? AND r.payment_status = 'paid'
                GROUP BY r.id
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$eventId]);
            $participants = $stmt->fetchAll();

            // Stats des options (Somme réelle des quantités vendues)
            $stmtStats = $pdo->prepare("
                SELECT eo.label, SUM(IFNULL(ro.quantite, 0)) as nb 
                FROM event_options eo
                LEFT JOIN registration_options ro ON eo.id = ro.option_id
                LEFT JOIN registrations r ON ro.registration_id = r.id AND r.payment_status = 'paid'
                WHERE eo.event_id = ?
                GROUP BY eo.id
            ");
            $stmtStats->execute([$eventId]);
            $stats = $stmtStats->fetchAll();

            echo json_encode([
                "participants" => $participants ? $participants : [],
                "stats_options" => $stats ? $stats : []
            ]);
        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage(), "participants" => [], "stats_options" => []]);
        }
        break;

    // 5. CRÉATION D'UN EVENT
    case 'create_event':
        if ($admin_pass !== ADMIN_PASSWORD) { echo json_encode(["error" => "Auth"]); exit; }
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO events (titre, description, date_event, lieu, is_active) VALUES (?, ?, ?, ?, 1)");
            $stmt->execute([$data['titre'], $data['description'], $data['date'], $data['lieu']]);
            $id = $pdo->lastInsertId();

            $stmtOpt = $pdo->prepare("INSERT INTO event_options (event_id, label, description, prix) VALUES (?, ?, ?, ?)");
            foreach ($data['options'] as $o) {
                $stmtOpt->execute([
                    $id, 
                    $o['label'], 
                    $o['description'] ?? '', 
                    $o['prix']
                ]);
            }
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    // 6. STRIPE CHECKOUT
  case 'create_checkout':
        require_once('stripe-php/init.php');
        \Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);
        
        // Récupération des sélections : [{optionId: 14, quantite: 3}, ...]
        $selections = $data['options'] ?? [];
        $eventId = $data['event_id'] ?? null;

        if (empty($selections)) { 
            echo json_encode(["error" => "Aucune option sélectionnée"]); 
            exit; 
        }

        try {
            $lines = [];
            foreach ($selections as $sel) {
                // On récupère les infos de l'option en BDD
                $stmt = $pdo->prepare("SELECT label, prix FROM event_options WHERE id = ?");
                $stmt->execute([$sel['optionId']]);
                $opt = $stmt->fetch();

                if ($opt) {
                    $lines[] = [
                        'price_data' => [
                            'currency' => 'eur', 
                            'product_data' => ['name' => $opt['label']], 
                            'unit_amount' => round($opt['prix'] * 100)
                        ],
                        'quantity' => (int)$sel['quantite'], // On utilise la quantité du JSON !
                    ];
                }
            }

            if (empty($lines)) { throw new Exception("Erreur de récupération des options."); }

            $session = \Stripe\Checkout\Session::create([
                'payment_method_types' => ['card', 'paypal'],
                'line_items' => $lines,
                'mode' => 'payment',
                // On stocke les sélections en metadata pour les récupérer après le paiement
                'metadata' => [
                    'options_ids' => json_encode($selections),
                    'event_id' => $eventId
                ],
                'success_url' => 'https://'.$_SERVER['HTTP_HOST'].'/webappperso/API/success.php?session_id={CHECKOUT_SESSION_ID}&event_id='.$eventId,
                'cancel_url' => 'https://'.$_SERVER['HTTP_HOST'].'/webappperso/FriendsEvent/',
            ]);

            echo json_encode(['url' => $session->url]);

        } catch (Exception $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'delete_event':
        if ($admin_pass !== ADMIN_PASSWORD) { exit; }
        $pdo->prepare("DELETE FROM event_options WHERE event_id = ?")->execute([$data['id']]);
        $pdo->prepare("DELETE FROM events WHERE id = ?")->execute([$data['id']]);
        echo json_encode(["success" => true]);
        break;

    case 'toggle_event_status':
        if ($admin_pass !== ADMIN_PASSWORD) { exit; }
        $pdo->prepare("UPDATE events SET is_active = NOT is_active WHERE id = ?")->execute([$data['id']]);
        echo json_encode(["success" => true]);
        break;

    default:
        echo json_encode(["error" => "Action inconnue"]);
        break;
}