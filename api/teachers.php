<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'GET':
        // الحصول على جميع المعلمين أو معلم محدد
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT * FROM teachers WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                echo jsonResponse(true, $row);
            } else {
                http_response_code(404);
                echo jsonResponse(false, null, 'المعلم غير موجود');
            }
            $stmt->close();
        } else {
            $result = $conn->query("SELECT * FROM teachers ORDER BY created_at DESC");
            $teachers = [];
            
            while ($row = $result->fetch_assoc()) {
                $teachers[] = $row;
            }
            
            echo jsonResponse(true, $teachers);
        }
        break;
        
    case 'POST':
        // إضافة معلم جديد
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo jsonResponse(false, null, 'بيانات JSON غير صحيحة: ' . json_last_error_msg());
            break;
        }
        
        if (!$data) {
            http_response_code(400);
            echo jsonResponse(false, null, 'بيانات غير صحيحة');
            break;
        }
        
        if (empty($data['name']) || empty($data['specialization']) || empty($data['email']) || 
            empty($data['phone']) || !isset($data['salary']) || $data['salary'] === '') {
            http_response_code(400);
            echo jsonResponse(false, null, 'جميع الحقول مطلوبة');
            break;
        }
        
        $name = trim($data['name']);
        $specialization = trim($data['specialization']);
        $email = trim($data['email']);
        $phone = trim($data['phone']);
        $salary = floatval($data['salary']);
        
        // التحقق من صحة البريد الإلكتروني
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo jsonResponse(false, null, 'البريد الإلكتروني غير صحيح');
            break;
        }
        
        $stmt = $conn->prepare("INSERT INTO teachers (name, specialization, email, phone, salary) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssd", $name, $specialization, $email, $phone, $salary);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, ['id' => $conn->insert_id], 'تم إضافة المعلم بنجاح');
        } else {
            http_response_code(500);
            $errorMsg = 'فشل إضافة المعلم';
            if (strpos($stmt->error, 'Duplicate entry') !== false) {
                $errorMsg = 'البريد الإلكتروني مستخدم بالفعل';
            } else {
                $errorMsg .= ': ' . $stmt->error;
            }
            echo jsonResponse(false, null, $errorMsg);
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // تحديث معلم
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف المعلم مطلوب');
            break;
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo jsonResponse(false, null, 'بيانات JSON غير صحيحة: ' . json_last_error_msg());
            break;
        }
        
        if (!$data) {
            http_response_code(400);
            echo jsonResponse(false, null, 'بيانات غير صحيحة');
            break;
        }
        
        $name = $data['name'];
        $specialization = $data['specialization'];
        $email = $data['email'];
        $phone = $data['phone'];
        $salary = floatval($data['salary']);
        
        $stmt = $conn->prepare("UPDATE teachers SET name = ?, specialization = ?, email = ?, phone = ?, salary = ? WHERE id = ?");
        $stmt->bind_param("ssssdi", $name, $specialization, $email, $phone, $salary, $id);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, null, 'تم تحديث المعلم بنجاح');
        } else {
            http_response_code(500);
            echo jsonResponse(false, null, 'فشل تحديث المعلم: ' . $stmt->error);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // حذف معلم
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف المعلم مطلوب');
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM teachers WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, null, 'تم حذف المعلم بنجاح');
        } else {
            http_response_code(500);
            echo jsonResponse(false, null, 'فشل حذف المعلم: ' . $stmt->error);
        }
        $stmt->close();
        break;
        
    default:
        http_response_code(405);
        echo jsonResponse(false, null, 'طريقة الطلب غير مدعومة');
        break;
}

$conn->close();
?>
