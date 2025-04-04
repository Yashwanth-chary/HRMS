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

    $employee_id = $userId;

    $stmt = $pdo->prepare("SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC");
    $stmt->execute([$employee_id]);
    $leaves = $stmt->fetchAll(PDO::FETCH_ASSOC);

    Response::success("success", $leaves);
} catch (Exception $e) {
    Response::error("Internal Server Error: " . $e->getMessage(), 500);
}
