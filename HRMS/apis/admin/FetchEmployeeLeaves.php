<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");

header('Content-Type: application/json');

$headers = getallheaders();
$authHeader = $headers["Authorization"] ?? $headers["authorization"] ?? null;

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    Response::error("Unauthorized Access - No token provided", 401);
}

$token = $matches[1];
$authenticatedUser = JwtManager::decodeToken($token);

if (!$authenticatedUser) {
    Response::error("Invalid or expired token.", 401);
}

$userId = $authenticatedUser["id"];
$role = $authenticatedUser["role"];

if (!isset($role) || ($role !== "admin")) {
    Response::error("Access Denied. Only admins can access this resource.", 403);
}

$data = json_decode(file_get_contents('php://input'), true);

$employeeId = $data['employeeId'] ?? null;
$month = $data['month'] ?? null;
$year = $data['year'] ?? null;

if (!$employeeId || !$month || !$year) {
    Response::error("Invalid input. Employee ID, Month, and Year are required.", 400);
}

try {

    $month = strval($month);
    $year = strval($year);

    $query = "
        SELECT 
            GREATEST(start_date, DATE(:year || '-' || LPAD(:month, 2, '0') || '-01')) AS effective_start_date,
            LEAST(end_date, (DATE(:year || '-' || LPAD(:month, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day')) AS effective_end_date
        FROM leaves
        WHERE employee_id = :employeeId
        AND status = 'Approved'
        AND (
            (EXTRACT(YEAR FROM start_date) = :year::int AND EXTRACT(MONTH FROM start_date) = :month::int) OR
            (EXTRACT(YEAR FROM end_date) = :year::int AND EXTRACT(MONTH FROM end_date) = :month::int) OR
            (start_date < DATE(:year || '-' || LPAD(:month, 2, '0') || '-01') AND end_date > (DATE(:year || '-' || LPAD(:month, 2, '0') || '-01') + INTERVAL '1 month' - INTERVAL '1 day'))
        );
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([
        ':employeeId' => $employeeId,
        ':month' => $month,
        ':year' => $year
    ]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $totalLeaves = 0;

    foreach ($rows as $row) {
        $effectiveStartDate = new DateTime($row['effective_start_date']);
        $effectiveEndDate = new DateTime($row['effective_end_date']);
        $interval = $effectiveStartDate->diff($effectiveEndDate);
        $totalLeaves += $interval->days + 1; // +1 to include the start date itself
    }

    Response::success("success", ["totalLeaves" => $totalLeaves]);
} catch (PDOException $e) {
    Response::error("Database error: " . $e->getMessage(), 500);
}
