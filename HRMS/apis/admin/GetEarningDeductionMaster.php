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

try {
    $stmt = $pdo->query("SELECT id, description, type FROM earning_deduction_master");
    $earningsDeductions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $earningsDeductions
    ]);
} catch (Exception $e) {
    Response::error("Failed to fetch data: " . $e->getMessage(), 500);
}
