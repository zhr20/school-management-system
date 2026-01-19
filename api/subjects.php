<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'GET':
        // الحصول على جميع المواد أو مادة محددة
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("
                SELECT s.*, t.name as teacher_name 
                FROM subjects s 
                LEFT JOIN teachers t ON s.teacher_id = t.id 
                WHERE s.id = ?
            ");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                echo jsonResponse(true, $row);
            } else {
                http_response_code(404);
                echo jsonResponse(false, null, 'المادة غير موجودة');
            }
            $stmt->close();
        } else {
            $result = $conn->query("
                SELECT s.*, t.name as teacher_name 
                FROM subjects s 
                LEFT JOIN teachers t ON s.teacher_id = t.id 
                ORDER BY s.created_at DESC
            ");
            $subjects = [];
            
            while ($row = $result->fetch_assoc()) {
                $subjects[] = $row;
            }
            
            echo jsonResponse(true, $subjects);
        }
        break;
        
    case 'POST':
        // إضافة مادة جديدة
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo jsonResponse(false, null, 'بيانات JSON غير صحيحة: ' . json_last_error_msg());
            break;
        }
        
        if (!$data || !isset($data['name']) || !isset($data['class']) || !isset($data['hours'])) {
            http_response_code(400);
            echo jsonResponse(false, null, 'جميع الحقول مطلوبة');
            break;
        }
        
        $name = $data['name'];
        $class = $data['class'];
        $teacher_id = !empty($data['teacher_id']) ? intval($data['teacher_id']) : null;
        $hours = intval($data['hours']);
        
        $stmt = $conn->prepare("INSERT INTO subjects (name, class, teacher_id, hours) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssii", $name, $class, $teacher_id, $hours);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, ['id' => $conn->insert_id], 'تم إضافة المادة بنجاح');
        } else {
            http_response_code(500);
            echo jsonResponse(false, null, 'فشل إضافة المادة: ' . $stmt->error);
        }
        $stmt->close();
        break;
        
    case 'PUT':
        // تحديث مادة
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف المادة مطلوب');
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
        $class = $data['class'];
        $teacher_id = !empty($data['teacher_id']) ? intval($data['teacher_id']) : null;
        $hours = intval($data['hours']);
        
        $stmt = $conn->prepare("UPDATE subjects SET name = ?, class = ?, teacher_id = ?, hours = ? WHERE id = ?");
        $stmt->bind_param("ssiii", $name, $class, $teacher_id, $hours, $id);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, null, 'تم تحديث المادة بنجاح');
        } else {
            http_response_code(500);
            echo jsonResponse(false, null, 'فشل تحديث المادة: ' . $stmt->error);
        }
        $stmt->close();
        break;
        
    case 'DELETE':
        // حذف مادة
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف المادة مطلوب');
            break;
        }
        
        $stmt = $conn->prepare("DELETE FROM subjects WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo jsonResponse(true, null, 'تم حذف المادة بنجاح');
        } else {
            http_response_code(500);
            echo jsonResponse(false, null, 'فشل حذف المادة: ' . $stmt->error);
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
