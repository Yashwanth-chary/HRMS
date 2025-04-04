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

    if (!isset($role) || ($role !== "admin")) {
        Response::error("Access Denied. Only users and admins can access this resource.", 403);
    }


    // Fetch total number of employees
    $totalEmployeesQuery = "SELECT COUNT(*) as total_employees FROM employees";
    $totalEmployeesResult = $pdo->query($totalEmployeesQuery)->fetch(PDO::FETCH_ASSOC);
    $totalEmployees = $totalEmployeesResult['total_employees'] ?? 0;

    // Fetch total number of active employees (users)
    $activeEmployeesQuery = "SELECT COUNT(*) as active_employees FROM users";
    $activeEmployeesResult = $pdo->query($activeEmployeesQuery)->fetch(PDO::FETCH_ASSOC);
    $activeEmployees = $activeEmployeesResult['active_employees'] ?? 0;

    // Fetch total number of pending leaves
    $pendingLeavesQuery = "SELECT COUNT(*) as pending_leaves FROM leaves WHERE status = 'Pending'";
    $pendingLeavesResult = $pdo->query($pendingLeavesQuery)->fetch(PDO::FETCH_ASSOC);
    $pendingLeaves = $pendingLeavesResult['pending_leaves'] ?? 0;

    // Fetch total number of pending salary payments
    $pendingSalaryQuery = "SELECT COUNT(*) as pending_payments FROM employee_salary WHERE salary_paid = false";
    $pendingSalaryResult = $pdo->query($pendingSalaryQuery)->fetch(PDO::FETCH_ASSOC);
    $pendingPayments = $pendingSalaryResult['pending_payments'] ?? 0;

    $dashboardData = [
        "totalEmployees" => $totalEmployees,
        "activeEmployees" => $activeEmployees,
        "pendingLeaves" => $pendingLeaves,
        "pendingPayments" => $pendingPayments
    ];

    Response::success("Dashboard data fetched successfully.", $dashboardData);
} catch (Exception $e) {
    Response::error("Unauthorized Access", 401);
}
