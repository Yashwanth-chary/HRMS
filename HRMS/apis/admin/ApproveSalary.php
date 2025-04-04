<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");

header("Content-Type: application/json");

$headers = getallheaders();
$authHeader = $headers["Authorization"] ?? $headers["authorization"] ?? null;

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    Response::error("Unauthorized Access - No token provided", 401);
}

$token = $matches[1];
$authenticatedUser = JwtManager::decodeToken($token);

if (!$authenticatedUser || $authenticatedUser["role"] !== "admin") {
    Response::error("Forbidden", 403);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['employeeId'], $input['salaryId'], $input['month'], $input['year'])) {
        Response::error("Missing required fields", 400);
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        UPDATE employee_salary 
        SET salary_paid = true 
        WHERE id = :salaryId 
        AND employee_id = :employeeId 
        AND month = :month 
        AND year = :year
    ");
    $stmt->execute([
        ':salaryId' => $input['salaryId'],
        ':employeeId' => $input['employeeId'],
        ':month' => $input['month'],
        ':year' => $input['year']
    ]);

    $stmt = $pdo->prepare("
        SELECT * FROM employee_earnings_deductions
        WHERE employee_id = :employeeId
    ");
    $stmt->execute([
        ':employeeId' => $input['employeeId']

    ]);
    $components = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Response::success("success", ["netsalary"=>$components]);


    foreach ($components as $component) {
        $stmt = $pdo->prepare("
            INSERT INTO employee_salary_earning_deduction (
                salary_id,
                employee_earning_deduction_id,
                amount
            ) VALUES (
                :salaryId,
                :eedId,
                :amount
            )
        ");
        $stmt->execute([
            ':salaryId' => $input['salaryId'],
            ':eedId' => $component['id'],
            ':amount' => $component['amount']
        ]);
    }

    $pdo->commit();
    Response::success("Salary approved successfully");
} catch (PDOException $e) {
    $pdo->rollBack();
    Response::error("Database error: " . $e->getMessage(), 500);
} catch (Exception $e) {
    Response::error($e->getMessage(), 400);
}
