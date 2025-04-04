<?php
require_once("../../vendor/autoload.php");
require_once("../../src/Database.php");
require_once("../../src/Response.php");
require_once("../../src/Auth.php");

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    Response::error("Unauthorized Access - No token provided", 401);
}

$token = $matches[1];
$authenticatedUser = JwtManager::decodeToken($token);

if (!$authenticatedUser) {
    Response::error("Invalid or expired token.", 401);
}

$userId = $authenticatedUser['id'];
$role = $authenticatedUser['role'];

if ($role !== 'admin') {
    Response::error("Access Denied. Only admins can access this resource.", 403);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'];
    $dob = $_POST['dob'];
    $doj = $_POST['doj'];
    $phone = $_POST['phone'];
    $designation = $_POST['designation'];
    $department = $_POST['department'];

    $query = "INSERT INTO employees (name, dob, doj, phone, designation, department) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$name, $dob, $doj, $phone, $designation, $department]);

    Response::success("Employee added successfully.");
} else {
    Response::error("Invalid request method.", 405);
}
