<?php
// ملف اختبار لإضافة طالب
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

$testData = [
    'name' => 'طالب تجريبي',
    'class' => 'الصف الأول',
    'age' => 15,
    'email' => 'test@example.com',
    'phone' => '0501234567',
    'student_number' => 'TEST001',
    'password' => '123456'
];

$conn = getDBConnection();

$name = $testData['name'];
$class = $testData['class'];
$age = $testData['age'];
$email = $testData['email'];
$phone = $testData['phone'];
$password = md5($testData['password']);
$student_number = $testData['student_number'];

$stmt = $conn->prepare("INSERT INTO students (name, class, age, email, phone, password, student_number) VALUES (?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    echo jsonResponse(false, null, 'خطأ في إعداد الاستعلام: ' . $conn->error);
    $conn->close();
    exit();
}

$stmt->bind_param("ssissss", $name, $class, $age, $email, $phone, $password, $student_number);

if ($stmt->execute()) {
    echo jsonResponse(true, ['id' => $conn->insert_id], 'تم إضافة الطالب بنجاح');
} else {
    echo jsonResponse(false, null, 'فشل إضافة الطالب: ' . $stmt->error);
}

$stmt->close();
$conn->close();
?>
