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

    $employeeQuery = "SELECT e.* FROM employees e JOIN users u ON e.id = u.employee_id WHERE u.id = :userId";
    $employeeStmt = $pdo->prepare($employeeQuery);
    $employeeStmt->bindParam(":userId", $userId, PDO::PARAM_INT);
    $employeeStmt->execute();
    $employee = $employeeStmt->fetch(PDO::FETCH_ASSOC);

    if (!$employee) {
        Response::error("Employee not found.", 404);
    }

    $employeeId = $employee['id'];

    $requestType = $_GET['type'] ?? 'list';

    if ($requestType === 'list') {
        $salaryQuery = "SELECT id, month, year, net_salary, created_at 
                        FROM employee_salary 
                        WHERE employee_id = :employeeId AND salary_paid = true
                        ORDER BY year DESC, month DESC";

        $salaryStmt = $pdo->prepare($salaryQuery);
        $salaryStmt->bindParam(":employeeId", $employeeId, PDO::PARAM_INT);
        $salaryStmt->execute();
        $salaries = $salaryStmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success("Salary history fetched successfully.", $salaries);
    } elseif ($requestType === 'details' && isset($_GET['salary_id'])) {
        $salaryId = $_GET['salary_id'];

        $verifyQuery = "SELECT id, month, year, net_salary 
                        FROM employee_salary 
                        WHERE id = :salaryId AND employee_id = :employeeId";
        $verifyStmt = $pdo->prepare($verifyQuery);
        $verifyStmt->bindParam(":salaryId", $salaryId, PDO::PARAM_INT);
        $verifyStmt->bindParam(":employeeId", $employeeId, PDO::PARAM_INT);
        $verifyStmt->execute();
        $salaryInfo = $verifyStmt->fetch(PDO::FETCH_ASSOC);

        if (!$salaryInfo) {
            Response::error("Salary record not found or access denied.", 404);
        }

        $componentsQuery = "SELECT 
                                edm.description, 
                                edm.type,
                                esed.amount
                            FROM employee_salary_earning_deduction esed
                            JOIN employee_earnings_deductions eed ON esed.employee_earning_deduction_id = eed.id
                            JOIN earning_deduction_master edm ON eed.earning_deduction_id = edm.id
                            WHERE esed.salary_id = :salaryId AND esed.status = true
                            ORDER BY edm.type, edm.description";

        $componentsStmt = $pdo->prepare($componentsQuery);
        $componentsStmt->bindParam(":salaryId", $salaryId, PDO::PARAM_INT);
        $componentsStmt->execute();
        $components = $componentsStmt->fetchAll(PDO::FETCH_ASSOC);

        $leavesQuery = "SELECT 
                            start_date, end_date, total_leaves, status
                        FROM leaves
                        WHERE employee_id = :employeeId
                        AND EXTRACT(MONTH FROM start_date) = :month
                        AND EXTRACT(YEAR FROM start_date) = :year
                        AND status = 'Approved'";

        $leavesStmt = $pdo->prepare($leavesQuery);
        $leavesStmt->bindParam(":employeeId", $employeeId, PDO::PARAM_INT);
        $leavesStmt->bindParam(":month", $salaryInfo['month'], PDO::PARAM_INT);
        $leavesStmt->bindParam(":year", $salaryInfo['year'], PDO::PARAM_INT);
        $leavesStmt->execute();
        $leaves = $leavesStmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success("Salary details fetched successfully.", [
            'employee' => $employee,
            'salary_info' => $salaryInfo,
            'components' => $components,
            'leaves' => $leaves
        ]);
    } else {
        Response::error("Invalid request type.", 400);
    }
} catch (Exception $e) {
    Response::error("Server error: " . $e->getMessage(), 500);
}
