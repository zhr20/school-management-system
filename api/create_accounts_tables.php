<?php
/**
 * ملف لإنشاء جداول الحسابات تلقائياً
 * قم بتشغيل هذا الملف مرة واحدة فقط
 */

require_once 'config.php';

$conn = getDBConnection();

// قراءة ملف SQL
$sqlFile = __DIR__ . '/accounts_tables.sql';
if (!file_exists($sqlFile)) {
    die('ملف accounts_tables.sql غير موجود');
}

$sql = file_get_contents($sqlFile);

// تقسيم SQL إلى أوامر منفصلة
$statements = array_filter(
    array_map('trim', explode(';', $sql)),
    function($stmt) {
        return !empty($stmt) && !preg_match('/^--/', $stmt);
    }
);

$success = true;
$errors = [];

foreach ($statements as $statement) {
    if (empty(trim($statement))) continue;
    
    // تخطي التعليقات
    if (preg_match('/^--/', $statement)) continue;
    
    if (!$conn->query($statement)) {
        $success = false;
        $errors[] = $conn->error;
    }
}

if ($success) {
    echo jsonResponse(true, null, 'تم إنشاء جداول الحسابات بنجاح');
} else {
    http_response_code(500);
    echo jsonResponse(false, ['errors' => $errors], 'حدثت أخطاء أثناء إنشاء الجداول');
}

$conn->close();
?>
