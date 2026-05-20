<?php
/**
 * API Zidkenu — Módulo de tareas (JSON en servidor)
 * GET  ?action=snapshot  → devuelve todo el dataset
 * POST { "action": "save_snapshot", "data": { ... } }
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = dirname(__DIR__) . '/data';
$file = $dataDir . '/zidkenu_tareas.json';

function default_dataset() {
    $ts = date('c');
    return [
        'meta' => ['version' => 1, 'updated_at' => $ts],
        'empresas' => [
            ['id' => 'e1', 'nombre' => 'Empresa ABC S.A.C.', 'complejidad' => 'Alta'],
            ['id' => 'e2', 'nombre' => 'Logística Del Sur E.I.R.L.', 'complejidad' => 'Media'],
            ['id' => 'e3', 'nombre' => 'Turismo Andino SAC', 'complejidad' => 'Baja'],
            ['id' => 'e4', 'nombre' => 'Constructora Horizonte S.A.', 'complejidad' => 'Alta'],
            ['id' => 'e5', 'nombre' => 'Distribuidora Inti E.I.R.L.', 'complejidad' => 'Media'],
            ['id' => 'e6', 'nombre' => 'Servicios Generales Wari SAC', 'complejidad' => 'Baja'],
            ['id' => 'e7', 'nombre' => 'Minera Los Andes S.A.C.', 'complejidad' => 'Alta'],
            ['id' => 'e8', 'nombre' => 'Hostal Qorianka', 'complejidad' => 'Baja'],
        ],
        'tareas_pred' => [
            ['id' => 'tp1', 'nombre' => 'Declaración Anual de Renta', 'tipo' => 'anual', 'activa' => true, 'descripcion' => 'Declaración anual del Impuesto a la Renta de tercera categoría ante SUNAT.', 'creadaEn' => $ts],
            ['id' => 'tp2', 'nombre' => 'Estados Financieros Anuales', 'tipo' => 'anual', 'activa' => true, 'descripcion' => 'Elaboración y presentación de estados financieros del ejercicio fiscal.', 'creadaEn' => $ts],
            ['id' => 'tp3', 'nombre' => 'Cierre Contable Anual', 'tipo' => 'anual', 'activa' => true, 'descripcion' => 'Cierre del ejercicio: asientos de regularización, depreciación y cierre de cuentas de resultado.', 'creadaEn' => $ts],
            ['id' => 'tp4', 'nombre' => 'Balance General Anual', 'tipo' => 'anual', 'activa' => true, 'descripcion' => 'Elaboración del balance general y anexos al cierre del ejercicio.', 'creadaEn' => $ts],
            ['id' => 'tp5', 'nombre' => 'Declaración de Dividendos', 'tipo' => 'anual', 'activa' => true, 'descripcion' => 'Declaración y registro de distribución de dividendos y retenciones asociadas.', 'creadaEn' => $ts],
            ['id' => 'tp6', 'nombre' => 'Auditoría Interna Anual', 'tipo' => 'anual', 'activa' => true, 'descripcion' => 'Revisión y documentación de controles internos y hallazgos del ejercicio.', 'creadaEn' => $ts],
            ['id' => 'tp7', 'nombre' => 'PDT 621 — IGV/Renta', 'tipo' => 'mensual', 'activa' => true, 'descripcion' => 'Declaración mensual del PDT 621 (IGV y renta) mediante el portal SUNAT.', 'creadaEn' => $ts],
            ['id' => 'tp8', 'nombre' => 'PLAME — Planilla Mensual', 'tipo' => 'mensual', 'activa' => true, 'descripcion' => 'Declaración mensual de planilla electrónica PLAME ante SUNAT.', 'creadaEn' => $ts],
            ['id' => 'tp9', 'nombre' => 'Registro de Compras', 'tipo' => 'mensual', 'activa' => true, 'descripcion' => 'Registro y validación del libro de compras del periodo.', 'creadaEn' => $ts],
            ['id' => 'tp10', 'nombre' => 'Registro de Ventas', 'tipo' => 'mensual', 'activa' => true, 'descripcion' => 'Registro y validación del libro de ventas del periodo.', 'creadaEn' => $ts],
            ['id' => 'tp11', 'nombre' => 'Conciliación Bancaria', 'tipo' => 'mensual', 'activa' => true, 'descripcion' => 'Conciliación de saldos bancarios con la contabilidad del mes.', 'creadaEn' => $ts],
            ['id' => 'tp12', 'nombre' => 'Liquidación de IGV', 'tipo' => 'mensual', 'activa' => true, 'descripcion' => 'Cálculo y liquidación del IGV del periodo tributario.', 'creadaEn' => $ts],
        ],
        'asignaciones' => [],
        'tareas_asignadas' => [],
        'historial' => [],
        'comentarios' => [],
    ];
}

function read_dataset($file, $dataDir) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    if (!file_exists($file)) {
        return default_dataset();
    }
    $raw = file_get_contents($file);
    if (!$raw) {
        return default_dataset();
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return default_dataset();
    }
    $keys = ['empresas', 'tareas_pred', 'asignaciones', 'tareas_asignadas', 'historial', 'comentarios'];
    foreach ($keys as $k) {
        if (!isset($data[$k]) || !is_array($data[$k])) {
            $data[$k] = [];
        }
    }
    if (!isset($data['meta']) || !is_array($data['meta'])) {
        $data['meta'] = ['version' => 1, 'updated_at' => date('c')];
    }
    return $data;
}

function write_dataset($file, $dataDir, $data) {
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    $data['meta'] = array_merge($data['meta'] ?? [], [
        'version' => 1,
        'updated_at' => date('c'),
    ]);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $tmp = $file . '.tmp';
    $fp = fopen($tmp, 'c+');
    if (!$fp) {
        return false;
    }
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, $json);
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
    return rename($tmp, $file);
}

function respond($payload, $code = 200) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? 'snapshot';
    if ($action !== 'snapshot') {
        respond(['status' => 'error', 'message' => 'Acción GET no válida'], 400);
    }
    $data = read_dataset($file, $dataDir);
    respond(['status' => 'success', 'data' => $data]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        respond(['status' => 'error', 'message' => 'JSON inválido'], 400);
    }
    $action = $input['action'] ?? '';
    if ($action === 'save_snapshot') {
        $incoming = $input['data'] ?? null;
        if (!is_array($incoming)) {
            respond(['status' => 'error', 'message' => 'Falta data'], 400);
        }
        $keys = ['empresas', 'tareas_pred', 'asignaciones', 'tareas_asignadas', 'historial', 'comentarios'];
        $current = read_dataset($file, $dataDir);
        foreach ($keys as $k) {
            if (isset($incoming[$k]) && is_array($incoming[$k])) {
                $current[$k] = $incoming[$k];
            }
        }
        if (!write_dataset($file, $dataDir, $current)) {
            respond(['status' => 'error', 'message' => 'No se pudo escribir el archivo'], 500);
        }
        respond(['status' => 'success', 'message' => 'Guardado', 'meta' => $current['meta']]);
    }
    if ($action === 'seed') {
        $seed = default_dataset();
        if (!write_dataset($file, $dataDir, $seed)) {
            respond(['status' => 'error', 'message' => 'No se pudo inicializar'], 500);
        }
        respond(['status' => 'success', 'message' => 'Dataset inicializado', 'data' => $seed]);
    }
    respond(['status' => 'error', 'message' => 'Acción POST no válida'], 400);
}

respond(['status' => 'error', 'message' => 'Método no permitido'], 405);
