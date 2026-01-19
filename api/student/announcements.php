<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

// التحقق من الجلسة
function verifySession($conn) {
    if (!isset($_GET['token'])) {
        http_response_code(401);
        echo jsonResponse(false, null, 'رمز الجلسة مطلوب');
        return null;
    }
    
    $token = $_GET['token'];
    $stmt = $conn->prepare("
        SELECT s.id, s.class 
        FROM students s 
        INNER JOIN student_sessions ss ON s.id = ss.student_id 
        WHERE ss.session_token = ? AND ss.expires_at > NOW()
    ");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    $student = $result->fetch_assoc();
    $stmt->close();
    
    if (!$student) {
        http_response_code(401);
        echo jsonResponse(false, null, 'الجلسة غير صالحة');
        return null;
    }
    
    return $student;
}

if ($method === 'GET') {
    $student = verifySession($conn);
    if (!$student) exit;
    
    $class = $student['class'];
    
    // الحصول على التبليغات العامة وتبليغات الصف
    $stmt = $conn->prepare("
        SELECT * FROM announcements 
        WHERE target_class IS NULL OR target_class = ?
        ORDER BY 
            FIELD(priority, 'عاجلة', 'مهمة', 'عادية'),
            created_at DESC
        LIMIT 50
    ");
    $stmt->bind_param("s", $class);
    $stmt->execute();
    $result = $stmt->get_result();
    $announcements = [];
    
    while ($row = $result->fetch_assoc()) {
        $announcements[] = $row;
    }
    
    echo jsonResponse(true, $announcements);
    $stmt->close();
} else {
    http_response_code(405);
    echo jsonResponse(false, null, 'طريقة الطلب غير مدعومة');
}

$conn->close();
?>
