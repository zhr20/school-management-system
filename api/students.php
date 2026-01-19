<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // إخفاء الأخطاء لتجنب فساد JSON
ini_set('log_errors', 1);

require_once 'config.php';

// التعامل مع Preflight OPTIONS (مكررة للتأكد)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT id, name, class, age, email, phone, student_number, created_at, updated_at FROM students WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                echo jsonResponse(true, $row);
            } else {
                http_response_code(404);
                echo jsonResponse(false, null, 'الطالب غير موجود');
            }
            $stmt->close();
        } else {
            $result = $conn->query("SELECT id, name, class, age, email, phone, student_number, created_at, updated_at FROM students ORDER BY created_at DESC");
            $students = [];
            while ($row = $result->fetch_assoc()) $students[] = $row;
            echo jsonResponse(true, $students);
        }
        break;

    case 'POST':
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo jsonResponse(false, null, 'بيانات JSON غير صحيحة: ' . json_last_error_msg());
            exit();
        }

        $required = ['name', 'class', 'age', 'email', 'phone'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo jsonResponse(false, null, "الحقل $field مطلوب");
                exit();
            }
        }

        $name = trim($data['name']);
        $class = trim($data['class']);
        $age = intval($data['age']);
        $email = trim($data['email']);
        $phone = trim($data['phone']);
        $password = isset($data['password']) && !empty($data['password']) ? md5($data['password']) : md5('123456');
        $student_number = isset($data['student_number']) ? trim($data['student_number']) : null;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo jsonResponse(false, null, 'البريد الإلكتروني غير صحيح');
            exit();
        }

        if ($student_number) {
            $stmt = $conn->prepare("INSERT INTO students (name, class, age, email, phone, password, student_number) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssissss", $name, $class, $age, $email, $phone, $password, $student_number);
        } else {
            $stmt = $conn->prepare("INSERT INTO students (name, class, age, email, phone, password) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssisss", $name, $class, $age, $email, $phone, $password);
        }

        if ($stmt->execute()) {
            echo jsonResponse(true, ['id' => $conn->insert_id], 'تم إضافة الطالب بنجاح');
        } else {
            http_response_code(500);
            $errorMsg = $stmt->error;
            if (strpos($stmt->error, 'Duplicate entry') !== false) {
                if (strpos($stmt->error, 'email') !== false) $errorMsg = 'البريد الإلكتروني مستخدم بالفعل';
                elseif (strpos($stmt->error, 'student_number') !== false) $errorMsg = 'رقم الطالب مستخدم بالفعل';
                else $errorMsg = 'البيانات مكررة';
            }
            echo jsonResponse(false, null, 'فشل إضافة الطالب: ' . $errorMsg);
        }
        $stmt->close();
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف الطالب مطلوب');
            break;
        }

        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo jsonResponse(false, null, 'بيانات JSON غير صحيحة: ' . json_last_error_msg());
            break;
        }

        $required = ['name', 'class', 'age', 'email', 'phone'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                http_response_code(400);
                echo jsonResponse(false, null, "الحقل $field مطلوب");
                break 2;
            }
        }

        $name = trim($data['name']);
        $class = trim($data['class']);
        $age = intval($data['age']);
        $email = trim($data['email']);
        $phone = trim($data['phone']);
        $student_number = isset($data['student_number']) ? trim($data['student_number']) : null;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo jsonResponse(false, null, 'البريد الإلكتروني غير صحيح');
            break;
        }

        // بناء استعلام التحديث
        $updateFields = "name = ?, class = ?, age = ?, email = ?, phone = ?";
        $params = [$name, $class, $age, $email, $phone];
        $types = "ssiss";

        // تحديث كلمة المرور إذا تم توفيرها
        if (isset($data['password']) && !empty($data['password'])) {
            $updateFields .= ", password = ?";
            $params[] = md5($data['password']);
            $types .= "s";
        }

        // تحديث رقم الطالب إذا تم توفيره
        if ($student_number !== null) {
            $updateFields .= ", student_number = ?";
            $params[] = $student_number;
            $types .= "s";
        }

        $params[] = $id;
        $types .= "i";

        $stmt = $conn->prepare("UPDATE students SET $updateFields WHERE id = ?");
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo jsonResponse(true, ['id' => $id], 'تم تحديث بيانات الطالب بنجاح');
            } else {
                http_response_code(404);
                echo jsonResponse(false, null, 'الطالب غير موجود أو لم يتم تغيير أي بيانات');
            }
        } else {
            http_response_code(500);
            $errorMsg = $stmt->error;
            if (strpos($stmt->error, 'Duplicate entry') !== false) {
                if (strpos($stmt->error, 'email') !== false) $errorMsg = 'البريد الإلكتروني مستخدم بالفعل';
                elseif (strpos($stmt->error, 'student_number') !== false) $errorMsg = 'رقم الطالب مستخدم بالفعل';
                else $errorMsg = 'البيانات مكررة';
            }
            echo jsonResponse(false, null, 'فشل تحديث بيانات الطالب: ' . $errorMsg);
        }
        $stmt->close();
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if (!$id) {
            http_response_code(400);
            echo jsonResponse(false, null, 'معرف الطالب مطلوب');
            break;
        }

        $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                echo jsonResponse(true, null, 'تم حذف الطالب بنجاح');
            } else {
                http_response_code(404);
                echo jsonResponse(false, null, 'الطالب غير موجود');
            }
        } else {
            http_response_code(500);
            echo jsonResponse(false, null, 'فشل حذف الطالب: ' . $stmt->error);
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
