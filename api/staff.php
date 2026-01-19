<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'GET':
        // الحصول على جميع الموظفين أو موظف محدد
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT id, name, position, email, phone, permissions, created_at, updated_at FROM staff WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                // تحويل permissions من JSON إلى array
                if (!empty($row['permissions'])) {
                    $decoded = json_decode($row['permissions'], true);
                    // إذا فشل التحليل، استخدم array فارغ
                    $row['permissions'] = ($decoded !== null && is_array($decoded)) ? $decoded : [];
                } else {
                    $row['permissions'] = [];
                }
                
                // التأكد من عدم وجود output إضافي قبل JSON
                if (ob_get_level() > 0) {
                    ob_clean();
                }
                
                echo jsonResponse(true, $row);
            } else {
                http_response_code(404);
                echo jsonResponse(false, null, 'الموظف غير موجود');
            }
            $stmt->close();
        } else {
            $result = $conn->query("SELECT id, name, position, email, phone, permissions, created_at, updated_at FROM staff ORDER BY created_at DESC");
            $staff = [];
            
            while ($row = $result->fetch_assoc()) {
                // تحويل permissions من JSON إلى array
                if (!empty($row['permissions'])) {
                    $decoded = json_decode($row['permissions'], true);
                    // إذا فشل التحليل، استخدم array فارغ
                    $row['permissions'] = ($decoded !== null && is_array($decoded)) ? $decoded : [];
                } else {
                    $row['permissions'] = [];
                }
                $staff[] = $row;
            }
            
            // التأكد من عدم وجود output إضافي قبل JSON
            if (ob_get_level() > 0) {
                ob_clean();
            }
            
            echo jsonResponse(true, $staff);
        }
        break;
        
    case 'POST':
        // إضافة موظف جديد
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
        
        if (empty($data['name']) || empty($data['position']) || empty($data['email']) || empty($data['phone'])) {
            http_response_code(400);
            echo jsonResponse(false, null, 'جميع الحقول مطلوبة');
            break;
        }
        
        $name = trim($data['name']);
        $position = trim($data['position']);
        $email = trim($data['email']);
        $phone = trim($data['phone']);
        $password = !empty($data['password']) ? trim($data['password']) : '123456';
        
        // التحقق من صحة البريد الإلكتروني
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo jsonResponse(false, null, 'البريد الإلكتروني غير صحيح');
            break;
        }
        
        // تحويل الصلاحيات إلى JSON
        $permissions = isset($data['permissions']) ? json_encode($data['permissions'], JSON_UNESCAPED_UNICODE) : '{}';
        
        // تشفير كلمة المرور
        $hashedPassword = md5($password);
        
        $stmt = $conn->prepare("INSERT INTO staff (name, position, email, phone, password, permissions) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $name, $position, $email, $phone, $hashedPassword, $permissions);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, ['id' => $conn->insert_id], 'تم إضافة الموظف بنجاح');
        } else {
            http_response_code(500);
            $errorMsg = 'فشل إضافة الموظف';
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
        // تحديث موظف
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف الموظف مطلوب');
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
        
        $name = trim($data['name']);
        $position = trim($data['position']);
        $email = trim($data['email']);
        $phone = trim($data['phone']);
        
        // التحقق من صحة البريد الإلكتروني
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo jsonResponse(false, null, 'البريد الإلكتروني غير صحيح');
            break;
        }
        
        // تحويل الصلاحيات إلى JSON
        $permissions = isset($data['permissions']) ? json_encode($data['permissions'], JSON_UNESCAPED_UNICODE) : '{}';
        
        // بناء استعلام التحديث
        $updateFields = "name = ?, position = ?, email = ?, phone = ?, permissions = ?";
        $params = [$name, $position, $email, $phone, $permissions];
        $types = "sssss";
        
        // تحديث كلمة المرور فقط إذا تم توفيرها
        if (!empty($data['password'])) {
            $hashedPassword = md5(trim($data['password']));
            $updateFields .= ", password = ?";
            $params[] = $hashedPassword;
            $types .= "s";
        }
        
        $params[] = $id;
        $types .= "i";
        
        $stmt = $conn->prepare("UPDATE staff SET $updateFields WHERE id = ?");
        $stmt->bind_param($types, ...$params);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, null, 'تم تحديث الموظف بنجاح');
        } else {
            http_response_code(500);
            $errorMsg = 'فشل تحديث الموظف';
            if (strpos($stmt->error, 'Duplicate entry') !== false) {
                $errorMsg = 'البريد الإلكتروني مستخدم بالفعل';
            } else {
                $errorMsg .= ': ' . $stmt->error;
            }
            echo jsonResponse(false, null, $errorMsg);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // حذف موظف
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف الموظف مطلوب');
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM staff WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, null, 'تم حذف الموظف بنجاح');
        } else {
            http_response_code(500);
            echo jsonResponse(false, null, 'فشل حذف الموظف: ' . $stmt->error);
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