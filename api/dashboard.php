<?php
require_once 'config.php';

try {
    $conn = getDBConnection();

    // إحصائيات عامة
    $stats = [];

    // عدد الطلاب
    $result = $conn->query("SELECT COUNT(*) as total FROM students");
    if ($result) {
        $stats['totalStudents'] = $result->fetch_assoc()['total'];
    } else {
        $stats['totalStudents'] = 0;
    }

    // عدد المعلمين
    $result = $conn->query("SELECT COUNT(*) as total FROM teachers");
    if ($result) {
        $stats['totalTeachers'] = $result->fetch_assoc()['total'];
    } else {
        $stats['totalTeachers'] = 0;
    }

    // عدد المواد
    $result = $conn->query("SELECT COUNT(*) as total FROM subjects");
    if ($result) {
        $stats['totalSubjects'] = $result->fetch_assoc()['total'];
    } else {
        $stats['totalSubjects'] = 0;
    }

    // عدد الموظفين
    $result = $conn->query("SELECT COUNT(*) as total FROM staff");
    if ($result) {
        $stats['totalStaff'] = $result->fetch_assoc()['total'];
    } else {
        $stats['totalStaff'] = 0;
    }

    // عدد الطلاب حسب الصف
    $result = $conn->query("SELECT class, COUNT(*) as count FROM students GROUP BY class");
    $stats['class1Students'] = 0;
    $stats['class2Students'] = 0;
    $stats['class3Students'] = 0;

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            if ($row['class'] === 'الصف الأول') {
                $stats['class1Students'] = $row['count'];
            } elseif ($row['class'] === 'الصف الثاني') {
                $stats['class2Students'] = $row['count'];
            } elseif ($row['class'] === 'الصف الثالث') {
                $stats['class3Students'] = $row['count'];
            }
        }
    }

    // حساب نسبة الحضور اليوم
    $today = date('Y-m-d');
    $result = $conn->query("
        SELECT 
            COUNT(DISTINCT s.id) as total_students,
            COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END) as present_students
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.date = '$today'
    ");
    
    if ($result) {
        $attendanceData = $result->fetch_assoc();
        $totalStudents = $attendanceData['total_students'];
        $presentStudents = $attendanceData['present_students'];

        if ($totalStudents > 0) {
            $stats['todayAttendance'] = round(($presentStudents / $totalStudents) * 100);
        } else {
            $stats['todayAttendance'] = 0;
        }
    } else {
        $stats['todayAttendance'] = 0;
    }

    // الطلاب الجدد (آخر 5)
    $result = $conn->query("SELECT id, name, class, age, email, phone, student_number, created_at FROM students ORDER BY created_at DESC LIMIT 5");
    $recentStudents = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $recentStudents[] = $row;
        }
    }

    // إحصائيات الحسابات
    $accountsStats = [];
    
    // التحقق من وجود جداول الحسابات
    $tableCheck = $conn->query("SHOW TABLES LIKE 'class_fees'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        // إجمالي الأقساط المطلوبة
        $result = $conn->query("
            SELECT COALESCE(SUM(cf.fee_amount), 0) as total_fees
            FROM students s
            LEFT JOIN class_fees cf ON s.class = cf.class_name
        ");
        if ($result) {
            $row = $result->fetch_assoc();
            $accountsStats['totalFees'] = floatval($row['total_fees']);
        } else {
            $accountsStats['totalFees'] = 0;
        }
        
        // إجمالي المدفوعات
        $tableCheckPayments = $conn->query("SHOW TABLES LIKE 'payments'");
        if ($tableCheckPayments && $tableCheckPayments->num_rows > 0) {
            $result = $conn->query("SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments");
            if ($result) {
                $row = $result->fetch_assoc();
                $accountsStats['totalPaid'] = floatval($row['total_paid']);
            } else {
                $accountsStats['totalPaid'] = 0;
            }
            
            // المتبقي
            $accountsStats['totalRemaining'] = $accountsStats['totalFees'] - $accountsStats['totalPaid'];
            
            // عدد الطلاب الذين دفعوا بالكامل
            $result = $conn->query("
                SELECT COUNT(DISTINCT s.id) as fully_paid
                FROM students s
                LEFT JOIN class_fees cf ON s.class = cf.class_name
                LEFT JOIN (
                    SELECT student_id, SUM(amount) as total_paid
                    FROM payments
                    GROUP BY student_id
                ) p ON s.id = p.student_id
                WHERE COALESCE(cf.fee_amount, 0) > 0 
                AND COALESCE(p.total_paid, 0) >= COALESCE(cf.fee_amount, 0)
            ");
            if ($result) {
                $row = $result->fetch_assoc();
                $accountsStats['fullyPaidStudents'] = intval($row['fully_paid']);
            } else {
                $accountsStats['fullyPaidStudents'] = 0;
            }
            
            // عدد الطلاب الذين لم يدفعوا بالكامل
            $result = $conn->query("
                SELECT COUNT(DISTINCT s.id) as pending
                FROM students s
                LEFT JOIN class_fees cf ON s.class = cf.class_name
                LEFT JOIN (
                    SELECT student_id, SUM(amount) as total_paid
                    FROM payments
                    GROUP BY student_id
                ) p ON s.id = p.student_id
                WHERE COALESCE(cf.fee_amount, 0) > 0 
                AND COALESCE(p.total_paid, 0) < COALESCE(cf.fee_amount, 0)
            ");
            if ($result) {
                $row = $result->fetch_assoc();
                $accountsStats['pendingStudents'] = intval($row['pending']);
            } else {
                $accountsStats['pendingStudents'] = 0;
            }
        } else {
            $accountsStats['totalPaid'] = 0;
            $accountsStats['totalRemaining'] = $accountsStats['totalFees'];
            $accountsStats['fullyPaidStudents'] = 0;
            $accountsStats['pendingStudents'] = 0;
        }
    } else {
        $accountsStats['totalFees'] = 0;
        $accountsStats['totalPaid'] = 0;
        $accountsStats['totalRemaining'] = 0;
        $accountsStats['fullyPaidStudents'] = 0;
        $accountsStats['pendingStudents'] = 0;
    }

    echo jsonResponse(true, [
        'stats' => $stats,
        'recentStudents' => $recentStudents,
        'accountsStats' => $accountsStats
    ]);

    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo jsonResponse(false, null, 'حدث خطأ أثناء تحميل البيانات: ' . $e->getMessage());
}
?>
