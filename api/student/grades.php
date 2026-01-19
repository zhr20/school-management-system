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
        SELECT s.id 
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
    
    return $student['id'];
}

if ($method === 'GET') {
    $studentId = verifySession($conn);
    if (!$studentId) exit;
    
    $subjectId = isset($_GET['subject_id']) ? intval($_GET['subject_id']) : null;
    
    if ($subjectId) {
        // درجات مادة محددة
        $stmt = $conn->prepare("
            SELECT g.*, s.name as subject_name
            FROM grades g
            INNER JOIN subjects s ON g.subject_id = s.id
            WHERE g.student_id = ? AND g.subject_id = ?
            ORDER BY g.exam_date DESC
        ");
        $stmt->bind_param("ii", $studentId, $subjectId);
    } else {
        // جميع الدرجات
        $stmt = $conn->prepare("
            SELECT g.*, s.name as subject_name, s.class
            FROM grades g
            INNER JOIN subjects s ON g.subject_id = s.id
            WHERE g.student_id = ?
            ORDER BY g.exam_date DESC, s.name ASC
        ");
        $stmt->bind_param("i", $studentId);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $grades = [];
    
    while ($row = $result->fetch_assoc()) {
        $row['percentage'] = round(($row['grade'] / $row['max_grade']) * 100, 2);
        $grades[] = $row;
    }
    
    // حساب المعدل العام
    $totalGrade = 0;
    $totalMax = 0;
    foreach ($grades as $grade) {
        $totalGrade += $grade['grade'];
        $totalMax += $grade['max_grade'];
    }
    $average = $totalMax > 0 ? round(($totalGrade / $totalMax) * 100, 2) : 0;
    
    echo jsonResponse(true, [
        'grades' => $grades,
        'average' => $average,
        'totalExams' => count($grades)
    ]);
    $stmt->close();
} else {
    http_response_code(405);
    echo jsonResponse(false, null, 'طريقة الطلب غير مدعومة');
}

$conn->close();
?>
