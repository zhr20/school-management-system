<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'POST':
        // تسجيل دخول الموظف/المدير
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo jsonResponse(false, null, 'البريد الإلكتروني وكلمة المرور مطلوبان');
            break;
        }
        
        $email = $data['email'];
        $password = md5($data['password']); // استخدام MD5 للبساطة (في الإنتاج استخدم password_hash)
        
        $stmt = $conn->prepare("SELECT id, name, position, email, phone, permissions FROM staff WHERE email = ? AND password = ?");
        $stmt->bind_param("ss", $email, $password);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($staff = $result->fetch_assoc()) {
            // إنشاء جلسة
            $token = bin2hex(random_bytes(32));
            $expires_at = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            // التأكد من وجود جدول staff_sessions
            $conn->query("CREATE TABLE IF NOT EXISTS staff_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                staff_id INT NOT NULL,
                session_token VARCHAR(191) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
            
            $stmt2 = $conn->prepare("INSERT INTO staff_sessions (staff_id, session_token, expires_at) VALUES (?, ?, ?)");
            $stmt2->bind_param("iss", $staff['id'], $token, $expires_at);
            $stmt2->execute();
            $stmt2->close();
            
            // تحويل الصلاحيات من JSON إلى array
            $permissions = json_decode($staff['permissions'] ?? '{}', true);
            
            echo jsonResponse(true, [
                'token' => $token,
                'user' => [
                    'id' => $staff['id'],
                    'name' => $staff['name'],
                    'position' => $staff['position'],
                    'email' => $staff['email'],
                    'phone' => $staff['phone'],
                    'permissions' => $permissions
                ]
            ], 'تم تسجيل الدخول بنجاح');
        } else {
            http_response_code(401);
            echo jsonResponse(false, null, 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }
        $stmt->close();
        break;
        
    case 'GET':
        // التحقق من الجلسة
        $headers = getallheaders();
        $token = null;
        
        // البحث عن التوكن في Header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        // إذا لم يوجد في Header، جرب GET parameter
        if (!$token && isset($_GET['token'])) {
            $token = $_GET['token'];
        }
        
        if (!$token) {
            http_response_code(401);
            echo jsonResponse(false, null, 'رمز الجلسة مطلوب');
            break;
        }
        
        $stmt = $conn->prepare("
            SELECT s.id, s.name, s.position, s.email, s.phone, s.permissions 
            FROM staff s 
            INNER JOIN staff_sessions ss ON s.id = ss.staff_id 
            WHERE ss.session_token = ? AND ss.expires_at > NOW()
        ");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($staff = $result->fetch_assoc()) {
            $permissions = json_decode($staff['permissions'] ?? '{}', true);
            echo jsonResponse(true, [
                'user' => [
                    'id' => $staff['id'],
                    'name' => $staff['name'],
                    'position' => $staff['position'],
                    'email' => $staff['email'],
                    'phone' => $staff['phone'],
                    'permissions' => $permissions
                ]
            ]);
        } else {
            http_response_code(401);
            echo jsonResponse(false, null, 'الجلسة غير صالحة أو منتهية');
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // تسجيل الخروج
        $headers = getallheaders();
        $token = null;
        
        // البحث عن التوكن في Header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        // إذا لم يوجد في Header، جرب GET parameter
        if (!$token && isset($_GET['token'])) {
            $token = $_GET['token'];
        }
        
        if (!$token) {
            http_response_code(400);
            echo jsonResponse(false, null, 'رمز الجلسة مطلوب');
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM staff_sessions WHERE session_token = ?");
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
