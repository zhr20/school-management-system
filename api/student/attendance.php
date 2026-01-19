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
    
    $month = isset($_GET['month']) ? $_GET['month'] : date('Y-m');
    $startDate = $month . '-01';
    $endDate = date('Y-m-t', strtotime($startDate));
    
    // الحضور الشهري
    $stmt = $conn->prepare("
        SELECT date, status 
        FROM attendance 
        WHERE student_id = ? AND date BETWEEN ? AND ?
        ORDER BY date DESC
    ");
    $stmt->bind_param("iss", $studentId, $startDate, $endDate);
    $stmt->execute();
    $result = $stmt->get_result();
    $attendance = [];
    
    while ($row = $result->fetch_assoc()) {
        $attendance[] = $row;
    }
    
    // إحصائيات الحضور
    $totalDays = count($attendance);
    $presentDays = count(array_filter($attendance, function($a) { return $a['status'] === 'present'; }));
    $absentDays = $totalDays - $presentDays;
    $attendanceRate = $totalDays > 0 ? round(($presentDays / $totalDays) * 100, 2) : 0;
    
    // الحضور لهذا الشهر
    $currentMonth = date('Y-m');
    $stmt2 = $conn->prepare("
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
        FROM attendance 
        WHERE student_id = ? AND date LIKE ?
    ");
    $currentMonthPattern = $currentMonth . '%';
    $stmt2->bind_param("is", $studentId, $currentMonthPattern);
    $stmt2->execute();
    $monthStats = $stmt2->get_result()->fetch_assoc();
    $stmt2->close();
    
    echo jsonResponse(true, [
        'attendance' => $attendance,
        'stats' => [
            'totalDays' => $totalDays,
            'presentDays' => $presentDays,
            'absentDays' => $absentDays,
            'attendanceRate' => $attendanceRate,
            'currentMonth' => [
                'total' => $monthStats['total'],
                'present' => $monthStats['present'],
                'rate' => $monthStats['total'] > 0 ? round(($monthStats['present'] / $monthStats['total']) * 100, 2) : 0
            ]
        ]
    ]);
    $stmt->close();
} else {
    http_response_code(405);
    echo jsonResponse(false, null, 'طريقة الطلب غير مدعومة');
}

$conn->close();
?>
