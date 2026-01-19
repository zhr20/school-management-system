<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'POST':
        // تسجيل دخول الطالب
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo jsonResponse(false, null, 'البريد الإلكتروني وكلمة المرور مطلوبان');
            break;
        }
        
        $email = $data['email'];
        $password = md5($data['password']); // استخدام MD5 للبساطة (في الإنتاج استخدم password_hash)
        
        $stmt = $conn->prepare("SELECT id, name, email, class, student_number FROM students WHERE email = ? AND password = ?");
        $stmt->bind_param("ss", $email, $password);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($student = $result->fetch_assoc()) {
            // إنشاء جلسة
            $token = bin2hex(random_bytes(32));
            $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            $stmt2 = $conn->prepare("INSERT INTO student_sessions (student_id, session_token, expires_at) VALUES (?, ?, ?)");
            $stmt2->bind_param("iss", $student['id'], $token, $expires_at);
            $stmt2->execute();
            $stmt2->close();
            
            echo jsonResponse(true, [
                'token' => $token,
                'student' => $student
            ], 'تم تسجيل الدخول بنجاح');
        } else {
            http_response_code(401);
            echo jsonResponse(false, null, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
        $stmt->close();
        break;
        
    case 'GET':
        // التحقق من الجلسة
        if (!isset($_GET['token'])) {
            http_response_code(400);
            echo jsonResponse(false, null, 'رمز الجلسة مطلوب');
            break;
        }
        
        $token = $_GET['token'];
        $stmt = $conn->prepare("
            SELECT s.id, s.name, s.email, s.class, s.student_number 
            FROM students s 
            INNER JOIN student_sessions ss ON s.id = ss.student_id 
            WHERE ss.session_token = ? AND ss.expires_at > NOW()
        ");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($student = $result->fetch_assoc()) {
            echo jsonResponse(true, $student);
        } else {
            http_response_code(401);
            echo jsonResponse(false, null, 'الجلسة غير صالحة أو منتهية');
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // تسجيل الخروج
        if (!isset($_GET['token'])) {
            http_response_code(400);
            echo jsonResponse(false, null, 'رمز الجلسة مطلوب');
            break;
        }
        
        $token = $_GET['token'];
        $stmt = $conn->prepare("DELETE FROM student_sessions WHERE session_token = ?");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $stmt->close();
        
        echo jsonResponse(true, null, 'تم تسجيل الخروج بنجاح');
        break;
        
    default:
        http_response_code(405);
        echo jsonResponse(false, null, 'طريقة الطلب غير مدعومة');
        break;
}

$conn->close();
?>
