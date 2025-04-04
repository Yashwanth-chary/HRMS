<?php

class Response{
    public static function success($message="Successful", $data=null, $status=200){
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode(["status"=>$status,"message"=>$message,"data"=>$data]);
        exit;
    }

    public static function error($message="Error Fetching Data", $status=500){
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode(["status"=>$status,"message"=>$message]);
        exit;
    }
}