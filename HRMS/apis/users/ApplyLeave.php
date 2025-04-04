<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");

try {
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

    if ($role !== "user" && $role !== "admin") {
        Response::error("Access Denied. Only users can access this resource.", 403);
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $employee_id = $userId;
        $start_date = $_POST['start_date'];
        $end_date = $_POST['end_date'];

        if ($start_date > $end_date) {
            Response::error("End date cannot be earlier than start date.", 400);
        }

        $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM leaves 
        WHERE employee_id = ? 
        AND ( 
            (start_date <= ? AND end_date >= ?) -- New leave start is within an existing leave range
            OR
            (start_date <= ? AND end_date >= ?) -- New leave end is within an existing leave range
            OR
            (start_date >= ? AND end_date <= ?) -- New leave range fully contains an existing leave
        )
    ");
        $stmt->execute([$employee_id, $start_date, $start_date, $start_date, $end_date, $start_date, $end_date]);
        $overlapCount = $stmt->fetchColumn();

        if ($overlapCount > 0) {
            Response::error("You already have leave(s) applied during this period.", 400);
        }


        $stmt = $pdo->prepare("INSERT INTO leaves (employee_id, start_date, end_date, status) 
                               VALUES (?, ?, ?, 'Pending')");
        $stmt->execute([$employee_id, $start_date, $end_date]);

        Response::success("Leave applied successfully.");
    }
} catch (Exception $e) {
    Response::error("Internal Server Error: " . $e->getMessage(), 500);
}
