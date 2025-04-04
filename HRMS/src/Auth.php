<?php

require_once(dirname(__DIR__) . '/vendor/autoload.php');

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$jwtSecret = $_ENV['JWT_SECRET_KEY'];

class JwtManager
{

    public static function encodeToken($payload)
    {
        global $jwtSecret;

        try {
            $token = JWT::encode($payload, $jwtSecret, 'HS256');
            return $token;
        } catch (Exception $e) {
            return null;
        }
    }


    public static function decodeToken($token)
    {
        global $jwtSecret, $pdo;

        try {
            $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
            $decodedArray = (array) $decoded;

            $query = "SELECT token FROM users WHERE id = :userId";
            $statement = $pdo->prepare($query);
            $statement->bindParam(":userId", $decodedArray['id'], PDO::PARAM_INT);
            $statement->execute();

            $user = $statement->fetch(PDO::FETCH_ASSOC);

            if (!$user || !isset($user['token'])) {
                return null;
            }

            if ($user['token'] !== $token) {
                return null;
            }

            return $decodedArray;
        } catch (Exception $e) {
            return null;
        }
    }

    public static function getAuthenticatedUser($token)
    {
        $decodedToken = self::decodeToken($token);

        if (!$decodedToken) {
            return null;
        }

        return $decodedToken;
    }
}
