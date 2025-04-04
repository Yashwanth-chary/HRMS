<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");

header('Content-Type: application/json');

// Authorization Logic
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

    $salaryQuery = "SELECT salary_paid
        FROM employee_salary
        WHERE employee_id = :employee_id AND month = :month AND year = :year
        LIMIT 1";
    $salaryStmt = $pdo->prepare($salaryQuery);
    $salaryStmt->execute([
        ':employee_id' => $employeeId,
        ':month' => $month,
        ':year' => $year
    ]);
    $salaryRow = $salaryStmt->fetch(PDO::FETCH_ASSOC);
    $salaryPaid = $salaryRow ? $salaryRow['salary_paid'] : false;

    if (!$salaryPaid) {
        $earningsQuery = "SELECT earning_deduction_id, amount
                          FROM employee_earnings_deductions
                          WHERE employee_id = :employee_id
                          AND earning_deduction_id IN (SELECT id FROM earning_deduction_master WHERE type = 0)";
        $earningsStmt = $pdo->prepare($earningsQuery);
        $earningsStmt->execute([
            ':employee_id' => $employeeId
        ]);
        $earnings = $earningsStmt->fetchAll(PDO::FETCH_ASSOC);

        $deductionsQuery = "SELECT earning_deduction_id, amount
                            FROM employee_earnings_deductions
                            WHERE employee_id = :employee_id
                            AND earning_deduction_id IN (SELECT id FROM earning_deduction_master WHERE type = 1)";
        $deductionsStmt = $pdo->prepare($deductionsQuery);
        $deductionsStmt->execute([
            ':employee_id' => $employeeId
        ]);
        $deductions = $deductionsStmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $earningsQuery = "
        SELECT ed.earning_deduction_id, sed.amount
        FROM employee_salary_earning_deduction sed
        JOIN employee_salary es ON sed.salary_id = es.id
        JOIN employee_earnings_deductions ed ON sed.employee_earning_deduction_id = ed.id
        JOIN earning_deduction_master edm ON ed.earning_deduction_id = edm.id
        WHERE es.month = :month
          AND es.year = :year
          AND edm.type = 0
          AND es.employee_id = :employee_id
    ";
        $earningsStmt = $pdo->prepare($earningsQuery);
        $earningsStmt->execute([
            ':month' => $month,
            ':year' => $year,
            ':employee_id' => $employeeId
        ]);
        $earnings = $earningsStmt->fetchAll(PDO::FETCH_ASSOC);


        $deductionsQuery = "
        SELECT ed.earning_deduction_id, sed.amount
        FROM employee_salary_earning_deduction sed
        JOIN employee_salary es ON sed.salary_id = es.id
        JOIN employee_earnings_deductions ed ON sed.employee_earning_deduction_id = ed.id
        JOIN earning_deduction_master edm ON ed.earning_deduction_id = edm.id
        WHERE es.month = :month
          AND es.year = :year
          AND edm.type = 1
          AND es.employee_id = :employee_id
    ";
        $deductionsStmt = $pdo->prepare($deductionsQuery);
        $deductionsStmt->execute([
            ':month' => $month,
            ':year' => $year,
            ':employee_id' => $employeeId
        ]);
        $deductions = $deductionsStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    Response::success("Successful", [
        'earnings' => $earnings,
        'deductions' => $deductions,
        'salary_paid' => $salaryPaid
    ]);
} catch (PDOException $e) {
    Response::error("Server error: " . $e->getMessage(), 500);
}
