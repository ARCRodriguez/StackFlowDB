<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        echo json_encode(['status' => 'error', 'message' => 'Datos inválidos']);
        exit;
    }

    $data['timestamp_servidor'] = date('Y-m-d H:i:s');

    $file = 'data/respuestas.json';

    // Crear carpeta si no existe
    if (!is_dir('data')) {
        mkdir('data', 0755, true);
    }

    // Leer respuestas existentes o crear array nuevo
    $respuestas = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if ($content) {
            $respuestas = json_decode($content, true) ?? [];
        }
    }

    $respuestas[] = $data;

    // Guardar con formato bonito
    if (file_put_contents($file, json_encode($respuestas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode(['status' => 'success', 'message' => 'Guardado correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al guardar']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
}
?>