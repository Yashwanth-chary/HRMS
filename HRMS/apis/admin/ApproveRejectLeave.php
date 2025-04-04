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

    $role = $authenticatedUser["role"];
    if (!isset($role) || $role !== "admin") {
        Response::error("Access Denied. Only admins can access this resource.", 403);
    }

    $data = json_decode(file_get_contents("php://input"), true);

    $leaveId = $data["leave_id"] ?? null;
    $status = $data["status"] ?? null;

    if (!$leaveId || !$status || !in_array($status, ["Approved", "Rejected"])) {
        Response::error("Invalid request data.", 400);
    }

    $query = "UPDATE leaves SET status = :status WHERE id = :leave_id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(":status", $status);
    $stmt->bindParam(":leave_id", $leaveId);
    $stmt->execute();

    Response::success("Leave status updated successfully.");
} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
