<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");


header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

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



if (!isset($input['type'], $input['description'])) {
    Response::error('Invalid input. Type and description are required.', 400);
}

$type = (int) $input['type'];
$description = trim($input['description']);

if ($description === '') {
    Response::error('Description cannot be empty.', 400);
}

try {
    $stmt = $pdo->prepare("INSERT INTO earning_deduction_master (type, description) VALUES (?, ?)");
    $stmt->execute([$type, $description]);

    Response::success(['message' => 'Component added successfully.']);
} catch (PDOException $e) {
    Response::error('Database error: ' . $e->getMessage(), 500);
}
