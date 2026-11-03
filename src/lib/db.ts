import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'school.db');

const VALID_TABLES = new Set([
  'users', 'students', 'teachers', 'staff', 'parents', 'classes',
  'sections', 'subjects', 'attendance', 'fees', 'exams', 'results',
  'homework', 'homework_submissions', 'notices', 'timetable', 'payroll', 'settings',
  'notifications', 'audit_logs', 'leaves', 'events', 'library_books', 'library_transactions',
  'transport_routes', 'transport_vehicles', 'hostels', 'hostel_rooms', 'inventory',
  'payments', 'messages', 'online_exams', 'online_exam_questions', 'online_exam_submissions',
  'meetings', 'admissions', 'backups'
]);

function validateTable(table: string): void {
  if (!VALID_TABLES.has(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
}

let _db: Database | null = null;
let _initDone = false;

export async function getDb(): Promise<Database> {
  if (_db) return _db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
    },
  });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  initTables(_db);
  saveDb(_db);

  if (!_initDone) {
    _initDone = true;
    const { initializeData } = await import('./init-data');
    await initializeData();
  }

  return _db;
}

export function saveDb(db: Database) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function initTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      admissionNo TEXT,
      rollNo TEXT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      gender TEXT,
      dob TEXT,
      bloodGroup TEXT,
      religion TEXT,
      caste TEXT,
      nationality TEXT,
      photo TEXT DEFAULT '',
      classId TEXT,
      sectionId TEXT,
      parentId TEXT,
      guardianName TEXT,
      guardianRelation TEXT,
      guardianPhone TEXT,
      guardianEmail TEXT,
      emergencyContact TEXT,
      emergencyPhone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      status TEXT DEFAULT 'Active',
      academicYear TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      employeeId TEXT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      gender TEXT,
      dob TEXT,
      photo TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      qualification TEXT,
      experience INTEGER DEFAULT 0,
      joiningDate TEXT,
      subjects TEXT DEFAULT '[]',
      classIds TEXT DEFAULT '[]',
      designation TEXT,
      department TEXT,
      salary REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      employeeId TEXT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      gender TEXT,
      dob TEXT,
      photo TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      designation TEXT,
      department TEXT,
      salary REAL DEFAULT 0,
      joiningDate TEXT,
      status TEXT DEFAULT 'Active',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      fatherName TEXT,
      motherName TEXT,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      alternatePhone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      occupation TEXT DEFAULT '',
      children TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      numeric INTEGER,
      sections TEXT DEFAULT '[]',
      teacherIds TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      classId TEXT,
      roomNo TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      classIds TEXT DEFAULT '[]',
      teacherId TEXT DEFAULT '',
      type TEXT DEFAULT 'Theory',
      maxMarks INTEGER DEFAULT 100,
      passingMarks INTEGER DEFAULT 33,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      studentId TEXT,
      classId TEXT,
      sectionId TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      remarks TEXT DEFAULT '',
      markedBy TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      studentId TEXT,
      admissionNo TEXT,
      category TEXT,
      amount REAL DEFAULT 0,
      paidAmount REAL DEFAULT 0,
      dueDate TEXT,
      paidDate TEXT DEFAULT '',
      status TEXT DEFAULT 'Unpaid',
      paymentMode TEXT DEFAULT '',
      receiptNo TEXT DEFAULT '',
      fine REAL DEFAULT 0,
      remarks TEXT DEFAULT '',
      academicYear TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      classIds TEXT DEFAULT '[]',
      subjectIds TEXT DEFAULT '[]',
      startDate TEXT,
      endDate TEXT,
      maxMarks INTEGER DEFAULT 100,
      passingMarks INTEGER DEFAULT 33,
      academicYear TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      examId TEXT,
      studentId TEXT,
      subjectId TEXT,
      marksObtained REAL DEFAULT 0,
      maxMarks REAL DEFAULT 100,
      grade TEXT DEFAULT '',
      remarks TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      subjectId TEXT DEFAULT '',
      classId TEXT DEFAULT '',
      sectionId TEXT DEFAULT '',
      teacherId TEXT DEFAULT '',
      dueDate TEXT,
      attachments TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS homework_submissions (
      id TEXT PRIMARY KEY,
      homeworkId TEXT,
      studentId TEXT,
      submission TEXT DEFAULT '',
      remarks TEXT DEFAULT '',
      marks REAL DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      submittedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      type TEXT DEFAULT 'Notice',
      targetAudience TEXT DEFAULT '[]',
      createdBy TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      classId TEXT,
      sectionId TEXT,
      day TEXT,
      period INTEGER,
      subjectId TEXT,
      teacherId TEXT,
      roomNo TEXT DEFAULT '',
      startTime TEXT,
      endTime TEXT
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id TEXT PRIMARY KEY,
      employeeId TEXT,
      employeeName TEXT,
      employeeType TEXT,
      month INTEGER,
      year INTEGER,
      basicSalary REAL DEFAULT 0,
      allowances REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      netSalary REAL DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      paidDate TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      schoolName TEXT DEFAULT '',
      schoolAddress TEXT DEFAULT '',
      schoolCity TEXT DEFAULT '',
      schoolState TEXT DEFAULT '',
      schoolPincode TEXT DEFAULT '',
      schoolPhone TEXT DEFAULT '',
      schoolEmail TEXT DEFAULT '',
      schoolWebsite TEXT DEFAULT '',
      schoolLogo TEXT DEFAULT '',
      academicYear TEXT DEFAULT '',
      gradingSystem TEXT DEFAULT 'Grade',
      sessionStartMonth INTEGER DEFAULT 4
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT DEFAULT '',
      type TEXT DEFAULT 'info',
      read INTEGER DEFAULT 0,
      link TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT DEFAULT '',
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entityId TEXT DEFAULT '',
      oldData TEXT DEFAULT '{}',
      newData TEXT DEFAULT '{}',
      ipAddress TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userType TEXT NOT NULL,
      leaveType TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'Pending',
      approvedBy TEXT DEFAULT '',
      remarks TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      eventType TEXT DEFAULT 'Event',
      startDate TEXT NOT NULL,
      endDate TEXT DEFAULT '',
      startTime TEXT DEFAULT '',
      endTime TEXT DEFAULT '',
      location TEXT DEFAULT '',
      targetAudience TEXT DEFAULT '[]',
      color TEXT DEFAULT '#4f46e5',
      createdBy TEXT DEFAULT '',
      recurring INTEGER DEFAULT 0,
      recurringPattern TEXT DEFAULT '',
      attachments TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS library_books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT DEFAULT '',
      isbn TEXT DEFAULT '',
      category TEXT DEFAULT '',
      publisher TEXT DEFAULT '',
      edition TEXT DEFAULT '',
      totalCopies INTEGER DEFAULT 1,
      availableCopies INTEGER DEFAULT 1,
      shelfNo TEXT DEFAULT '',
      status TEXT DEFAULT 'Available',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS library_transactions (
      id TEXT PRIMARY KEY,
      bookId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      studentName TEXT DEFAULT '',
      bookTitle TEXT DEFAULT '',
      issueDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      returnDate TEXT DEFAULT '',
      status TEXT DEFAULT 'Issued',
      fine REAL DEFAULT 0,
      remarks TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transport_routes (
      id TEXT PRIMARY KEY,
      routeName TEXT NOT NULL,
      vehicleId TEXT DEFAULT '',
      driverName TEXT DEFAULT '',
      driverPhone TEXT DEFAULT '',
      stops TEXT DEFAULT '[]',
      fare REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transport_vehicles (
      id TEXT PRIMARY KEY,
      vehicleNumber TEXT NOT NULL,
      vehicleType TEXT DEFAULT 'Bus',
      capacity INTEGER DEFAULT 40,
      driverName TEXT DEFAULT '',
      driverPhone TEXT DEFAULT '',
      routeId TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      insuranceExpiry TEXT DEFAULT '',
      lastService TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hostels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'Boys',
      wardenName TEXT DEFAULT '',
      wardenPhone TEXT DEFAULT '',
      totalRooms INTEGER DEFAULT 0,
      occupiedRooms INTEGER DEFAULT 0,
      address TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hostel_rooms (
      id TEXT PRIMARY KEY,
      hostelId TEXT NOT NULL,
      roomNumber TEXT NOT NULL,
      roomType TEXT DEFAULT 'Standard',
      capacity INTEGER DEFAULT 4,
      occupied INTEGER DEFAULT 0,
      rent REAL DEFAULT 0,
      facilities TEXT DEFAULT '[]',
      status TEXT DEFAULT 'Available',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      itemName TEXT NOT NULL,
      category TEXT DEFAULT '',
      itemCode TEXT DEFAULT '',
      quantity INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      unitPrice REAL DEFAULT 0,
      supplier TEXT DEFAULT '',
      minStock INTEGER DEFAULT 0,
      location TEXT DEFAULT '',
      status TEXT DEFAULT 'In Stock',
      lastRestocked TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT DEFAULT '',
      feeId TEXT DEFAULT '',
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      transactionId TEXT DEFAULT '',
      status TEXT DEFAULT 'Pending',
      gatewayResponse TEXT DEFAULT '{}',
      receiptUrl TEXT DEFAULT '',
      paidAt TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      senderName TEXT DEFAULT '',
      senderRole TEXT DEFAULT '',
      receiverId TEXT NOT NULL,
      receiverName TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      parentId TEXT DEFAULT '',
      attachments TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS online_exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      subjectId TEXT DEFAULT '',
      classId TEXT NOT NULL,
      totalMarks INTEGER DEFAULT 100,
      duration INTEGER DEFAULT 60,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      passingMarks INTEGER DEFAULT 33,
      shuffleQuestions INTEGER DEFAULT 0,
      showResults INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Draft',
      createdBy TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS online_exam_questions (
      id TEXT PRIMARY KEY,
      examId TEXT NOT NULL,
      question TEXT NOT NULL,
      questionType TEXT DEFAULT 'MCQ',
      options TEXT DEFAULT '[]',
      correctAnswer TEXT DEFAULT '',
      marks INTEGER DEFAULT 1,
      orderIndex INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS online_exam_submissions (
      id TEXT PRIMARY KEY,
      examId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      studentName TEXT DEFAULT '',
      answers TEXT DEFAULT '{}',
      totalMarks REAL DEFAULT 0,
      obtainedMarks REAL DEFAULT 0,
      grade TEXT DEFAULT '',
      timeTaken INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Submitted',
      submittedAt TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      meetingType TEXT DEFAULT 'Zoom',
      meetingLink TEXT DEFAULT '',
      meetingId TEXT DEFAULT '',
      password TEXT DEFAULT '',
      scheduledDate TEXT NOT NULL,
      scheduledTime TEXT NOT NULL,
      duration INTEGER DEFAULT 60,
      participants TEXT DEFAULT '[]',
      organizerId TEXT DEFAULT '',
      status TEXT DEFAULT 'Scheduled',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admissions (
      id TEXT PRIMARY KEY,
      applicantName TEXT NOT NULL,
      fatherName TEXT DEFAULT '',
      motherName TEXT DEFAULT '',
      dateOfBirth TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      previousSchool TEXT DEFAULT '',
      previousClass TEXT DEFAULT '',
      applyingForClass TEXT NOT NULL,
      documents TEXT DEFAULT '[]',
      status TEXT DEFAULT 'Applied',
      remarks TEXT DEFAULT '',
      applicationDate TEXT NOT NULL,
      reviewedBy TEXT DEFAULT '',
      reviewedAt TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      fileName TEXT NOT NULL,
      fileSize INTEGER DEFAULT 0,
      backupType TEXT DEFAULT 'Full',
      status TEXT DEFAULT 'Completed',
      createdBy TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);
}

function queryToObjects(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push(parseRow(row));
  }
  stmt.free();
  return rows;
}

const JSON_COLUMNS = new Set([
  'subjects', 'classIds', 'sections', 'teacherIds', 'targetAudience', 'children',
  'stops', 'attachments', 'options', 'answers', 'participants', 'documents',
  'gatewayResponse', 'oldData', 'newData', 'facilities'
]);

function parseRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string' && JSON_COLUMNS.has(key)) {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    } else if (typeof value === 'number' && key === 'active') {
      result[key] = value === 1;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function serializeValue(value: unknown): unknown {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value === null || value === undefined) return null;
  return value;
}

export async function dbGetAll<T>(table: string): Promise<T[]> {
  validateTable(table);
  const db = await getDb();
  return queryToObjects(db, `SELECT * FROM \`${table}\``) as T[];
}

export async function dbGetById<T extends { id: string }>(table: string, id: string): Promise<T | null> {
  validateTable(table);
  const db = await getDb();
  const rows = queryToObjects(db, `SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
  return rows.length > 0 ? (rows[0] as T) : null;
}

export async function dbInsert(table: string, data: Record<string, unknown>): Promise<boolean> {
  validateTable(table);
  const db = await getDb();
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map((k) => serializeValue(data[k]));
  db.run(`INSERT INTO \`${table}\` (${keys.join(', ')}) VALUES (${placeholders})`, values);
  saveDb(db);
  return true;
}

export async function dbUpdate(table: string, id: string, updates: Record<string, unknown>): Promise<boolean> {
  validateTable(table);
  const db = await getDb();
  const keys = Object.keys(updates).filter((k) => k !== 'id');
  if (keys.length === 0) return false;
  const setClauses = keys.map((k) => `\`${k}\` = ?`).join(', ');
  const values = keys.map((k) => serializeValue(updates[k]));
  values.push(id);
  db.run(`UPDATE \`${table}\` SET ${setClauses} WHERE id = ?`, values);
  saveDb(db);
  return true;
}

export async function dbDelete(table: string, id: string): Promise<boolean> {
  validateTable(table);
  const db = await getDb();
  db.run(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
  saveDb(db);
  return true;
}

export async function dbQuery<T>(table: string, conditions: Record<string, unknown>): Promise<T[]> {
  validateTable(table);
  const db = await getDb();
  const keys = Object.keys(conditions);
  const whereClauses = keys.map((k) => `\`${k}\` = ?`).join(' AND ');
  const values = keys.map((k) => serializeValue(conditions[k]));
  return queryToObjects(db, `SELECT * FROM \`${table}\` WHERE ${whereClauses}`, values) as T[];
}

export async function dbQueryRaw<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return queryToObjects(db, sql, params) as T[];
}
