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
    // $(".nav-link").click(function (e) {
    //     e.preventDefault();
    //     const section = $(this).data("section");
    //     $(".section").removeClass("active");
    //     $("#" + section).addClass("active");
    //     $(".nav-link").removeClass("active");
    //     $(this).addClass("active");
    // });
    //navigation
    function activateSection(sectionId) {
        $('.section').hide();

        $(`#${sectionId}`).show();

        $('.nav-link').removeClass('active');
        $(`.nav-link[href="#${sectionId}"]`).addClass('active');
    }
    function activateSection(sectionId) {
        $('.section').hide();

        const $section = $(`#${sectionId}`);
        $section.show();

        $('.nav-link').removeClass('active');
        $(`.nav-link[href="#${sectionId}"]`).addClass('active');
        $('html, body').animate({ scrollTop: $section.offset().top }, 100);
    }

    $('.nav-link[data-section]').on('click', function (e) {
        e.preventDefault();
        const sectionId = $(this).attr('data-section');
        history.replaceState(null, null, `#${sectionId}`);
        activateSection(sectionId);
    });

    $('a[href^="#"]').not('[data-section]').on('click', function (e) {
        e.preventDefault();
        const sectionId = $(this).attr('href').substring(1);
        history.replaceState(null, null, `#${sectionId}`);
        activateSection(sectionId);
    });

    $('body').hide();

    function initializePage() {
        const hash = window.location.hash.substring(1);
        const validSections = ['home', 'salary-details', 'leaves', 'profile'];

        $(window).on('load', function () {
            if (hash && validSections.includes(hash)) {
                activateSection(hash);
            } else {
                history.replaceState(null, null, '#home');
                activateSection('home');
            }
            $('body').show();
        });
    }

    $(window).on('hashchange', function () {
        const sectionId = window.location.hash.substring(1);
        if (sectionId) activateSection(sectionId);
    });

    initializePage();

    // dashboard //////////////////////////////////////////////////////////////////////
    function loadDashboardData() {
        $.ajax({
            url: '../apis/users/UserDashboard.php',
            type: 'GET',
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token")
            },
            success: function (response) {
                if (response.status === 200) {
                    const profile = response.data.profile;
                    $('#employeeName').text(profile.name);
                    $('#employeeDesignation').text(profile.designation);
                    $('#employeeDepartment').text(profile.department);
                    $('#employeeDOJ').text(new Date(profile.doj).toLocaleDateString());

                    const leaves = response.data.leaves;
                    $('#leavesTaken').text(leaves.taken);
                    $('#leavesPending').text(leaves.pending);

                    const salary = response.data.salary;
                    if (salary) {
                        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
                        $('#lastSalary').text(`${monthNames[salary.month - 1]} ${salary.year}`);
                    } else {
                        $('#lastSalary').text('No salary records found');
                    }
                } else {
                    console.error(response.message);
                }
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    window.location.href = '../index.html';
                } else {
                    console.error(xhr.responseJSON?.message || "Failed to load dashboard data");
                }
            }
        });
    }

    loadDashboardData();


    // salary //////////////////////////////////////////////////////////////////////

    // Load salary history (same as before)
    function loadSalaryHistory() {
        $.ajax({
            url: '../apis/users/SalaryDetails.php',
            type: 'GET',
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token")
            },
            success: function (response) {
                if (response.status === 200) {
                    renderSalaryHistory(response.data);
                } else {
                    console.error(response.message);
                    $('#salaryHistoryBody').html('<tr><td colspan="5" class="text-center">Failed to load salary history</td></tr>');
                }
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    window.location.href = '../index.html';
                } else {
                    $('#salaryHistoryBody').html('<tr><td colspan="5" class="text-center">Error loading salary history</td></tr>');
                }
            }
        });
    }

    // Render salary history table (same as before)
    function renderSalaryHistory(salaries) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        if (salaries.length === 0) {
            $('#salaryHistoryBody').html('<tr><td colspan="5" class="text-center">No salary records found</td></tr>');
            return;
        }

        let html = '';
        salaries.forEach(salary => {
            html += `
        <tr>
            <td>${monthNames[salary.month - 1]}</td>
            <td>${salary.year}</td>
            <td>₹${salary.net_salary.toLocaleString('en-IN')}</td>
            <td>${new Date(salary.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-slip" 
                        data-salary-id="${salary.id}"
                        data-month="${salary.month}"
                        data-year="${salary.year}">
                    <i class="bi bi-file-earmark-text"></i> View Salary Slip
                </button>
            </td>
        </tr>
    `;
        });

        $('#salaryHistoryBody').html(html);
    }

    // View salary slip
    $(document).on('click', '.view-slip', function () {
        const salaryId = $(this).data('salary-id');
        const month = $(this).data('month');
        const year = $(this).data('year');

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        $('#salarySlipModalLabel').text(`Salary Slip - ${monthNames[month - 1]} ${year}`);
        $('#salaryMonthYear').text(`${monthNames[month - 1]} ${year}`);
        $('#generationDate').text(new Date().toLocaleDateString());

        $('#earningsTable, #deductionsTable, #leavesTable').html('<tr><td colspan="4" class="text-center">Loading data...</td></tr>');
        $('#totalEarnings, #totalDeductions, #totalLeaveDeductions, #netSalary').text('₹0.00');

        $('#salarySlipModal').modal('show');

        // Fetch data
        $.ajax({
            url: '../apis/users/SalaryDetails.php?type=details&salary_id=' + salaryId,
            type: 'GET',
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token")
            },
            success: function (response) {
                if (response.status === 200) {
                    renderSalarySlip(response.data);
                } else {
                    showErrorInModal(response.message);
                }
            },
            error: function (xhr) {
                showErrorInModal(xhr.responseJSON?.message || "Error loading salary details");
            }
        });
    });

    function renderSalarySlip(data) {
        $('#empName').text(data.employee.name);
        $('#empDesignation').text(data.employee.designation);
        $('#empDepartment').text(data.employee.department);
        $('#empDOJ').text(new Date(data.employee.DOJ).toLocaleDateString());

        const componentGroups = {};

        data.components.forEach(component => {
            const key = `${component.description}-${component.type}`;
            if (!componentGroups[key]) {
                componentGroups[key] = {
                    description: component.description,
                    type: component.type,
                    amount: 0
                };
            }
            componentGroups[key].amount += parseFloat(component.amount);
        });

        const groupedComponents = Object.values(componentGroups);

        let earningsHtml = '';
        let deductionsHtml = '';
        let totalEarnings = 0;
        let totalDeductions = 0;

        groupedComponents.forEach(component => {
            const formattedAmount = component.amount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            if (component.type == 0) { 
                earningsHtml += `
        <tr>
            <td>${component.description}</td>
            <td class="text-end">₹${formattedAmount}</td>
        </tr>
    `;
                totalEarnings += component.amount;
            } else { 
                deductionsHtml += `
        <tr>
            <td>${component.description}</td>
            <td class="text-end">₹${formattedAmount}</td>
        </tr>
    `;
                totalDeductions += component.amount;
            }
        });

        let leavesHtml = '';
        let totalLeaveDeductions = 0;
        const daysInMonth = new Date(data.salary_info.year, data.salary_info.month, 0).getDate();
        const dailyRate = totalEarnings / daysInMonth; 

        if (data.leaves.length > 0) {
            data.leaves.forEach(leave => {
                const deduction = leave.total_leaves * dailyRate;
                totalLeaveDeductions += deduction;

                leavesHtml += `
        <tr>
            <td>${new Date(leave.start_date).toLocaleDateString()} to ${new Date(leave.end_date).toLocaleDateString()}</td>
            <td>${leave.total_leaves}</td>
            <td><span class="badge bg-success">Approved</span></td>
            <td class="text-end">₹${deduction.toFixed(2)}</td>
        </tr>
    `;
            });
        } else {
            leavesHtml = '<tr><td colspan="4" class="text-center">No leave records for this period</td></tr>';
        }

        $('#earningsTable').html(earningsHtml || '<tr><td colspan="2" class="text-center">No earnings found</td></tr>');
        $('#deductionsTable').html(deductionsHtml || '<tr><td colspan="2" class="text-center">No deductions found</td></tr>');
        $('#leavesTable').html(leavesHtml);

        $('#totalEarnings').text(`₹${totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        $('#totalDeductions').text(`₹${totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
        $('#totalLeaveDeductions').text(`₹${totalLeaveDeductions.toFixed(2)}`);

        const netSalary = totalEarnings - totalDeductions - totalLeaveDeductions;
        $('#netSalary').text(`₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

        // console.log("Processed Data:", {
        //     components: groupedComponents,
        //     totalEarnings,
        //     totalDeductions,
        //     totalLeaveDeductions,
        //     netSalary,
        //     dailyRate
        // });
    }

    function showErrorInModal(message) {
        $('#earningsTable, #deductionsTable, #leavesTable').html(`<tr><td colspan="4" class="text-center text-danger">${message}</td></tr>`);
    }

    loadSalaryHistory();

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

    // Apply for Leave /////////////////////////////////////////////////////////////
    $('#leaveForm').submit(function (e) {
        e.preventDefault();

        $.ajax({
            url: '../apis/users/ApplyLeave.php',
            type: 'POST',
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token")
            },
            data: $(this).serialize(),
            success: function (response) {
                if (response.status === 200) {
                    $('#leaveForm')[0].reset();
                    loadLeaveHistory();
                }
                else if (response.status === 400) {
                    alert(response.message);
                }
            },
            error: function (xhr) {
                alert(xhr.responseJSON.message || "An unexpected error occurred.");
            }
        });

    });

    function loadLeaveHistory() {
        $.ajax({
            url: '../apis/users/FetchLeaves.php',
            type: 'GET',
            headers: {
                Authorization: "Bearer " + sessionStorage.getItem("auth_token")
            },
            success: function (response) {
                if (response.status === 200) {
                    const leaves = response.data;
                    const tbody = $('#leaveHistoryTable tbody');
                    tbody.empty();

                    leaves.forEach(leave => {
                        let statusClass = '';

                        switch (leave.status) {
                            case 'Pending':
                                statusClass = 'badge bg-warning text-dark';
                                break;
                            case 'Approved':
                                statusClass = 'badge bg-success';
                                break;
                            case 'Rejected':
                                statusClass = 'badge bg-danger';
                                break;
                        }

                        tbody.append(`
                <tr>
                    <td>${leave.start_date}</td>
                    <td>${leave.end_date}</td>
                    <td>${leave.total_leaves}</td>
                    <td><span class="${statusClass} rounded-pill px-3 pt-2">${leave.status}</span></td>
                    <td>${leave.created_at}</td>
                </tr>
            `);
                    });
                } else {
                    alert(response.error || "Error fetching leave history.");
                }
            },
            error: function (xhr) {
                alert(xhr.responseJSON.error);
            }
        });
    }

    loadLeaveHistory();




});
