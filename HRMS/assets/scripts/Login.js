window.addEventListener("pageshow", function () {
    sessionStorage.removeItem("auth_token");
    const roleModal = bootstrap.Modal.getInstance(document.getElementById('roleSelectionModal'));
    if (roleModal) {
        roleModal.hide();
    }
});



$(document).ready(function () {
    let fields = [
        {
            id: "empId",
            type: "input",
            requiredMsg: "Employee ID is required",
        },
        {
            id: "password",
            type: "input",
            pattern:
                /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
            requiredMsg: "Password is required",
            errorMsg:
                "Password must be at least 6 characters, with letters & numbers",
        },
    ];

    function validateField(field) {
        let $element = $("#" + field.id);
        let value = $element.val().trim();
        let $errorElement = $("#" + field.id + "Error");

        if (value === "") {
            showError($element, $errorElement, field.requiredMsg);
            return false;
        } else if (field.pattern && !field.pattern.test(value)) {
            showError($element, $errorElement, field.errorMsg);
            return false;
        } else {
            hideError($element, $errorElement);
            return true;
        }
    }

    function showError($element, $errorElement, message) {
        $element.addClass("is-invalid");
        $errorElement.text(message);
    }

    function hideError($element, $errorElement) {
        $element.removeClass("is-invalid");
        $errorElement.text("");
    }

    fields.forEach((field) => {
        $("#" + field.id).on("input", function () {
            validateField(field);
        });
    });

    $("#loginForm").on("submit", function (event) {
        event.preventDefault();
        let isValid = true;

        fields.forEach((field) => {
            isValid = validateField(field) && isValid;
        });

        if (isValid) {
            let $loginBtn = $("#login");

            $loginBtn
                .prop("disabled", true)
                .html(
                    `<span class="spinner-border spinner-border-sm me-2"></span> Logging in...`
                );

            $.ajax({
                method: "POST",
                url: "/apis/Login.php",
                data: {
                    empId: $("#empId").val().trim(),
                    password: $("#password").val().trim(),
                },
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                dataType: "json",
            })
                .then((response) => {
                    const token = response.data.token;
                    const role = response.data.role;

                    sessionStorage.setItem("auth_token", token);

                    if (role === "admin") {
                        showRoleSelectionModal();
                    } else if (role === "user") {
                        window.location.href = "/user/dashboard.html";
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Login Failed",
                            text: "Invalid role assigned!",
                        });
                    }
                })
                .catch((error) => {
                    let errorMsg = "Login failed! Please try again.";

                    if (error.status === 401) {
                        errorMsg = "Invalid Employee ID or Password!";
                    } else if (error.responseJSON && error.responseJSON.message) {
                        errorMsg = error.responseJSON.message;
                    }

                    Swal.fire({
                        icon: "error",
                        title: "Login Failed",
                        text: errorMsg,
                    });

                    console.log("Login failed:", errorMsg);
                })
                .always(() => {
                    setTimeout(() => {
                        $("#login").prop("disabled", false).html("Login");
                    }, 1000);
                });
        }
    });

    function showRoleSelectionModal() {
        const modal = new bootstrap.Modal(document.getElementById('roleSelectionModal'));
        $('#adminDashboardBtn, #userDashboardBtn').off('click');
        $('#adminDashboardBtn').on('click', function () {
            window.location.href = "/admin/dashboard.html";
        });

        $('#userDashboardBtn').on('click', function () {
            window.location.href = "/user/dashboard.html";
        });
        modal.show();
        $('#roleSelectionModal').modal({
            backdrop: 'static',
            keyboard: false
        });
    }
});

