<?php
require_once 'config.php';

$conn = getDBConnection();

$result = $conn->query("SELECT id, name, class FROM students LIMIT 3");

header('Content-Type: text/html; charset=utf-8');
echo "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body>";
echo "<h1>اختبار قراءة النص العربي</h1>";
echo "<table border='1'>";
echo "<tr><th>ID</th><th>الاسم</th><th>الصف</th></tr>";

while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . $row['id'] . "</td>";
    echo "<td>" . htmlspecialchars($row['name'], ENT_QUOTES, 'UTF-8') . "</td>";
    echo "<td>" . htmlspecialchars($row['class'], ENT_QUOTES, 'UTF-8') . "</td>";
    echo "</tr>";
}

echo "</table>";
echo "</body></html>";

$conn->close();
?>
