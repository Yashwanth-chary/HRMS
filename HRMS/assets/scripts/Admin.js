//authorize on page show
window.addEventListener("pageshow", () => {
    if (!sessionStorage.getItem("auth_token")) {
        let timerInterval;
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            html: "Unauthorized! <br> Redirecting in <b></b> seconds...",
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: () => {
                const b = Swal.getHtmlContainer().querySelector("b");
                timerInterval = setInterval(() => {
                    b.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
                }, 100);
            },
            willClose: () => {
                clearInterval(timerInterval);
            },
        }).then(() => {
            window.location.href = "../index.html";
        });
    }
});

$(document).ready(function () {

    //navigation /////////////////////////////////////////////////////////////////////////////////////////////////

    $(".nav-link").click(function (e) {
        e.preventDefault();
        const section = $(this).data("section");
        $(".section").removeClass("active");
        $("#" + section).addClass("active");
        $(".nav-link").removeClass("active");
        $(this).addClass("active");
    });

    //handling logout /////////////////////////////////////////////////////////////////////////////////////////////////
    $("#logout").click(function (e) {
        e.preventDefault();
        sessionStorage.removeItem("auth_token");
        let timerInterval;
        Swal.fire({
            icon: "warning",
            title: "Logout",
            html: "<br> Logging Out in <b></b> seconds...",
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            didOpen: () => {
                const b = Swal.getHtmlContainer().querySelector("b");
                timerInterval = setInterval(() => {
                    b.textContent = Math.ceil(Swal.getTimerLeft() / 1000);
                }, 100);
            },
            willClose: () => {
                clearInterval(timerInterval);
            },
        }).then(() => {
            window.location.href = "../index.html";
        });
    });

    //admin dashboard /////////////////////////////////////////////////////////////////////////////////////////////////
    function fetchDashboardData() {
        $.ajax({
            method: "GET",
            url: "../apis/admin/AdminDashboard.php",
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token"),
            },
            dataType: "json",
            success: function (response) {
                if (response.status === 200) {
                    const data = response.data;
                    $("#dashboardContent").html(`
                                                <div class='row g-4'>
                                                    <!-- First Row -->
                                                    <div class='col-md-6'>
                                                        <div class='card h-100 border-primary'>
                                                            <div class='card-body d-flex align-items-center'>
                                                                <div class='bg-primary bg-opacity-10 pt-4 pb-2 px-3  rounded me-3'>
                                                                    <i class='bi bi-people-fill text-primary fs-2'></i>
                                                                </div>
                                                                <div>
                                                                    <h5 class='card-title text-muted'>Total Employees</h5>
                                                                    <p class='card-text display-6 fw-bold'>${data.totalEmployees}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class='col-md-6'>
                                                        <div class='card h-100 border-success'>
                                                            <div class='card-body d-flex align-items-center'>
                                                                <div class='bg-success bg-opacity-10 pt-4 pb-2 px-3  rounded me-3'>
                                                                    <i class='bi bi-person-check-fill text-success fs-2'></i>
                                                                </div>
                                                                <div>
                                                                    <h5 class='card-title text-muted'>Active Employees</h5>
                                                                    <p class='card-text display-6 fw-bold'>${data.activeEmployees}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Second Row -->
                                                    <div class='col-md-6'>
                                                        <div class='card h-100 border-warning'>
                                                            <div class='card-body d-flex align-items-center'>
                                                                <div class='bg-warning bg-opacity-10 pt-4 pb-2 px-3 rounded me-3'>
                                                                    <i class='bi bi-calendar2-event text-warning fs-2'></i>
                                                                </div>
                                                                <div>
                                                                    <h5 class='card-title text-muted'>Pending Leave Requests</h5>
                                                                    <p class='card-text display-6 fw-bold'>${data.pendingLeaves}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div class='col-md-6'>
                                                        <div class='card h-100 border-danger'>
                                                            <div class='card-body d-flex align-items-center'>
                                                                <div class='bg-danger bg-opacity-10 pt-4 pb-2 px-3  rounded me-3'>
                                                                    <i class='bi bi-cash-coin text-danger fs-2'></i>
                                                                </div>
                                                                <div>
                                                                    <h5 class='card-title text-muted'>Pending Salary Payments</h5>
                                                                    <p class='card-text display-6 fw-bold'>${data.pendingPayments}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            `);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || "Failed to fetch dashboard data."
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error fetching dashboard data.'
                });
            },
        });
    }

    fetchDashboardData();

    // employee management //////////////////////////////////////////////////////////////////

    $("#addEmployeeBtn").click(function () {
        $("#employeeForm")[0].reset();
        $("#employeeId").val('');
        $("#employeeModalLabel").text("Add Employee");
        $("#employeeModal").modal("show");
    });

    const employeeFormFields = [
        {
            id: "name",
            pattern: /^[a-zA-Z ]{3,50}$/,
            requiredMsg: "Full name is required",
            errorMsg: "Name must be 3-50 alphabetic characters"
        },
        {
            id: "dob",
            validate: function (value) {
                if (!value) return false;
                const dob = new Date(value);
                const today = new Date();
                const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                return dob <= minAgeDate;
            },
            requiredMsg: "Date of birth is required",
            errorMsg: "Employee must be at least 18 years old"
        },
        {
            id: "doj",
            validate: function (value) {
                if (!value) return false;
                const doj = new Date(value);
                const dob = new Date($("#dob").val());
                return doj >= dob;
            },
            requiredMsg: "Date of joining is required",
            errorMsg: "Joining date cannot be before birth date"
        },
        {
            id: "phone",
            pattern: /^[0-9]{10}$/,
            requiredMsg: "Phone number is required",
            errorMsg: "Phone must be 10 digits"
        },
        {
            id: "designation",
            pattern: /^[a-zA-Z ]{3,50}$/,
            requiredMsg: "Designation is required",
            errorMsg: "Designation must be 3-50 characters"
        },
        {
            id: "department",
            pattern: /^[a-zA-Z ]{3,50}$/,
            requiredMsg: "Department is required",
            errorMsg: "Department must be 3-50 characters"
        }
    ];

    function validateField(field) {
        const $element = $("#" + field.id);
        const value = $element.val().trim();
        const $errorElement = $("#" + field.id + "Error");

        if (value === "") {
            showError($element, $errorElement, field.requiredMsg);
            return false;
        } else if (field.pattern && !field.pattern.test(value)) {
            showError($element, $errorElement, field.errorMsg);
            return false;
        } else if (field.validate && !field.validate(value)) {
            showError($element, $errorElement, field.errorMsg);
            return false;
        } else {
            hideError($element, $errorElement);
            return true;
        }
    }

    function showError($element, $errorElement, message) {
        $element.addClass("is-invalid");
        $errorElement.text(message).show();
    }

    function hideError($element, $errorElement) {
        $element.removeClass("is-invalid");
        $errorElement.text("").hide();
    }

    employeeFormFields.forEach((field) => {
        $("#" + field.id).on("input blur", function () {
            validateField(field);
        });
    });

    $("#employeeForm").submit(function (e) {
        e.preventDefault();

        let isValid = true;
        employeeFormFields.forEach((field) => {
            isValid = validateField(field) && isValid;

        });

        if (!isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please correct the errors in the form'
            });
            return;
        }

        const formData = $(this).serialize();
        const url = $("#employeeId").val() ? "../apis/admin/UpdateEmployee.php" : "../apis/admin/AddEmployee.php";
        $("#saveEmployeeBtn").prop("disabled", true);

        $.ajax({
            type: "POST",
            url: url,
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token"),
            },
            data: formData,
            success: function (response) {
                $("#saveEmployeeBtn").prop("disabled", false);
                if (response.status === 200) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message || "Employee saved successfully!"
                    });
                    $("#employeeModal").modal("hide");
                    loadEmployees();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || "Failed to save employee."
                    });
                }
            },
            error: function (xhr) {
                $("#saveEmployeeBtn").prop("disabled", false);
                let errorMsg = 'Error saving employee.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg
                });
            }
        });
    });

    $("#employeeModal").on("hidden.bs.modal", function () {
        employeeFormFields.forEach((field) => {
            const $element = $("#" + field.id);
            const $errorElement = $("#" + field.id + "Error");
            hideError($element, $errorElement);
        });
        $("#employeeForm")[0].reset();
        $("#employeeId").val("");
        $("#saveEmployeeBtn").prop("disabled", false);
    });




    function loadEmployees() {
        $.ajax({
            type: "GET",
            url: "../apis/admin/FetchEmployeesEmpMng.php",
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token"),
            },
            success: function (response) {
                if (response.status === 200) {
                    allEmployees = response.data;
                    let tableHtml = `
                                    <table class='table table-bordered table-hover'>
                                        <thead>
                                            <tr>
                                                <th><i class="bi bi-person-badge me-1"></i> ID</th>
                                                <th><i class="bi bi-person me-1"></i> Name</th>
                                                <th><i class="bi bi-calendar me-1"></i>  DOB</th>
                                                <th><i class="bi bi-calendar me-1"></i> DOJ</th>
                                                <th><i class="bi bi-telephone me-1"></i> Phone</th>
                                                <th><i class="bi bi-briefcase me-1"></i> Designation</th>
                                                <th><i class="fa fa-building me-1"></i> Department</th>
                                                <th><i class="bi bi-gear me-1"></i> Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                `;

                    allEmployees.forEach(employee => {
                        tableHtml += `
                                    <tr>
                                        <td>${employee.id}</td>
                                        <td>${employee.name}</td>
                                        <td>${employee.dob}</td>
                                        <td>${employee.doj}</td>
                                        <td>${employee.phone}</td>
                                        <td>${employee.designation}</td>
                                        <td>${employee.department}</td>
                                        <td>
                                            <button class='btn btn-sm btn-primary edit-employee' data-id='${employee.id}'>Edit</button>
                                        </td>
                                    </tr>
                                `;
                    });

                    tableHtml += "</tbody></table>";
                    $("#employeeTable").html(tableHtml);

                    $(".edit-employee").click(function () {
                        const employeeId = $(this).data("id");

                        const employee = allEmployees.find(emp => emp.id == employeeId);

                        if (employee) {
                            $("#editEmployeeId").val(employee.id);
                            $("#editName").val(employee.name);
                            $("#editDOB").val(employee.dob);
                            $("#editDOJ").val(employee.doj);
                            $("#editPhone").val(employee.phone);
                            $("#editDesignation").val(employee.designation);
                            $("#editDepartment").val(employee.department);

                            $("#editEmployeeModal").modal("show");
                        } else {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Not Found',
                                text: 'Employee not found.'
                            });
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to load employees.'
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error fetching employees.'
                });
            },
        });
    }


    loadEmployees();


    // edit employee with validation
    const employeeFields = [
        {
            id: "editName",
            pattern: /^[a-zA-Z ]{3,50}$/,
            requiredMsg: "Full name is required",
            errorMsg: "Name must be 3-50 alphabetic characters"
        },
        {
            id: "editDOB",
            validate: function (value) {
                if (!value) return false;
                const dob = new Date(value);
                const today = new Date();
                const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                return dob <= minAgeDate;
            },
            requiredMsg: "Date of birth is required",
            errorMsg: "Employee must be at least 18 years old"
        },
        {
            id: "editDOJ",
            validate: function (value) {
                if (!value) return false;
                const doj = new Date(value);
                const dob = new Date($("#editDOB").val());
                return doj >= dob;
            },
            requiredMsg: "Date of joining is required",
            errorMsg: "Joining date cannot be before birth date"
        },
        {
            id: "editPhone",
            pattern: /^[0-9]{10}$/,
            requiredMsg: "Phone number is required",
            errorMsg: "Phone must be 10 digits"
        },
        {
            id: "editDesignation",
            pattern: /^[a-zA-Z ]{3,50}$/,
            requiredMsg: "Designation is required",
            errorMsg: "Designation must be 3-50 characters"
        },
        {
            id: "editDepartment",
            pattern: /^[a-zA-Z ]{3,50}$/,
            requiredMsg: "Department is required",
            errorMsg: "Department must be 3-50 characters"
        }
    ];

    employeeFields.forEach((field) => {
        $("#" + field.id).on("input", function () {
            validateField(field);
        });
    });

    $("#updateEmployeeForm").submit(function (e) {
        e.preventDefault();

        let isValid = true;
        employeeFields.forEach((field) => {
            isValid = validateField(field) && isValid;
        });

        if (!isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please correct the errors in the form'
            });
            return;
        }

        const formData = $(this).serialize();

        $.ajax({
            type: "POST",
            url: "../apis/admin/UpdateEmployee.php",
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token"),
            },
            data: formData,
            success: function (response) {
                if (response.status === 200) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Employee updated successfully!'
                    });
                    $("#editEmployeeModal").modal("hide");
                    loadEmployees();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || "Failed to update employee."
                    });
                }
            },
            error: function (xhr) {
                let errorMsg = 'Error updating employee.';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg
                });
            }
        });
    });

    $("#editEmployeeModal").on("hidden.bs.modal", function () {
        employeeFields.forEach((field) => {
            const $element = $("#" + field.id);
            const $errorElement = $("#" + field.id + "Error");
            hideError($element, $errorElement);
        });
    });




    // earning and deductions /////////////////////////////////////////////////////////////////////////////////////////////////
    //fetching list on E&D page
    function fetchEmployeeSalaryList() {
        $.ajax({
            url: '../apis/admin/FetchEmployeesEmpMng.php',
            method: 'GET',
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token")
            },
            dataType: "json",
            success: function (response) {
                if (response.status === 200) {

                    employeeData = response.data;
                    renderEmployeeTable(employeeData);
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'Message',
                        text: response.message
                    });
                }
            },
            error: function (xhr) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch employee salary data. Status: ' + xhr.status
                });
            }
        });
    }

    function renderEmployeeTable(data) {
        let tableContent = '';

        data.forEach(employee => {
            tableContent += `<tr>
                                <td>${employee.id}</td>
                                <td>${employee.name}</td>
                                <td>${employee.department}</td>
                                <td>
                                    <button class="btn btn-warning btn-sm edit-eAndD" data-id="${employee.id}">Manage Earnings & Deductions</button>
                                </td>
                            </tr>
                            `;
        });

        $('#employeeSalaryTable').html(tableContent);
    }

    //filter for E&D table
    function filterEmployees() {
        const idFilter = $('#filterById').val().toLowerCase();
        const nameFilter = $('#filterByName').val().toLowerCase();
        const departmentFilter = $('#filterByDepartment').val().toLowerCase();

        const filteredData = employeeData.filter(employee => {
            const matchesId = employee.id.toString().toLowerCase().includes(idFilter);
            const matchesName = employee.name.toLowerCase().includes(nameFilter);
            const matchesDepartment = employee.department.toLowerCase().includes(departmentFilter);

            return matchesId && matchesName && matchesDepartment;
        });

        renderEmployeeTable(filteredData);
    }

    fetchEmployeeSalaryList();

    $('#filterById, #filterByName, #filterByDepartment').on('input', filterEmployees);

    //trigger modal
    $(document).on('click', '.edit-eAndD', function () {
        const employeeId = $(this).data('id');
        $('#earningsDeductionsModal').data('employeeId', employeeId).modal('show');
        loadEmployeeDetails(employeeId);
        fetchEarningDeductions();
        $('#selectMonth').val('');
        $('#earningsTable tbody').empty();
        $('#deductionsTable tbody').empty();
    });


    // E&D master
    function fetchEarningDeductions() {
        $.ajax({
            url: '../apis/admin/GetEarningDeductionMaster.php',
            method: 'GET',
            headers: { Authorization: "Bearer " + sessionStorage.getItem("auth_token") },
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    // console.log(response)
                    earningDeductions = response.data;
                }
            }
        });
    }
    fetchEarningDeductions();


    let days = 0;
    let totalLeaves = 0;


    function loadCurrentMonthEarningsDeductions(employeeId) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
        const formattedDate = `${currentYear}-${currentMonth}`;

        $('#earningsDeductionsModal').on('shown.bs.modal', function () {
            $('#selectMonth').val(formattedDate);

            fetchExistingEarningsDeductions(employeeId, currentMonth, currentYear);
        });
    }



    // Fetch existing earnings and deductions
    function fetchExistingEarningsDeductions(employeeId, month, year) {
        $.ajax({
            url: '../apis/admin/GetEmpEarningDeductions.php',
            method: 'POST',
            headers: { Authorization: "Bearer " + sessionStorage.getItem("auth_token") },
            contentType: 'application/json',
            data: JSON.stringify({ employeeId, month: parseInt(month), year: parseInt(year) }),
            success: function (response) {
                if (response.status === 200) {
                    const { earnings, deductions, salary_paid } = response.data;
                    days = new Date(year, month, 0).getDate();

                    getLeaves(employeeId, month, year, function (leaves) {
                        totalLeaves = leaves;
                        populateTables(earnings, deductions, days, totalLeaves, salary_paid);
                    });
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'Message',
                        text: response.message
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch data.'
                });
            }
        });
    }

    $('#selectMonth').change(function () {
        const employeeId = $('#earningsDeductionsModal').data('employeeId');
        const monthYear = $('#selectMonth').val();

        if (monthYear) {
            const [year, month] = monthYear.split('-');
            fetchExistingEarningsDeductions(employeeId, month, year);
        }
    });

    $('#earningsDeductionsModal').on('show.bs.modal', function (event) {
        const employeeId = $(this).data('employeeId');
        loadCurrentMonthEarningsDeductions(employeeId);
    });



    function getLeaves(employeeId, month, year, callback) {
        $.ajax({
            url: '../apis/admin/FetchEmployeeLeaves.php',
            method: 'POST',
            headers: { Authorization: "Bearer " + sessionStorage.getItem("auth_token") },
            contentType: 'application/json',
            data: JSON.stringify({ employeeId, month: parseInt(month), year: parseInt(year) }),
            success: function (response) {
                if (response.status === 200) {
                    const totalLeaves = response.data.totalLeaves || 0;
                    console.log("Total Leave Deductions: ", totalLeaves);
                    if (typeof callback === "function") {
                        callback(totalLeaves);
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'An error occurred while fetching leaves.'
                    });
                    if (typeof callback === "function") callback(0);
                }
            },
            error: function (jqXHR) {
                let errorMessage = 'Failed to fetch leave data.';
                if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    errorMessage = jqXHR.responseJSON.message;
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage
                });
                if (typeof callback === "function") callback(0);
            }
        });
    }

    function populateTables(earnings, deductions, days, totalLeaves, salary_paid) {
        $('#earningsTable tbody').empty();
        $('#deductionsTable tbody').empty();

        let totalEarnings = 0;
        let totalDeductions = 0;

        earnings.forEach(item => {
            if (salary_paid) {
                $('#earningsTable tbody').append(`
                    <tr>
                        <td>${getDescriptionById(item.earning_deduction_id)}</td>
                        <td class="text-end">${parseFloat(item.amount).toFixed(2)}</td>
                        <td></td>
                    </tr>
                `);
            } else {
                addRow('earning', item);
            }
            totalEarnings += parseFloat(item.amount);
        });

        deductions.forEach(item => {
            if (salary_paid) {
                $('#deductionsTable tbody').append(`
                    <tr>
                        <td>${getDescriptionById(item.earning_deduction_id)}</td>
                        <td class="text-end">${parseFloat(item.amount).toFixed(2)}</td>
                        <td></td>
                    </tr>
                `);
            } else {
                addRow('deduction', item);
            }
            totalDeductions += parseFloat(item.amount);
        });

        let totalLeaveDeductions = totalEarnings / days * totalLeaves;
        const netSalary = totalEarnings - totalDeductions - totalLeaveDeductions;

        $('#totalEarnings').text(totalEarnings.toFixed(2));
        $('#totalDeductions').text(totalDeductions.toFixed(2));
        $('#totalLeaveDeductions').text(totalLeaveDeductions.toFixed(2));
        $('#netSalary').text(netSalary.toFixed(2));

        if (salary_paid) {
            $("#saveEarningsDeductions").prop("disabled", true).hide();
            $("#addEarning, #addDeduction").remove();
            $("#salaryStatus").addClass("text-danger").text("Salary Paid - No Changes Allowed");
        } else {
            $("#salaryStatus").removeClass("text-danger").text("Not Paid");

            $(document)
                .off('input', '.earning-amount, .deduction-amount')
                .on('input', '.earning-amount, .deduction-amount', function () {
                    const type = $(this).hasClass('earning-amount') ? 'earning' : 'deduction';
                    const errorDisplay = $(this).siblings(`.${type}-error`);
                    validateAmountInput(this, errorDisplay);
                    calculateTotals(days, totalLeaves);
                });

            $(document)
                .off('click', '.remove-row')
                .on('click', '.remove-row', function () {
                    $(this).closest('tr').remove();
                    calculateTotals(days, totalLeaves);
                });
        }
    }

    function getDescriptionById(id) {
        const item = earningDeductions.find(item => item.id == id);
        return item ? item.description : 'Unknown';
    }


    function calculateTotals(days, totalLeaves) {
        let totalEarnings = 0;
        let totalDeductions = 0;

        $('#earningsTable .earning-amount').each(function () {
            const value = parseFloat($(this).val()) || 0;
            totalEarnings += value;
        });

        $('#deductionsTable .deduction-amount').each(function () {
            const value = parseFloat($(this).val()) || 0;
            totalDeductions += value;
        });

        let totalLeaveDeductions = (totalEarnings / days) * totalLeaves;
        const netSalary = totalEarnings - totalDeductions - totalLeaveDeductions;

        $('#totalEarnings').text(totalEarnings.toFixed(2));
        $('#totalDeductions').text(totalDeductions.toFixed(2));
        $('#totalLeaveDeductions').text(totalLeaveDeductions.toFixed(2));
        $('#netSalary').text(netSalary.toFixed(2));
    }


    function addRow(type, data = null) {
        const selectedIds = $(`#${type === 'earning' ? 'earningsTable' : 'deductionsTable'} tbody select`)
            .map(function () { return parseInt($(this).val()); })
            .get();

        const options = earningDeductions
            .filter(item =>
                item.type === (type === 'earning' ? 0 : 1) &&
                (!selectedIds.includes(item.id) || (data && data.earning_deduction_id == item.id))
            )
            .map(item => `<option value="${item.id}" ${data && data.earning_deduction_id == item.id ? 'selected' : ''}>${item.description}</option>`)
            .join('');

        if (!options) {
            Swal.fire({
                icon: 'warning',
                title: 'No More Available',
                text: `No more ${type === 'earning' ? 'Earnings' : 'Deductions'} available to add.`
            });
            return;
        }

        const row = `
            <tr>
                <td>
                    <select class="form-control ${type === 'earning' ? 'earning-select' : 'deduction-select'}">
                        ${options}
                    </select>
                </td>
                <td>
                    <input type="number" 
                           class="form-control ${type === 'earning' ? 'earning-amount' : 'deduction-amount'}" 
                           min="0" 
                           max="999999" 
                           step="0.01" 
                           value="${data ? parseFloat(data.amount).toFixed(2) : ''}"
                           placeholder="0.00">
                    <div class="invalid-feedback ${type}-error"></div>
                </td>
                <td>
                    <button class="btn btn-danger btn-sm remove-row">Remove</button>
                </td>
            </tr>
        `;

        $(`#${type === 'earning' ? 'earningsTable' : 'deductionsTable'} tbody`).append(row);

        // Get references to the newly added elements
        const amountInput = $(`.${type === 'earning' ? 'earning-amount' : 'deduction-amount'}`).last();
        const errorDisplay = $(`.${type}-error`).last();

        amountInput.on('input', function () {
            validateAmountInput(this, errorDisplay);
            calculateTotals(days, totalLeaves);
        });

        validateAmountInput(amountInput[0], errorDisplay);

        $('.remove-row').off('click').on('click', function () {
            $(this).closest('tr').remove();
            calculateTotals(days, totalLeaves);
        });
    }

    function validateAmountInput(input, errorDisplay) {
        const value = parseFloat($(input).val());
        let isValid = true;
        let errorMessage = '';

        if (isNaN(value) || value < 0) {
            isValid = false;
            errorMessage = 'Amount must be a positive number';
        } else if (value > 999999) {
            isValid = false;
            errorMessage = 'Amount cannot exceed ₹9,99,999';
        }

        if (isValid) {
            $(input).removeClass('is-invalid');
            errorDisplay.text('').hide();
        } else {
            $(input).addClass('is-invalid');
            errorDisplay.text(errorMessage).show();
        }

        return isValid;
    }


    $('#addEarning').click(() => {
        addRow('earning');
        calculateTotals();
    });

    $('#addDeduction').click(() => {
        addRow('deduction');
        calculateTotals();
    });


    $(document).on('click', '.remove-row', function () {
        $(this).closest('tr').remove();
    });

    //save Emp E&D
    $('#saveEarningsDeductions').click(function (e) {

        e.preventDefault();

        let allValid = true;
        $('.earning-amount, .deduction-amount').each(function () {
            const type = $(this).hasClass('earning-amount') ? 'earning' : 'deduction';
            const errorDisplay = $(this).siblings(`.${type}-error`);
            if (!validateAmountInput(this, errorDisplay)) {
                allValid = false;
            }
        });

        if (!allValid) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please correct the invalid amounts (must be between 0 and 999999)'
            });
            return;
        }


        calculateTotals(days, totalLeaves);

        const totalEarnings = parseFloat($('#totalEarnings').text()) || 0;
        const totalDeductions = parseFloat($('#totalDeductions').text()) || 0;
        const totalLeaveDeductions = parseFloat($('#totalLeaveDeductions').text()) || 0;
        const netSalary = parseFloat($('#netSalary').text()) || 0;

        if (totalEarnings < totalDeductions) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Total Earnings cannot be less than Total Deductions'
            });
            return;
        }

        if (netSalary < 0) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Net Salary cannot be negative. Please adjust your amounts.'
            });
            return;
        }



        const employeeId = $('#earningsDeductionsModal').data('employeeId');
        const monthYear = $('#selectMonth').val();

        if (!monthYear) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Selection',
                text: 'Please select a valid month and year.'
            });
            return;
        }

        const [year, month] = monthYear.split('-');
        // console.log(($('#netSalary').text()))

        let earnings = [];
        $('#earningsTable tbody tr').each(function () {
            const descriptionId = $(this).find('.earning-select').val();
            const amount = parseFloat($(this).find('.earning-amount').val());

            if (descriptionId && amount) {
                earnings.push({ earning_deduction_id: parseInt(descriptionId), amount: amount });
            }
        });

        let deductions = [];
        $('#deductionsTable tbody tr').each(function () {
            const descriptionId = $(this).find('.deduction-select').val();
            const amount = parseFloat($(this).find('.deduction-amount').val());

            if (descriptionId && amount) {
                deductions.push({ earning_deduction_id: parseInt(descriptionId), amount: amount });
            }
        });

        // console.log(parseFloat($('#netSalary').text()))


        $.ajax({
            url: '../apis/admin/saveEmpEarningDeductions.php',
            method: 'POST',
            headers: { Authorization: "Bearer " + sessionStorage.getItem("auth_token") },
            contentType: 'application/json',
            data: JSON.stringify({
                employeeId: employeeId,
                month: parseInt(month),
                year: parseInt(year),
                earnings: earnings,
                deductions: deductions,
                netSalary: parseFloat($('#netSalary').text())
            }),
            success: function (response) {
                if (response.status === 200) {
                    console.log(response)

                    Swal.fire({
                        icon: 'info',
                        title: 'Message',
                        text: response.message
                    });
                    $('#earningsDeductionsModal').modal('hide');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Error saving payslip: ' + response.message
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to save payslip.'
                });
            }
        });

    });

    //new E&D description
    $('#addComponent').click(function () {
        const type = $('#componentType').val();
        const description = $('#componentDescription').val().trim();

        if (!description) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Input',
                text: 'Please enter a valid component description.'
            });
            return;
        }

        $.ajax({
            url: '../apis/admin/AddEarningDeductionComponent.php',
            method: 'POST',
            headers: { Authorization: "Bearer " + sessionStorage.getItem("auth_token") },
            data: JSON.stringify({
                type: parseInt(type),
                description: description
            }),
            contentType: 'application/json',
            success: function (response) {
                if (response.status === 200) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: 'Component added successfully!'
                    });
                    fetchEarningDeductions();
                    $('#componentDescription').val('');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message || 'Failed to add component.'
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while adding the component.'
                });
            }
        });
    });


    //add employee details in E&D modal
    function loadEmployeeDetails(employeeId) {
        $.ajax({
            type: "GET",
            url: "../apis/admin/FetchEmployeesEmpMng.php",
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token"),
            },
            success: function (response) {
                if (response.status === 200) {
                    const employee = response.data.find(emp => emp.id == employeeId);
                    if (employee) {
                        $("#employeeID").text(employee.id);
                        $("#employeeName").text(employee.name);
                        $("#employeeDOB").text(employee.dob);
                        $("#employeeDOJ").text(employee.doj);
                        $("#employeePhone").text(employee.phone);
                        $("#employeeDesignation").text(employee.designation);
                        $("#employeeDepartment").text(employee.department);

                    } else {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Not Found',
                            text: 'Employee not found.'
                        });
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to load employee details.'
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error fetching employee details.'
                });
            },
        });
    }


    //load payslips /////////////////////////////////////////////////////////////////////////////////////////////////
    let allSalaryData = [];

    // Fetch salaries from server
    function fetchSalaries() {
        $.ajax({
            url: '../apis/admin/GetSalaries.php',
            method: 'GET',
            headers: { Authorization: "Bearer " + sessionStorage.getItem("auth_token") },
            success: function (response) {
                if (response.status === 200) {
                    allSalaryData = response.data;
                    displaySalaries(response.data);
                    setupFilterEventListeners();
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'Message',
                        text: response.message
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch salaries.'
                });
            }
        });
    }

    // Display salaries in the table
    function displaySalaries(salaries) {
        let html = '';
        if (salaries.length === 0) {
            html = '<div class="alert alert-info">No salary records found.</div>';
        } else {
            html = `<table class="table table-bordered table-hover">
                        <thead>
                            <tr>
                                <th><i class="bi bi-hash me-1"></i>Salary ID</th>
                                <th><i class="bi bi-person me-1"></i>Employee ID</th>
                                <th><i class="bi bi-calendar-month me-1"></i>Month</th>
                                <th><i class="bi bi-calendar-month me-1"></i>Year</th>
                                <th><i class="bi bi-cash-coin me-1"></i>Net Salary</th>
                                <th><i class="bi bi-check-circle me-1"></i>Status</th>
                                <th><i class="bi bi-calendar me-1"></i>Generated On</th>
                                <th><i class="bi bi-gear me-1"></i>Actions</th>
                            </tr>
                        </thead>
                        <tbody>`;

            salaries.forEach(salary => {
                const isPaid = salary.salary_paid;
                const statusBadge = isPaid ?
                    '<span class="badge bg-success px-4 pt-2">Paid</span>' :
                    '<span class="badge bg-warning px-3 pt-2">Not Paid</span>';

                html += `<tr>
                        <td>${salary.id}</td>
                        <td>${salary.employee_id}</td>
                        <td>${getMonthName(salary.month)}</td>
                        <td>${salary.year}</td>
                        <td>₹${parseFloat(salary.net_salary).toFixed(2)}</td>
                        <td>${statusBadge}</td>
                        <td>${formatDate(salary.created_at)}</td>
                        <td>
                            <button class="btn btn-info btn-sm preview-btn pt-2" 
                                data-employee-id="${salary.employee_id}" 
                                data-id="${salary.id}" 
                                data-month="${salary.month}" 
                                data-year="${salary.year}">
                                <i class="bi bi-eye"></i> Preview
                            </button>
                            ${!isPaid ?
                        `<button class="btn btn-success btn-sm approve-btn ms-0 ms-lg-1 mt-1 mt-lg-0 pt-2" 
                                data-employee-id="${salary.employee_id}" 
                                data-id="${salary.id}" 
                                data-month="${salary.month}" 
                                data-year="${salary.year}">
                                <i class="bi bi-check-circle"></i> Approve
                            </button>`
                        : ''
                    }
                        </td>
                    </tr>`;
            });

            html += '</tbody></table>';
        }
        $('#salaryTable').html(html);

        attachSalaryActionHandlers();
    }

    function setupFilterEventListeners() {
        $('#payslipSearch, #payslipMonthFilter, #payslipYearFilter, #payslipStatusFilter').on('input change', function () {
            filterSalaries();
        });
    }

    function filterSalaries() {
        const searchTerm = $('#payslipSearch').val().toLowerCase();
        const monthFilter = $('#payslipMonthFilter').val();
        const yearFilter = $('#payslipYearFilter').val();
        const statusFilter = $('#payslipStatusFilter').val();

        const filteredData = allSalaryData.filter(salary => {
            const searchMatch =
                !searchTerm ||
                salary.id.toString().includes(searchTerm) ||
                salary.employee_id.toString().includes(searchTerm);

            const monthMatch = !monthFilter || salary.month.toString() === monthFilter;

            const yearMatch = !yearFilter || salary.year.toString() === yearFilter;

            const statusMatch =
                !statusFilter ||
                (statusFilter === 'paid' && salary.salary_paid) ||
                (statusFilter === 'pending' && !salary.salary_paid);

            return searchMatch && monthMatch && yearMatch && statusMatch;
        });

        displaySalaries(filteredData);
    }

    function attachSalaryActionHandlers() {
        $('.preview-btn').click(function () {
            const employeeId = $(this).data('employee-id');
            const salaryId = $(this).data('id');
            const month = $(this).data('month');
            const year = $(this).data('year');
            previewSalary(employeeId, salaryId, month, year);
        });

        $('.approve-btn').click(function () {
            const employeeId = $(this).data('employee-id');
            const salaryId = $(this).data('id');
            const month = $(this).data('month');
            const year = $(this).data('year');
            approveSalary(employeeId, salaryId, month, year);
        });
    }

    function getMonthName(monthNumber) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[monthNumber - 1] || monthNumber;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN');
    }

    fetchSalaries();

    // approve salary
    async function approveSalary(employeeId, salaryId, month, year) {
        try {
            Swal.fire({
                icon: 'warning',
                title: 'Are you sure?',
                text: `Are you sure you want to approve salary for Employee ID: ${employeeId}, Month: ${month}, Year: ${year}?`,
                confirmButtonText: 'OK'
            }).then((result) => {
                if (!result.isConfirmed) return;

            });


            const approveBtn = $(`.approve-btn[data-id="${salaryId}"]`);
            approveBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status"></span> Approving...');

            const response = await $.ajax({
                url: '../apis/admin/ApproveSalary.php',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    employeeId: employeeId,
                    salaryId: salaryId,
                    month: parseInt(month),
                    year: parseInt(year)
                })
            });

            if (response.status === 200) {
                console.log(response)
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Salary approved successfully!'
                });
                fetchSalaries();
            } else {
                throw new Error(response.message || 'Failed to approve salary');
            }

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error: ' + error.message
            });

            const approveBtn = $(`.approve-btn[data-id="${salaryId}"]`);
            approveBtn.prop('disabled', false).text('Approve');
        }
    }


    // preview salary
    let earningDeductionMaster = {};

    function loadEarningDeductionMaster() {
        $.ajax({
            url: '../apis/admin/GetEarningDeductionMaster.php',
            method: 'GET',
            headers: { Authorization: "Bearer " + sessionStorage.getItem("auth_token") },
            dataType: 'json',
            success: function (response) {
                response.data.forEach(item => {
                    earningDeductionMaster[item.id] = item.description;
                });
                console.log(earningDeductionMaster)
            }
        });
    }

    loadEarningDeductionMaster()

    async function previewSalary(employeeId, salaryId, month, year) {
        try {
            $('#salarySlipModal').modal('show');
            $('#previewET').html('<tr><td colspan="2">Loading earnings...</td></tr>');
            $('#previewDT').html('<tr><td colspan="2">Loading deductions...</td></tr>');
            $('#previewNS').html('<div class="text-center"><div class="spinner-border text-primary" role="status"></div></div>');

            if (Object.keys(earningDeductionMaster).length === 0) {
                await loadEarningDeductionMaster();
            }
            previewED(employeeId);

            const salaryResponse = await $.ajax({
                url: '../apis/admin/GetEmpEarningDeductions.php',
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}` },
                data: JSON.stringify({
                    employeeId: employeeId,
                    month: parseInt(month),
                    year: parseInt(year)
                }),
                contentType: 'application/json'
            });

            console.log('Salary response:', salaryResponse);

            if (salaryResponse.status !== 200) {
                throw new Error(salaryResponse.message || 'Failed to fetch salary data');
            }

            const { earnings, deductions, salary_paid } = salaryResponse.data;

            const leaves = await new Promise((resolve, reject) => {
                getLeaves(employeeId, month, year, function (leaves) {
                    resolve(leaves);
                });
            });

            const daysInMonth = new Date(year, month, 0).getDate();
            const totalEarnings = earnings.reduce((sum, item) => sum + parseFloat(item.amount), 0);
            const perDaySalary = totalEarnings / daysInMonth;
            const leaveDeductions = perDaySalary * leaves;

            let earningsHTML = '';
            if (earnings && earnings.length > 0) {
                earnings.forEach(item => {
                    const amount = parseFloat(item.amount);
                    const description = earningDeductionMaster[item.earning_deduction_id] ||
                        `Earning (ID: ${item.earning_deduction_id})`;

                    earningsHTML += `
                                <tr>
                                    <td>${description}</td>
                                    <td class="text-end">₹${amount.toFixed(2)}</td>
                                </tr>
                            `;
                });

                earningsHTML += `
                                <tr class="table-active fw-bold">
                                    <td>Total Earnings</td>
                                    <td class="text-end">₹${totalEarnings.toFixed(2)}</td>
                                </tr>
                            `;
            } else {
                earningsHTML = '<tr><td colspan="2" class="text-center">No earnings found</td></tr>';
            }

            let deductionsHTML = '';
            let totalDeductions = 0;

            if (deductions && deductions.length > 0) {
                deductions.forEach(item => {
                    const amount = parseFloat(item.amount);
                    totalDeductions += amount;
                    const description = earningDeductionMaster[item.earning_deduction_id] ||
                        `Deduction (ID: ${item.earning_deduction_id})`;

                    deductionsHTML += `
                                <tr>
                                    <td>${description}</td>
                                    <td class="text-end">₹${amount.toFixed(2)}</td>
                                </tr>
                            `;
                });

                deductionsHTML += `
                                <tr>
                                    <td>Leave Deductions (${leaves} days)</td>
                                    <td class="text-end">₹${leaveDeductions.toFixed(2)}</td>
                                </tr>
                            `;

                totalDeductions += leaveDeductions;

                deductionsHTML += `
                                <tr class="table-active fw-bold">
                                    <td>Total Deductions</td>
                                    <td class="text-end">₹${totalDeductions.toFixed(2)}</td>
                                </tr>
                            `;
            } else {
                deductionsHTML = `
                                <tr>
                                    <td>Leave Deductions (${leaves} days)</td>
                                    <td class="text-end">₹${leaveDeductions.toFixed(2)}</td>
                                </tr>
                                <tr class="table-active fw-bold">
                                    <td>Total Deductions</td>
                                    <td class="text-end">₹${leaveDeductions.toFixed(2)}</td>
                                </tr>
                            `;
                totalDeductions = leaveDeductions;
            }

            const netSalary = totalEarnings - totalDeductions;
            const statusBadge = salary_paid ?
                '<span class="badge bg-success">Paid</span>' :
                '<span class="badge bg-warning">Pending</span>';

            $('#salaryMonthYear').html(`<div class="text-muted small mt-1 d-inline">
                                             ${getMonthName(month)} ${year}
                                        </div>`)
            $('#previewET').html(earningsHTML);
            $('#previewDT').html(deductionsHTML);
            $('#previewNS').html(`
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fs-4 fw-bold">₹${netSalary.toFixed(2)}</span>
                                    ${statusBadge}
                                </div>
                                <div class="text-muted small mt-1">
                                    For ${getMonthName(month)} ${year}
                                </div>
                                <div class="small text-muted mt-2">
                                    ${daysInMonth} working days | ${leaves} leave(s) deducted
                                </div>
                            `);

        } catch (error) {
            console.error('Error generating salary slip:', error);
            $('#salarySlipModal').modal('hide');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error: ${error.message}`
            });
        }
    }

    function getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month - 1] || '';
    }




    async function previewED(employeeId) {
        try {
            $('#empName').html('<span class="spinner-border spinner-border-sm" role="status"></span> Loading...');
            $('#empDesignation').text('Loading...');
            $('#empDepartment').text('Loading...');
            $('#empDOJ').text('Loading...');
            $('#empDOB').text('Loading...');

            const response = await $.ajax({
                url: '../apis/admin/FetchEmployeesEmpMng.php',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json'
                },
                data: { id: employeeId }
            });

            if (response.status !== 200) {
                throw new Error(response.message || 'Failed to fetch employee details');
            }
            console.log(response)
            const employee = response.data.find(emp => emp.id == employeeId);

            if (!employee) {
                throw new Error('Employee not found');
            }

            const formatDate = (dateString) => {
                if (!dateString) return 'N/A';
                const date = new Date(dateString);
                return date.toLocaleDateString('en-IN');
            };

            $('#empName').text(employee.name || 'N/A');
            $('#empDesignation').text(employee.designation || 'N/A');
            $('#empDepartment').text(employee.department || 'N/A');
            $('#empDOJ').text(formatDate(employee.doj));
            $('#empDOB').text(formatDate(employee.dob));

        } catch (error) {
            console.error('Error loading employee details:', error);

            $('#empName').text('Error loading details');
            $('#empDesignation').text('N/A');
            $('#empDepartment').text('N/A');
            $('#empDOJ').text('N/A');
            $('#empDOB').text('N/A');

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load employee details'
            });
        }
    }




    // leaves /////////////////////////////////////////////////////////////////////////////////////////////////
    let allLeavesData = [];

    function loadLeaves() {
        $.ajax({
            type: "GET",
            url: "../apis/admin/FetchLeaves.php",
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token"),
            },
            success: function (response) {
                const data = typeof response === "string" ? JSON.parse(response) : response;

                if (data.status === 200) {
                    allLeavesData = data.data;
                    renderLeavesTable(data.data);
                    setupLeaveFilters();
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'Message',
                        text: data.message
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error fetching leave requests!'
                });
            },
        });
    }

    function renderLeavesTable(leaves) {
        let leavesHtml = `<table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th><i class="bi bi-hash me-1"></i>ID</th>
                        <th><i class="bi bi-person me-1"></i>Employee ID</th>
                        <th><i class="bi bi-calendar-range me-1"></i>Start Date</th>
                        <th><i class="bi bi-clock-history me-1"></i>End Date</th>
                        <th><i class="bi bi-chat-square-text me-1"></i>Total Leaves</th>
                        <th><i class="bi bi-list-check me-1"></i>Status</th>
                        <th><i class="bi bi-gear me-1"></i>Actions</th>
                    </tr>
                </thead>
                <tbody>`;

        if (leaves.length === 0) {
            leavesHtml += `<tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    No leave requests found
                </td>
            </tr>`;
        } else {
            leaves.forEach((leave) => {
                let statusBadgeClass = "";
                switch (leave.status) {
                    case "Pending":
                        statusBadgeClass = "badge bg-warning text-dark";
                        break;
                    case "Approved":
                        statusBadgeClass = "badge bg-success";
                        break;
                    case "Rejected":
                        statusBadgeClass = "badge bg-danger";
                        break;
                }

                leavesHtml += `
        <tr>
            <td>${leave.id}</td>
            <td>${leave.employee_id}</td>
            <td>${leave.start_date}</td>
            <td>${leave.end_date}</td>
            <td>${leave.total_leaves}</td>
            <td><span class="${statusBadgeClass} rounded-pill px-3 pt-2">${leave.status}</span></td>
            <td>
                ${leave.status === "Pending" ? `
                    <button class="btn btn-success approve-btn btn-sm m-1" data-id="${leave.id}">Approve</button>
                    <button class="btn btn-danger reject-btn btn-sm m-1" data-id="${leave.id}">Reject</button>
                ` : `<span class="text-muted">No Actions Available</span>`}
            </td>
        </tr>`;
            });
        }

        leavesHtml += `</tbody></table>`;
        $("#leaveRequestsTable").html(leavesHtml);
    }

    function setupLeaveFilters() {
        $("#filterLeavesForm").submit(function (e) {
            e.preventDefault();
            filterLeaves();
        });

        $("#filterLeavesForm input, #filterLeavesForm select").on("input change", function () {
            filterLeaves();
        });
    }

    function filterLeaves() {
        const employeeId = $("#filterLeavesForm input[name='employee_id']").val().toLowerCase();
        const status = $("#filterLeavesForm select[name='status']").val();

        const filteredData = allLeavesData.filter(leave => {
            const matchesEmployeeId = !employeeId ||
                leave.employee_id.toString().toLowerCase().includes(employeeId);

            const matchesStatus = !status || leave.status === status;

            return matchesEmployeeId && matchesStatus;
        });

        renderLeavesTable(filteredData);
    }

    function updateLeaveStatus(leaveId, status) {
        $.ajax({
            type: "POST",
            url: "../apis/admin/ApproveRejectLeave.php",
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token"),
            },
            contentType: "application/json",
            data: JSON.stringify({ leave_id: leaveId, status: status }),
            success: function (response) {
                const data = typeof response === "string" ? JSON.parse(response) : response;
                if (data.status === 200) {
                    loadLeaves();
                } else {
                    Swal.fire({
                        icon: 'info',
                        title: 'Message',
                        text: data.message
                    });
                }
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error updating leave status!'
                });
            },
        });
    }

    $(document).on("click", ".approve-btn", function () {
        const leaveId = $(this).data("id");
        Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: 'You are about to approve this leave request.',
            showCancelButton: true,
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                updateLeaveStatus(leaveId, "Approved");
            }
        });
    });

    $(document).on("click", ".reject-btn", function () {
        const leaveId = $(this).data("id");
        Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: 'You are about to reject this leave request.',
            showCancelButton: true,
            confirmButtonText: 'Yes, Reject',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                updateLeaveStatus(leaveId, "Rejected");
            }
        });
    });


    loadLeaves();



});
