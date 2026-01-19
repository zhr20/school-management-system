<?php
require_once 'config.php';

try {
    $conn = getDBConnection();
    $activities = [];
    
    // 1. آخر طالب تم تسجيله
    $lastStudentQuery = "
        SELECT 
            'student_registered' as type,
            CONCAT('تم تسجيل طالب جديد: ', s.name, ' - ', s.class) as description,
            s.created_at as activity_date,
            s.id as student_id,
            s.name as student_name,
            s.class as student_class,
            s.age as student_age,
            s.student_number as student_number,
            s.email as student_email,
            s.phone as student_phone
        FROM students s
        ORDER BY s.created_at DESC
        LIMIT 1
    ";
    
    $result = $conn->query($lastStudentQuery);
    if ($result && $result->num_rows > 0) {
        $studentData = $result->fetch_assoc();
        $activities[] = $studentData;
    }
    
    // 2. آخر معلم تم إضافته
    $lastTeacherQuery = "
        SELECT 
            'teacher_added' as type,
            CONCAT('تم إضافة معلم جديد: ', t.name, ' - ', t.specialization) as description,
            t.created_at as activity_date
        FROM teachers t
        ORDER BY t.created_at DESC
        LIMIT 1
    ";
    
    $result = $conn->query($lastTeacherQuery);
    if ($result && $result->num_rows > 0) {
        $activities[] = $result->fetch_assoc();
    }
    
    // 3. آخر موظف تمت إضافته
    $lastStaffQuery = "
        SELECT 
            'staff_added' as type,
            CONCAT('تم إضافة موظف جديد: ', s.name, ' - ', s.position) as description,
            s.created_at as activity_date
        FROM staff s
        ORDER BY s.created_at DESC
        LIMIT 1
    ";
    
    $result = $conn->query($lastStaffQuery);
    if ($result && $result->num_rows > 0) {
        $activities[] = $result->fetch_assoc();
    }
    
    // 4. آخر مادة تمت إضافتها
    $lastSubjectQuery = "
        SELECT 
            'subject_added' as type,
            CONCAT('تم إضافة مادة جديدة: ', sub.name, ' - ', sub.class) as description,
            sub.created_at as activity_date
        FROM subjects sub
        ORDER BY sub.created_at DESC
        LIMIT 1
    ";
    
    $result = $conn->query($lastSubjectQuery);
    if ($result && $result->num_rows > 0) {
        $activities[] = $result->fetch_assoc();
    }
    
    // 5. آخر إعلان من جدول announcements
    $tableCheck = $conn->query("SHOW TABLES LIKE 'announcements'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $lastAnnouncementQuery = "
            SELECT 
                'announcement' as type,
                CONCAT('إعلان جديد: ', a.title) as description,
                a.created_at as activity_date,
                a.content as announcement_content,
                a.title as announcement_title
            FROM announcements a
            ORDER BY a.created_at DESC
            LIMIT 1
        ";
        
        $result = $conn->query($lastAnnouncementQuery);
        if ($result && $result->num_rows > 0) {
            $activities[] = $result->fetch_assoc();
        }
    }
    
    // ترتيب جميع الأنشطة حسب التاريخ
    usort($activities, function($a, $b) {
        $timeA = strtotime($a['activity_date']);
        $timeB = strtotime($b['activity_date']);
        return $timeB - $timeA;
    });
    
    // تنسيق البيانات
    $formattedActivities = [];
    foreach ($activities as $activity) {
        $formattedActivity = [
            'type' => $activity['type'],
            'description' => $activity['description'],
            'time_ago' => getTimeAgo($activity['activity_date'])
        ];
        
        // إضافة معلومات إضافية للطالب إذا كان النوع student_registered
        if ($activity['type'] === 'student_registered' && isset($activity['student_id'])) {
            $formattedActivity['student'] = [
                'id' => $activity['student_id'],
                'name' => $activity['student_name'] ?? '',
                'class' => $activity['student_class'] ?? '',
                'age' => $activity['student_age'] ?? '',
                'student_number' => $activity['student_number'] ?? '',
                'email' => $activity['student_email'] ?? '',
                'phone' => $activity['student_phone'] ?? ''
            ];
        }
        
        // إضافة معلومات إضافية للإعلان إذا كان النوع announcement
        if ($activity['type'] === 'announcement' && isset($activity['announcement_content'])) {
            $formattedActivity['announcement'] = [
                'title' => $activity['announcement_title'] ?? '',
                'content' => $activity['announcement_content'] ?? ''
            ];
        }
        
        $formattedActivities[] = $formattedActivity;
    }
    
    echo jsonResponse(true, ['activities' => $formattedActivities]);
    
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo jsonResponse(false, null, $e->getMessage());
}

function getTimeAgo($datetime) {
    if (!$datetime) return '--';
    $timestamp = strtotime($datetime);
    $diff = time() - $timestamp;
    
    if ($diff < 60) {
        return 'منذ ' . $diff . ' ث';
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return 'منذ ' . $minutes . ' د';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return 'منذ ' . $hours . ' ساعة' . ($hours > 1 ? '' : '');
    } elseif ($diff < 2592000) {
        $days = floor($diff / 86400);
        return 'منذ ' . $days . ' يوم' . ($days > 1 ? '' : '');
    } else {
        $months = floor($diff / 2592000);
        return 'منذ ' . $months . ' شهر' . ($months > 1 ? '' : '');
    }
}
?>
