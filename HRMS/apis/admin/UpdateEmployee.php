<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");

$headers = getallheaders();
$authHeader = $headers["Authorization"] ?? $headers["authorization"] ?? null;

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    Response::error("Unauthorized Access - No token provided", 401);
}

$token = $matches[1];
$authenticatedUser = JwtManager::decodeToken($token);

if (!$authenticatedUser || $authenticatedUser["role"] !== "admin") {
    Response::error("Access Denied. Only admins can update employees.", 403);
}

try {
    $stmt = $pdo->prepare("UPDATE employees SET name = :name, dob = :dob, doj = :doj, phone = :phone, designation = :designation, department = :department WHERE id = :id");

    $stmt->execute([
        ':name' => $_POST['name'],
        ':dob' => $_POST['dob'],
        ':doj' => $_POST['doj'],
        ':phone' => $_POST['phone'],
        ':designation' => $_POST['designation'],
        ':department' => $_POST['department'],
        ':id' => $_POST['id']
    ]);

    Response::success("Employee updated successfully.");
} catch (Exception $e) {
    Response::error("Failed to update employee: " . $e->getMessage(), 500);
}
