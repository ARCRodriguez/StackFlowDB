<?php
// ============================================================
// ZIDKENU — API Backend PHP/MySQL
// Coloca este archivo en el mismo servidor que los .html
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ─── CONFIGURACIÓN DE BASE DE DATOS ───
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'zidkenu_db');
define('DB_USER', 'root');
define('DB_PASS', 'pollindotero');
define('DB_CHARSET', 'utf8mb4');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error de conexión a base de datos: ' . $e->getMessage()]);
            exit();
        }
    }
    return $pdo;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// ─── ROUTER ───
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {

    // ── LOGIN ──
    case 'login':
        if ($method !== 'POST') jsonResponse(['error' => 'Método no permitido'], 405);
        $body = json_decode(file_get_contents('php://input'), true);
        $correo   = trim($body['correo'] ?? '');
        $password = trim($body['password'] ?? '');

        if (!$correo || !$password) {
            jsonResponse(['error' => 'Correo y contraseña son requeridos'], 400);
        }

        $pdo = getDB();
        $stmt = $pdo->prepare("
            SELECT u.id, u.nombre, u.correo, u.password_hash, u.estado, r.nombre AS rol
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.correo = ? AND u.estado = 'activo'
            LIMIT 1
        ");
        $stmt->execute([$correo]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonResponse(['error' => 'Credenciales incorrectas'], 401);
        }

        // NOTA: En producción usar password_verify($password, $user['password_hash'])
        // Para este prototipo comparamos contra contraseñas de prueba hardcodeadas
        $validPasswords = [
            'usuario@zidkenu.com'    => '1234',
            'supervisor@zidkenu.com' => '1234',
            'directivo@zidkenu.com'  => '1234',
            'admin@zidkenu.com'      => 'admin123',
            'lucia@zidkenu.com'      => '1234',
            'contador@zidkenu.com'   => '1234',
        ];

        $passwordOk = false;
        if (isset($validPasswords[$correo])) {
            $passwordOk = ($password === $validPasswords[$correo]);
        } else {
            // En producción: $passwordOk = password_verify($password, $user['password_hash']);
            $passwordOk = password_verify($password, $user['password_hash']);
        }

        if (!$passwordOk) {
            jsonResponse(['error' => 'Credenciales incorrectas'], 401);
        }

        // Actualizar último login
        $pdo->prepare("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?")->execute([$user['id']]);

        // Registrar en log
        $pdo->prepare("
            INSERT INTO log_accesos (usuario_id, modulo_clave, accion, resultado, ip_address)
            VALUES (?, 'sistema', 'login', 'exitoso', ?)
        ")->execute([$user['id'], $_SERVER['REMOTE_ADDR'] ?? '']);

        unset($user['password_hash']);
        jsonResponse(['success' => true, 'user' => $user]);
        break;


    // ── LISTAR USUARIOS (solo admin) ──
    case 'usuarios_listar':
        if ($method !== 'GET') jsonResponse(['error' => 'Método no permitido'], 405);

        $pdo = getDB();
        $stmt = $pdo->query("
            SELECT u.id, u.nombre, u.correo, u.estado, r.nombre AS rol, u.creado_en, u.ultimo_login
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id ASC
        ");
        jsonResponse(['usuarios' => $stmt->fetchAll()]);
        break;


    // ── CREAR USUARIO (solo admin) ──
    case 'usuarios_crear':
        if ($method !== 'POST') jsonResponse(['error' => 'Método no permitido'], 405);
        $body = json_decode(file_get_contents('php://input'), true);

        $nombre   = trim($body['nombre'] ?? '');
        $correo   = trim($body['correo'] ?? '');
        $password = trim($body['password'] ?? '');
        $rol      = trim($body['rol'] ?? '');

        if (!$nombre || !$correo || !$password || !$rol) {
            jsonResponse(['error' => 'Todos los campos son requeridos'], 400);
        }

        $pdo = getDB();

        // Obtener rol_id
        $stmtRol = $pdo->prepare("SELECT id FROM roles WHERE nombre = ? LIMIT 1");
        $stmtRol->execute([$rol]);
        $rolData = $stmtRol->fetch();
        if (!$rolData) jsonResponse(['error' => 'Rol no encontrado'], 400);

        // Verificar correo duplicado
        $stmtCheck = $pdo->prepare("SELECT id FROM usuarios WHERE correo = ?");
        $stmtCheck->execute([$correo]);
        if ($stmtCheck->fetch()) jsonResponse(['error' => 'El correo ya está registrado'], 409);

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmtIns = $pdo->prepare("
            INSERT INTO usuarios (nombre, correo, password_hash, rol_id, estado)
            VALUES (?, ?, ?, ?, 'activo')
        ");
        $stmtIns->execute([$nombre, $correo, $hash, $rolData['id']]);

        jsonResponse(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;


    // ── EDITAR USUARIO (solo admin) ──
    case 'usuarios_editar':
        if ($method !== 'PUT') jsonResponse(['error' => 'Método no permitido'], 405);
        $body = json_decode(file_get_contents('php://input'), true);

        $id     = intval($body['id'] ?? 0);
        $nombre = trim($body['nombre'] ?? '');
        $correo = trim($body['correo'] ?? '');
        $rol    = trim($body['rol'] ?? '');
        $estado = trim($body['estado'] ?? 'activo');

        if (!$id || !$nombre || !$correo || !$rol) {
            jsonResponse(['error' => 'Campos incompletos'], 400);
        }

        $pdo = getDB();
        $stmtRol = $pdo->prepare("SELECT id FROM roles WHERE nombre = ? LIMIT 1");
        $stmtRol->execute([$rol]);
        $rolData = $stmtRol->fetch();
        if (!$rolData) jsonResponse(['error' => 'Rol no encontrado'], 400);

        $sql = "UPDATE usuarios SET nombre=?, correo=?, rol_id=?, estado=? WHERE id=?";
        $params = [$nombre, $correo, $rolData['id'], $estado, $id];

        // Actualizar password si se envía
        if (!empty($body['password'])) {
            $hash = password_hash($body['password'], PASSWORD_BCRYPT);
            $sql = "UPDATE usuarios SET nombre=?, correo=?, password_hash=?, rol_id=?, estado=? WHERE id=?";
            $params = [$nombre, $correo, $hash, $rolData['id'], $estado, $id];
        }

        $pdo->prepare($sql)->execute($params);
        jsonResponse(['success' => true]);
        break;


    // ── ELIMINAR USUARIO (solo admin) ──
    case 'usuarios_eliminar':
        if ($method !== 'DELETE') jsonResponse(['error' => 'Método no permitido'], 405);
        $body = json_decode(file_get_contents('php://input'), true);
        $id = intval($body['id'] ?? 0);

        if (!$id) jsonResponse(['error' => 'ID requerido'], 400);

        $pdo = getDB();
        $pdo->prepare("UPDATE usuarios SET estado='inactivo' WHERE id=?")->execute([$id]);
        jsonResponse(['success' => true]);
        break;


    // ── ESTADÍSTICAS GENERALES ──
    case 'stats':
        $pdo = getDB();
        $stats = [];

        $stats['total_usuarios'] = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE estado='activo'")->fetchColumn();
        $stats['total_empresas'] = $pdo->query("SELECT COUNT(*) FROM empresas WHERE estado='activa'")->fetchColumn();
        $stats['tareas_pendientes'] = $pdo->query("SELECT COUNT(*) FROM tareas WHERE estado='pendiente'")->fetchColumn();
        $stats['tareas_completadas'] = $pdo->query("SELECT COUNT(*) FROM tareas WHERE estado='completada'")->fetchColumn();
        $stats['tareas_en_progreso'] = $pdo->query("SELECT COUNT(*) FROM tareas WHERE estado='en_progreso'")->fetchColumn();
        $stats['modulos_activos'] = $pdo->query("SELECT COUNT(*) FROM modulos WHERE activo=1")->fetchColumn();

        $total = $stats['tareas_pendientes'] + $stats['tareas_completadas'] + $stats['tareas_en_progreso'];
        $stats['cumplimiento'] = $total > 0 ? round(($stats['tareas_completadas'] / $total) * 100) : 0;

        jsonResponse($stats);
        break;


    // ── STATS POR USUARIO ──
    case 'stats_usuario':
        $userId = intval($_GET['usuario_id'] ?? 0);
        if (!$userId) jsonResponse(['error' => 'usuario_id requerido'], 400);

        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM tareas WHERE asignado_a=? AND estado='pendiente'");
        $stmt->execute([$userId]);
        $pendientes = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM tareas WHERE asignado_a=? AND estado='completada'");
        $stmt->execute([$userId]);
        $completadas = $stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM tareas WHERE asignado_a=? AND estado='en_progreso'");
        $stmt->execute([$userId]);
        $en_progreso = $stmt->fetchColumn();

        jsonResponse(compact('pendientes', 'completadas', 'en_progreso'));
        break;


    default:
        jsonResponse(['error' => 'Acción no reconocida: ' . $action], 404);
}
