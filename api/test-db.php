<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $conn = getDBConnection();
    
    echo json_encode([
        'success' => true,
        'message' => 'تم الاتصال بقاعدة البيانات بنجاح!',
        'database' => DB_NAME,
        'host' => DB_HOST
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'فشل الاتصال بقاعدة البيانات: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
?>
