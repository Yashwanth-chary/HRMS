# HRMS Salary Management Application

## 📌 Project Overview

The **HRMS Salary Management Application** is a simple web-based application designed to streamline the management of employees, their earnings, deductions, leaves, and salary slips. The application provides separate panels for **Admins** and **Users**, allowing role-based access to various functionalities.

---

## 🔑 Key Features

### **Admin Panel**

1. **Dashboard**

   - Overview of total employees, leaves, pending approvals, etc.
   - ![Admin Dashboard](./HRMS/assets/demo/Admin/Admin%20Dashboard.png)

2. **Employee Management**

   - Add, update, and delete employee details.
   - ![Employee Management](./HRMS/assets/demo/Admin/Employee%20Management.png)

3. **Salary Component Management**

   - Define and update earnings and deductions components.
   - ![Manage Salary Components](./HRMS/assets/demo/Admin/Manage%20Salary%20Components.png)

4. **Manage Payslips**

   - Generate, edit, and preview salary slips.
   - ![Manage Payslips](./HRMS/assets/demo/Admin/Manage%20Payslips.png)

5. **Leave Management**

   - Approve or reject leave applications.
   - ![Manage Leaves](./HRMS/assets/demo/Admin/Manage%20Leaves.png)

6. **Component Modal**

   - Add or edit components dynamically.
   - ![Component Modal](./HRMS/assets/demo/Admin/Component%20Modal.png)

7. **Payslip Modal**

   - View and edit salary components before generating payslips.
   - ![Payslip Modal](./HRMS/assets/demo/Admin/Payslip%20Modal.png)

8. **Add Employee**

   - Form-based employee addition.
   - ![Add Employee](./HRMS/assets/demo/Admin/Add%20Employee.png)

9. **Update Employee**
   - Edit existing employee details.
   - ![Update Employee](./HRMS/assets/demo/Admin/Update%20Employee.png)

---

### **User Panel**

1. **Dashboard**

   - View profile details, last salary paid, total leaves taken, and pending leaves.
   - ![User Dashboard](./HRMS/assets/demo/User/User%20Dashboard.png)

2. **Apply Leaves**

   - Apply for leaves with start and end dates.
   - ![Apply Leaves](./HRMS/assets/demo/User/Apply%20Leaves.png)

3. **View Salary**

   - View detailed payslips of previous months.
   - ![View Salary](./HRMS/assets/demo/User/View%20Salary.png)

4. **Payslip Modal**
   - View detailed breakdown of earnings and deductions.
   - ![Payslip Modal](./HRMS/assets/demo/User/Payslip%20Modal.png)

---

## 📂 Tech Stack

- **Frontend:** HTML, CSS, Bootstrap, JavaScript, jQuery, AJAX
- **Backend:** PHP (PDO for Database Interaction)
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Token)
- **Hosting:** Localhost (XAMPP/WAMP or PHP built-in server)

---

## 🚀 Getting Started

1. **Clone the Repository**

```bash
git clone https://github.com/Yashwanth-chary/HRMS.git

Set Up Database

Import the provided PostgreSQL schema.

Update the .env file with your database credentials.

php -S localhost:8000
```
