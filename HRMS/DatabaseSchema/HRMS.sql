create table employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    DOB date not NULL,
    DOJ date not NULL,
    phone VARCHAR(10) not NULL check (length(phone)=10),
    designation VARCHAR(100) not null,
    department VARCHAR(100) not null,
    created_at TIMESTAMP DEFAULT current_timestamp
)

create table users (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'user')) NOT NULL,
    token VARCHAR(255),
    created_at TIMESTAMP DEFAULT current_timestamp
);

create table earning_deduction_master(
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL UNIQUE, --basic pay/hra/bonus/income tax/pf/any other new component
    type SMALLINT NOT NULL, --let's say 0 for earning and 1 for deduction.
    created_at TIMESTAMP DEFAULT current_timestamp,
    status BOOLEAN DEFAULT true --0/1 -> active/inactive
)

CREATE TABLE employee_earnings_deductions(
    id serial PRIMARY KEY,
    employee_id int REFERENCES employees(id) NOT NULL,
    earning_deduction_id int REFERENCES earning_deduction_master(id) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp
);
ALTER TABLE employee_earnings_deductions
ADD CONSTRAINT unique_emp_earning_deduction UNIQUE (employee_id, earning_deduction_id);--> much needed

create table employee_salary(
    id serial PRIMARY KEY,
    employee_id int REFERENCES employees(id) NOT NULL, 
    month int not null check(month>=1 and month<=12),
    year int not null,
    net_salary NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT current_timestamp,
    status BOOLEAN DEFAULT true,
    salary_paid BOOLEAN DEFAULT false,
    constraint uni_monthly_employee_record UNIQUE (employee_id, month, year)
)

create table employee_salary_earning_deduction(
    id serial PRIMARY KEY,
    salary_id int REFERENCES employee_salary(id) not null,
    employee_earning_deduction_id int REFERENCES employee_earnings_deductions(id) not null,
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp,
    status BOOLEAN DEFAULT true
)

create table leaves (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_leaves INT GENERATED ALWAYS AS ((end_date - start_date + 1)) STORED,
    status VARCHAR(20) not NULL DEFAULT 'Pending' CHECK (status IN ('Approved', 'Rejected', 'Pending')),
    created_at timestamp DEFAULT current_timestamp
);




SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'employee_salary_earning_deduction';

