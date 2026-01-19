<?php
// تعطيل عرض الأخطاء لمنع إفساد JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// إعدادات الترميز UTF-8
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');
mb_regex_encoding('UTF-8');

// رؤوس CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');

// معالجة طلبات OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// إعدادات قاعدة البيانات
// ⚠️ قم بتغيير هذه القيم حسب إعدادات قاعدة البيانات الخاصة بك
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'school_management');

// الاتصال بقاعدة البيانات (mysqli - للتوافق مع الكود القديم)
function getDBConnection() {
    // تنظيف أي output قبل الاتصال
    if (ob_get_level() > 0) {
        ob_clean();
    }
    
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("فشل الاتصال: " . $conn->connect_error);
        }
        
        // إعدادات الترميز UTF-8 بشكل كامل
        $conn->set_charset("utf8mb4");
        $conn->query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        $conn->query("SET CHARACTER SET utf8mb4");
        $conn->query("SET character_set_connection=utf8mb4");
        $conn->query("SET character_set_client=utf8mb4");
        $conn->query("SET character_set_results=utf8mb4");
        $conn->query("SET collation_connection=utf8mb4_unicode_ci");
        
        return $conn;
    } catch (Exception $e) {
        // تنظيف أي output قبل إرسال JSON
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }
}

// الاتصال بقاعدة البيانات باستخدام PDO
function getPDOConnection() {
    // تنظيف أي output قبل الاتصال
    if (ob_get_level() > 0) {
        ob_clean();
    }
    
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // تنظيف أي output قبل إرسال JSON
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'فشل الاتصال بقاعدة البيانات: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }
}

// دالة لإرجاع استجابة JSON
function jsonResponse($success, $data = null, $message = '') {
    // تنظيف أي output قبل إرسال JSON
    if (ob_get_level() > 0) {
        ob_clean();
    }
    
    $response = ['success' => $success];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($message) {
        $response['message'] = $message;
    }
    
    $json = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(500);
        return json_encode([
            'success' => false,
            'message' => 'خطأ في تنسيق JSON: ' . json_last_error_msg()
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    
    return $json;
}
?>
