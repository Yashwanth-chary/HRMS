<?php

require_once("../vendor/autoload.php");
require_once("../src/Database.php");
require_once("../src/Response.php");
require_once("../src/Auth.php");

try {
    if ($_SERVER["REQUEST_METHOD"] != "POST") {
        Response::error("Method Not Allowed", 400);
    }

    $validationRules = [
        "empId" => [
            "required" => true,
            "error" => "Employee ID is required."
        ],
        "password" => [
            "required" => true,
            "pattern" => "/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/",
            "error" => "Password is required and must be at least 6 characters long."
        ]
    ];

    $formData = [];
    foreach ($validationRules as $field => $rules) {
        if ($rules["required"] && empty($_POST[$field])) {
            Response::error($rules["error"], 400);
        }
        if (isset($rules["pattern"]) && !preg_match($rules["pattern"], $_POST[$field])) {
            Response::error($rules["error"], 400);
        }
        $formData[$field] = trim($_POST[$field]);
    }

    $formData["password"] = md5($formData["password"]);

    $query = "SELECT * FROM users WHERE employee_id = :empId AND password = :password";
    $statement = $pdo->prepare($query);
    $statement->bindParam(":empId", $formData["empId"], PDO::PARAM_STR);
    $statement->bindParam(":password", $formData["password"], PDO::PARAM_STR);

    if (!$statement->execute()) {
        Response::error("Database error. Please try again later.", 500);
    }

    $data = $statement->fetch(PDO::FETCH_ASSOC);

    if (!$data) {
        Response::error("Invalid empId or password!", 401);
    }

    $payload = [
        "id" => $data["id"],
        "employee_id" => $data["employee_id"],
        "role" => $data["role"],
        "iat" => time(),
        "exp" => time() + (60 * 60 * 24)
    ];

    $token = JwtManager::encodeToken($payload);

    $updateQuery = "UPDATE users SET token = :token WHERE id = :userId";
    $updateStatement = $pdo->prepare($updateQuery);
    $updateStatement->bindParam(":token", $token, PDO::PARAM_STR);
    $updateStatement->bindParam(":userId", $data["id"], PDO::PARAM_INT);

    if (!$updateStatement->execute()) {
        Response::error("Failed to setup authentication.", 500);
    }

    if ($token) {
        Response::success("Login successful!", ["role" => $data["role"], "token" => $token], 200);
    } else {
        Response::error("Token generation failed.", 500);
    }
} catch (Exception $e) {
    Response::error("Internal server error: " . $e->getMessage(), 500);
}
