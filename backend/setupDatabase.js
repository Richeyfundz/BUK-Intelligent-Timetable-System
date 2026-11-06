const db = require("./database");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

async function setupDatabase() {
  const connection = db.promise();

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      full_name VARCHAR(150),
      email VARCHAR(150) UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(30) DEFAULT 'Admin',
      status VARCHAR(30) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS faculties (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_name VARCHAR(150) NOT NULL,
      faculty_code VARCHAR(50) NOT NULL UNIQUE,
      dean VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id INT NOT NULL,
      department_name VARCHAR(150) NOT NULL,
      department_code VARCHAR(50),
      hod VARCHAR(150),
      FOREIGN KEY (faculty_id) REFERENCES faculties(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      department_id INT,
      course_code VARCHAR(50) NOT NULL UNIQUE,
      course_title VARCHAR(200) NOT NULL,
      course_unit INT,
      level VARCHAR(20),
      semester VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS lecturers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      department_id INT,
      staff_id VARCHAR(100) NOT NULL UNIQUE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(150),
      phone VARCHAR(30),
      academic_rank VARCHAR(100),
      specialization VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      department_id INT,
      matric_no VARCHAR(100) NOT NULL UNIQUE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      gender VARCHAR(20),
      level VARCHAR(20),
      email VARCHAR(150),
      phone VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS venues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venue_name VARCHAR(150) NOT NULL,
      venue_code VARCHAR(50) NOT NULL UNIQUE,
      venue_type VARCHAR(100),
      capacity INT,
      faculty_id INT,
      department_id INT,
      status VARCHAR(30) DEFAULT 'Available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES faculties(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS course_lecturers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      lecturer_id INT NOT NULL,
      UNIQUE KEY unique_course_lecturer (course_id, lecturer_id),
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS timetables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      lecturer_id INT NOT NULL,
      venue_id INT NOT NULL,
      level VARCHAR(20),
      semester VARCHAR(30),
      day VARCHAR(20),
      lecture_date DATE,
      start_time TIME,
      end_time TIME,
      session VARCHAR(50),
      academic_year VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS exam_timetables (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      venue_id INT NOT NULL,
      level VARCHAR(20),
      semester VARCHAR(30),
      day VARCHAR(20),
      exam_date DATE,
      start_time TIME,
      end_time TIME,
      session VARCHAR(50),
      academic_year VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    ) ENGINE=InnoDB`
  ];

  for (const sql of tables) {
    await connection.query(sql);
  }

  const [users] = await connection.query(
    "SELECT id FROM users LIMIT 1"
  );

  let admin = null;

  if (users.length === 0) {
    const password = crypto.randomBytes(12).toString("base64url");
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      `INSERT INTO users
       (username, full_name, email, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "admin2",
        "System Administrator",
        "admin@buk-itms.local",
        hashedPassword,
        "Admin",
        "Active"
      ]
    );

    admin = {
      username: "admin2",
      password: password
    };
  }

  return {
    success: true,
    message: "Database tables created successfully.",
    admin: admin
  };
}

module.exports = setupDatabase;
