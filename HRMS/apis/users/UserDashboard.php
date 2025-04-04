<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");

header("Content-Type: application/json");

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

    if (!isset($role) || ($role !== "user" && $role !== "admin")) {
        Response::error("Access Denied. Only users can access this resource.", 403);
    }

    $query = "SELECT e.id, e.name, e.designation, e.department, e.doj 
              FROM employees e
              JOIN users u ON e.id = u.employee_id
              WHERE u.id = :userId";

    $statement = $pdo->prepare($query);
    $statement->bindParam(":userId", $userId, PDO::PARAM_INT);
    $statement->execute();
    $employee = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$employee) {
        Response::error("Employee not found.", 404);
    }

    $employeeId = $employee['id'];

    $leaveQuery = "SELECT 
                    SUM(CASE WHEN status = 'Approved' THEN total_leaves ELSE 0 END) as taken_leaves,
                    SUM(CASE WHEN status = 'Pending' THEN total_leaves ELSE 0 END) as pending_leaves
                   FROM leaves 
                   WHERE employee_id = :employeeId";

    $leaveStmt = $pdo->prepare($leaveQuery);
    $leaveStmt->bindParam(":employeeId", $employeeId, PDO::PARAM_INT);
    $leaveStmt->execute();
    $leaveStats = $leaveStmt->fetch(PDO::FETCH_ASSOC);

    $salaryQuery = "SELECT month, year 
                    FROM employee_salary 
                    WHERE employee_id = :employeeId 
                    AND salary_paid = true
                    ORDER BY year DESC, month DESC 
                    LIMIT 1";

    $salaryStmt = $pdo->prepare($salaryQuery);
    $salaryStmt->bindParam(":employeeId", $employeeId, PDO::PARAM_INT);
    $salaryStmt->execute();
    $lastSalary = $salaryStmt->fetch(PDO::FETCH_ASSOC);

    $responseData = [
        'profile' => [
            'name' => $employee['name'],
            'designation' => $employee['designation'],
            'department' => $employee['department'],
            'doj' => $employee['doj']
        ],
        'leaves' => [
            'taken' => (int)($leaveStats['taken_leaves'] ?? 0),
            'pending' => (int)($leaveStats['pending_leaves'] ?? 0)
        ],
        'salary' => $lastSalary ? [
            'month' => (int)$lastSalary['month'],
            'year' => (int)$lastSalary['year']
        ] : null
    ];

    Response::success("Dashboard data fetched successfully.", $responseData);
} catch (Exception $e) {
    Response::error("Server error: " . $e->getMessage(), 500);
}
