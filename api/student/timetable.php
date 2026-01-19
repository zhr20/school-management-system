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
    $day = isset($_GET['day']) ? $_GET['day'] : null;
    
    if ($day) {
        // الجدول اليومي
        $stmt = $conn->prepare("
            SELECT t.*, s.name as subject_name, s.hours, 
                   te.name as teacher_name, te.specialization
            FROM timetable t
            INNER JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN teachers te ON s.teacher_id = te.id
            WHERE t.class = ? AND t.day_of_week = ?
            ORDER BY t.start_time ASC
        ");
        $stmt->bind_param("ss", $class, $day);
    } else {
        // الجدول الأسبوعي
        $stmt = $conn->prepare("
            SELECT t.*, s.name as subject_name, s.hours, 
                   te.name as teacher_name, te.specialization
            FROM timetable t
            INNER JOIN subjects s ON t.subject_id = s.id
            LEFT JOIN teachers te ON s.teacher_id = te.id
            WHERE t.class = ?
            ORDER BY 
                FIELD(t.day_of_week, 'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'),
                t.start_time ASC
        ");
        $stmt->bind_param("s", $class);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $timetable = [];
    
    while ($row = $result->fetch_assoc()) {
        $timetable[] = $row;
    }
    
    echo jsonResponse(true, $timetable);
    $stmt->close();
} else {
    http_response_code(405);
    echo jsonResponse(false, null, 'طريقة الطلب غير مدعومة');
}

$conn->close();
?>
