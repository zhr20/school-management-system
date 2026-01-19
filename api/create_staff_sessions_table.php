<?php
require_once __DIR__ . '/config.php';

$conn = getDBConnection();

// إنشاء جدول جلسات الموظفين
$sql = "CREATE TABLE IF NOT EXISTS staff_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    session_token VARCHAR(191) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql)) {
    echo jsonResponse(true, null, 'تم إنشاء جدول جلسات الموظفين بنجاح');
} else {
    echo jsonResponse(false, null, 'خطأ في إنشاء الجدول: ' . $conn->error);
}

$conn->close();
?>
