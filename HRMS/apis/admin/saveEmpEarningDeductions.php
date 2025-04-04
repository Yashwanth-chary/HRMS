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

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['employeeId'], $data['month'], $data['year'], $data['earnings'], $data['deductions'], $data['netSalary'])) {
    Response::error("Invalid input data.", 400);
}

$employeeId = $data['employeeId'];
$month = $data['month'];
$year = $data['year'];
$earnings = $data['earnings'];
$deductions = $data['deductions'];
$netSalary = $data['netSalary'];


try {
    $pdo->beginTransaction();

    $existingStmt = $pdo->prepare("SELECT id, earning_deduction_id FROM employee_earnings_deductions WHERE employee_id = ?");
    $existingStmt->execute([$employeeId]);
    $existingRecords = $existingStmt->fetchAll(PDO::FETCH_ASSOC);

    $existingIds = array_column($existingRecords, 'id', 'earning_deduction_id');
    $existingEarningDeductionIds = array_keys($existingIds);

    $currentEarningDeductionIds = array_merge(
        array_column($earnings, 'earning_deduction_id'),
        array_column($deductions, 'earning_deduction_id')
    );

    $idsToDelete = array_diff($existingEarningDeductionIds, $currentEarningDeductionIds);

    if (!empty($idsToDelete)) {
        $deleteStmt = $pdo->prepare("DELETE FROM employee_earnings_deductions WHERE id = ?");
        foreach ($idsToDelete as $id) {
            $deleteStmt->execute([$existingIds[$id]]);
        }
    }

    $insertEarningStmt = $pdo->prepare("
        INSERT INTO employee_earnings_deductions (employee_id, earning_deduction_id, amount) 
        VALUES (?, ?, ?)
        ON CONFLICT (employee_id, earning_deduction_id)
        DO UPDATE SET amount = EXCLUDED.amount
    ");

    foreach ($earnings as $earning) {
        if (isset($earning['earning_deduction_id'], $earning['amount'])) {
            $insertEarningStmt->execute([$employeeId, $earning['earning_deduction_id'], $earning['amount']]);
        }
    }

    // Response::success('sucess',['dedcutions'=>$deductions]);

    $insertDeductionStmt = $pdo->prepare("
        INSERT INTO employee_earnings_deductions (employee_id, earning_deduction_id, amount) 
        VALUES (?, ?, ?)
        ON CONFLICT (employee_id, earning_deduction_id)
        DO UPDATE SET amount = EXCLUDED.amount
    ");

    foreach ($deductions as $deduction) {
        if (isset($deduction['earning_deduction_id'], $deduction['amount'])) {
            $insertDeductionStmt->execute([$employeeId, $deduction['earning_deduction_id'], $deduction['amount']]);
        }
    }

    // Response::success("success", ["netsalary"=>$netSalary]);

    $salaryStmt = $pdo->prepare("
        INSERT INTO employee_salary (employee_id, month, year, net_salary, salary_paid)
        VALUES (?, ?, ?, ?, false)
        ON CONFLICT (employee_id, month, year)
        DO UPDATE SET net_salary = EXCLUDED.net_salary, salary_paid = EXCLUDED.salary_paid
        RETURNING id;
    ");
    $salaryStmt->execute([$employeeId, $month, $year, $netSalary]);
    $salaryId = $salaryStmt->fetchColumn();

    if (!$salaryId) {
        throw new Exception("Failed to create or update employee_salary record.");
    }

    // $earningDeductionStmt = $pdo->prepare("
    //     SELECT id, amount FROM employee_earnings_deductions WHERE employee_id = ? AND earning_deduction_id = ?
    // ");

    // $insertSalaryEarningDeductionStmt = $pdo->prepare("
    //     INSERT INTO employee_salary_earning_deduction (salary_id, employee_earning_deduction_id, amount)
    //     VALUES (?, ?, ?)
    // ");

    // foreach ($earnings as $earning) {
    //     $earningDeductionStmt->execute([$employeeId, $earning['earning_deduction_id']]);
    //     $result = $earningDeductionStmt->fetch(PDO::FETCH_ASSOC);

    //     if ($result) {
    //         $insertSalaryEarningDeductionStmt->execute([$salaryId, $result['id'], $result['amount']]);
    //     }
    // }

    // foreach ($deductions as $deduction) {
    //     $earningDeductionStmt->execute([$employeeId, $deduction['earning_deduction_id']]);
    //     $result = $earningDeductionStmt->fetch(PDO::FETCH_ASSOC);

    //     if ($result) {
    //         $insertSalaryEarningDeductionStmt->execute([$salaryId, $result['id'], $result['amount']]);
    //     }
    // }

    $pdo->commit();

    Response::success("Payslip saved successfully.");
} catch (PDOException $e) {
    $pdo->rollBack();
    Response::error("Failed to save payslip: " . $e->getMessage());
} catch (Exception $e) {
    $pdo->rollBack();
    Response::error("Error: " . $e->getMessage());
}
