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
    
    // الحصول على مواد الصف
    $stmt = $conn->prepare("
        SELECT s.*, t.name as teacher_name, t.specialization, t.email as teacher_email, t.phone as teacher_phone
        FROM subjects s
        LEFT JOIN teachers t ON s.teacher_id = t.id
        WHERE s.class = ?
        ORDER BY s.name ASC
    ");
    $stmt->bind_param("s", $class);
    $stmt->execute();
    $result = $stmt->get_result();
    $subjects = [];
    
    while ($row = $result->fetch_assoc()) {
        // حساب المعدل في هذه المادة
        $stmt2 = $conn->prepare("
            SELECT AVG(grade / max_grade * 100) as average, COUNT(*) as exam_count
            FROM grades
            WHERE student_id = ? AND subject_id = ?
        ");
        $stmt2->bind_param("ii", $student['id'], $row['id']);
        $stmt2->execute();
        $gradeResult = $stmt2->get_result()->fetch_assoc();
        $stmt2->close();
        
        $row['average'] = $gradeResult['average'] ? round($gradeResult['average'], 2) : null;
        $row['exam_count'] = $gradeResult['exam_count'] ? intval($gradeResult['exam_count']) : 0;
        
        $subjects[] = $row;
    }
    
    echo jsonResponse(true, $subjects);
    $stmt->close();
} else {
    http_response_code(405);
    echo jsonResponse(false, null, 'طريقة الطلب غير مدعومة');
}

$conn->close();
?>
