import { getDb, saveDb } from './db';
import { hashPassword } from '@/services/auth-service';

function uid(prefix: string, n: number): string {
  return `${prefix}-${n}`;
}

function iso(y: number, m: number, d: number): string {
  return new Date(y, m - 1, d).toISOString();
}

export async function initializeData(): Promise<void> {
  const db = await getDb();
  const userCount = db.exec('SELECT COUNT(*) as count FROM users');
  const count = userCount.length > 0 ? userCount[0].values[0][0] as number : 0;
  if (count > 0) return;

  const now = iso(2026, 1, 1);
  const pw = hashPassword('admin123');
  const pw2 = hashPassword('teacher123');
  const pw3 = hashPassword('student123');
  const pw4 = hashPassword('parent123');

  const run = (sql: string, params: unknown[] = []) => db.run(sql, params);

  // ======================== USERS ========================
  run('INSERT INTO users (id,username,password,role,name,email,phone,active,createdAt) VALUES (?,?,?,?,?,?,?,?,?)', ['1', 'admin', pw, 'admin', 'Admin', 'admin@school.com', '0300-1234567', 1, now]);
  run('INSERT INTO users (id,username,password,role,name,email,phone,active,createdAt) VALUES (?,?,?,?,?,?,?,?,?)', ['2', 'teacher', pw2, 'teacher', 'Ahmad Khan', 'ahmad@school.com', '0301-2345678', 1, now]);
  run('INSERT INTO users (id,username,password,role,name,email,phone,active,createdAt) VALUES (?,?,?,?,?,?,?,?,?)', ['3', 'student', pw3, 'student', 'Ali Hassan', 'ali@student.com', '0302-3456789', 1, now]);
  run('INSERT INTO users (id,username,password,role,name,email,phone,active,createdAt) VALUES (?,?,?,?,?,?,?,?,?)', ['4', 'parent', pw4, 'parent', 'Hassan Ali', 'hassan@parent.com', '0303-4567890', 1, now]);
  run('INSERT INTO users (id,username,password,role,name,email,phone,active,createdAt) VALUES (?,?,?,?,?,?,?,?,?)', ['5', 'teacher2', pw2, 'teacher', 'Fatima Bibi', 'fatima@school.com', '0304-5678901', 1, now]);
  run('INSERT INTO users (id,username,password,role,name,email,phone,active,createdAt) VALUES (?,?,?,?,?,?,?,?,?)', ['6', 'teacher3', pw2, 'teacher', 'Usman Ahmed', 'usman@school.com', '0305-6789012', 1, now]);

  // ======================== SETTINGS ========================
  run('INSERT INTO settings (id,schoolName,schoolAddress,schoolCity,schoolState,schoolPincode,schoolPhone,schoolEmail,schoolWebsite,academicYear,gradingSystem,sessionStartMonth) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    ['1', 'Al-Noor Public School', '123 Education Road', 'Lahore', 'Punjab', '54000', '042-37654321', 'info@alnoor.edu.pk', 'https://alnoor.edu.pk', '2026-2027', 'Grade', 4]);

  // ======================== CLASSES ========================
  const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'];
  for (let i = 0; i < 6; i++) {
    const cid = uid('class', i + 1);
    run('INSERT INTO classes (id,name,numeric,sections,teacherIds,createdAt) VALUES (?,?,?,?,?,?)',
      [cid, classNames[i], i + 1, JSON.stringify([`sec-${i + 1}a`, `sec-${i + 1}b`]), JSON.stringify([]), now]);
  }

  // ======================== SECTIONS ========================
  const sectionNames = ['A', 'B'];
  const sectionIds: string[] = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 2; j++) {
      const sid = `sec-${i + 1}${sectionNames[j].toLowerCase()}`;
      sectionIds.push(sid);
      run('INSERT INTO sections (id,name,classId,roomNo,createdAt) VALUES (?,?,?,?,?)',
        [sid, sectionNames[j], uid('class', i + 1), `${101 + i * 10 + j}`, now]);
    }
  }

  // ======================== SUBJECTS ========================
  const subjects = [
    ['Mathematics', 'MATH', 'Theory', 100, 33],
    ['English', 'ENG', 'Theory', 100, 33],
    ['Urdu', 'URD', 'Theory', 100, 33],
    ['Science', 'SCI', 'Theory', 100, 33],
    ['Social Studies', 'SST', 'Theory', 100, 33],
    ['Computer Science', 'CS', 'Theory', 50, 17],
    ['Physical Education', 'PE', 'Practical', 50, 17],
    ['Islamiyat', 'ISL', 'Theory', 50, 17],
  ];
  const subjectIds: string[] = [];
  for (let i = 0; i < subjects.length; i++) {
    const sid = uid('sub', i + 1);
    subjectIds.push(sid);
    const classIds = JSON.stringify(['class-1', 'class-2', 'class-3', 'class-4', 'class-5', 'class-6']);
    run('INSERT INTO subjects (id,name,code,classIds,teacherId,type,maxMarks,passingMarks,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
      [sid, subjects[i][0], subjects[i][1], classIds, '', subjects[i][2], subjects[i][3], subjects[i][4], now]);
  }

  // ======================== TEACHERS ========================
  const teachers = [
    { fn: 'Ahmad', ln: 'Khan', gender: 'Male', dob: '1985-03-15', email: 'ahmad@school.com', phone: '0301-2345678', qual: 'M.Sc Mathematics', exp: 12, desig: 'Senior Teacher', dept: 'Mathematics', salary: 65000 },
    { fn: 'Fatima', ln: 'Bibi', gender: 'Female', dob: '1990-07-22', email: 'fatima@school.com', phone: '0304-5678901', qual: 'M.A English', exp: 8, desig: 'Teacher', dept: 'English', salary: 55000 },
    { fn: 'Usman', ln: 'Ahmed', gender: 'Male', dob: '1988-11-10', email: 'usman@school.com', phone: '0305-6789012', qual: 'M.Sc Physics', exp: 10, desig: 'Teacher', dept: 'Science', salary: 58000 },
    { fn: 'Ayesha', ln: 'Khan', gender: 'Female', dob: '1992-05-05', email: 'ayesha@school.com', phone: '0306-7890123', qual: 'B.Ed Urdu', exp: 5, desig: 'Teacher', dept: 'Urdu', salary: 48000 },
    { fn: 'Bilal', ln: 'Shah', gender: 'Male', dob: '1987-09-18', email: 'bilal@school.com', phone: '0307-8901234', qual: 'M.Sc Computer Science', exp: 7, desig: 'Teacher', dept: 'Computer Science', salary: 52000 },
    { fn: 'Sana', ln: 'Malik', gender: 'Female', dob: '1991-12-01', email: 'sana@school.com', phone: '0308-9012345', qual: 'M.A Social Studies', exp: 6, desig: 'Teacher', dept: 'Social Studies', salary: 50000 },
  ];
  for (let i = 0; i < teachers.length; i++) {
    const tid = uid('teacher', i + 1);
    const t = teachers[i];
    run('INSERT INTO teachers (id,employeeId,firstName,lastName,gender,dob,photo,email,phone,address,qualification,experience,joiningDate,subjects,classIds,designation,department,salary,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [tid, `EMP-${1000 + i}`, t.fn, t.ln, t.gender, t.dob, '', t.email, t.phone, 'Lahore', t.qual, t.exp, iso(2020 + (i % 3), 1 + i, 1), JSON.stringify([subjectIds[i % subjectIds.length]]), JSON.stringify([`class-${(i % 6) + 1}`]), t.desig, t.dept, t.salary, 'Active', now]);
  }

  // ======================== PARENTS ========================
  const parentData = [
    { fn: 'Hassan Ali', mn: 'Zainab Bibi', email: 'hassan@parent.com', phone: '0303-4567890', occ: 'Engineer' },
    { fn: 'Muhammad Raza', mn: 'Amina Khatun', email: 'raza@parent.com', phone: '0309-0123456', occ: 'Doctor' },
    { fn: 'Imran Shah', mn: 'Nadia Parveen', email: 'imran@parent.com', phone: '0310-1234567', occ: 'Business' },
    { fn: 'Khalid Mehmood', mn: 'Saima Bibi', email: 'khalid@parent.com', phone: '0311-2345678', occ: 'Teacher' },
  ];
  for (let i = 0; i < parentData.length; i++) {
    const pid = uid('parent', i + 1);
    const p = parentData[i];
    const children = JSON.stringify([`student-${i * 3 + 1}`, `student-${i * 3 + 2}`]);
    run('INSERT INTO parents (id,fatherName,motherName,email,phone,alternatePhone,address,occupation,children,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [pid, p.fn, p.mn, p.email, p.phone, '', 'Lahore', p.occ, children, now]);
  }

  // ======================== STUDENTS ========================
  const studentNames = [
    { fn: 'Ali', ln: 'Hassan', gender: 'Male', dob: '2014-02-10', bg: 'B+' },
    { fn: 'Zara', ln: 'Hassan', gender: 'Female', dob: '2015-06-15', bg: 'A+' },
    { fn: 'Ahmed', ln: 'Raza', gender: 'Male', dob: '2013-09-20', bg: 'O' },
    { fn: 'Sara', ln: 'Raza', gender: 'Female', dob: '2014-01-05', bg: 'B-' },
    { fn: 'Bilal', ln: 'Shah', gender: 'Male', dob: '2012-04-12', bg: 'AB+' },
    { fn: 'Hina', ln: 'Shah', gender: 'Female', dob: '2013-08-25', bg: 'A+' },
    { fn: 'Omar', ln: 'Mehmood', gender: 'Male', dob: '2014-11-30', bg: 'B+' },
    { fn: 'Aisha', ln: 'Mehmood', gender: 'Female', dob: '2015-03-18', bg: 'O' },
    { fn: 'Hamza', ln: 'Khan', gender: 'Male', dob: '2013-07-07', bg: 'A-' },
    { fn: 'Noor', ln: 'Khan', gender: 'Female', dob: '2014-12-22', bg: 'B+' },
    { fn: 'Dani', ln: 'Ahmed', gender: 'Male', dob: '2012-05-14', bg: 'AB-' },
    { fn: 'Maha', ln: 'Ahmed', gender: 'Female', dob: '2013-10-09', bg: 'A+' },
    { fn: 'Saif', ln: 'Malik', gender: 'Male', dob: '2014-04-03', bg: 'B+' },
    { fn: 'Rabia', ln: 'Malik', gender: 'Female', dob: '2015-01-17', bg: 'O' },
    { fn: 'Talha', ln: 'Butt', gender: 'Male', dob: '2013-06-28', bg: 'A+' },
    { fn: 'Zainab', ln: 'Butt', gender: 'Female', dob: '2014-09-11', bg: 'B-' },
    { fn: 'Faisal', ln: 'Siddiqui', gender: 'Male', dob: '2012-08-05', bg: 'AB+' },
    { fn: 'Hira', ln: 'Siddiqui', gender: 'Female', dob: '2013-02-20', bg: 'A+' },
    { fn: 'Junaid', ln: 'Akhtar', gender: 'Male', dob: '2014-07-13', bg: 'B+' },
    { fn: 'Amna', ln: 'Akhtar', gender: 'Female', dob: '2015-05-08', bg: 'O' },
  ];
  for (let i = 0; i < studentNames.length; i++) {
    const stid = uid('student', i + 1);
    const s = studentNames[i];
    const classIdx = Math.floor(i / 3) % 6;
    const secIdx = i % 2;
    const classId = uid('class', classIdx + 1);
    const secId = `sec-${classIdx + 1}${sectionNames[secIdx].toLowerCase()}`;
    const parentIdx = Math.floor(i / 3) % parentData.length;
    const parentId = uid('parent', parentIdx + 1);
    run('INSERT INTO students (id,admissionNo,rollNo,firstName,lastName,gender,dob,bloodGroup,religion,nationality,photo,classId,sectionId,parentId,guardianName,guardianRelation,guardianPhone,guardianEmail,emergencyContact,emergencyPhone,address,city,state,pincode,status,academicYear,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [stid, `ADM-${2020 + i}`, `${i + 1}`, s.fn, s.ln, s.gender, s.dob, s.bg, 'Islam', 'Pakistani', '', classId, secId, parentId, parentData[parentIdx].fn, 'Father', parentData[parentIdx].phone, parentData[parentIdx].email, parentData[parentIdx].fn, parentData[parentIdx].phone, 'Lahore', 'Lahore', 'Punjab', '54000', 'Active', '2026-2027', now]);
  }

  // ======================== STAFF ========================
  const staffData = [
    { fn: 'Rashid', ln: 'Ahmad', gender: 'Male', desig: 'Accountant', dept: 'Finance', salary: 45000 },
    { fn: 'Nasir', ln: 'Hussain', gender: 'Male', desig: 'Librarian', dept: 'Library', salary: 38000 },
    { fn: 'Parveen', ln: 'Akhtar', gender: 'Female', desig: 'Receptionist', dept: 'Admin', salary: 35000 },
    { fn: 'Tariq', ln: 'Mahmood', gender: 'Male', desig: 'Driver', dept: 'Transport', salary: 30000 },
    { fn: 'Ghulam', ln: 'Mustafa', gender: 'Male', desig: 'Peon', dept: 'Admin', salary: 25000 },
  ];
  for (let i = 0; i < staffData.length; i++) {
    const sid = uid('staff', i + 1);
    const s = staffData[i];
    run('INSERT INTO staff (id,employeeId,firstName,lastName,gender,dob,photo,email,phone,address,designation,department,salary,joiningDate,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [sid, `STF-${2000 + i}`, s.fn, s.ln, s.gender, `1990-0${i + 1}-15`, '', `${s.fn.toLowerCase()}@school.com`, `032${i}-1234567`, 'Lahore', s.desig, s.dept, s.salary, iso(2021, 3 + i, 1), 'Active', now]);
  }

  // ======================== ATTENDANCE ========================
  for (let day = 1; day <= 20; day++) {
    const date = iso(2026, 7, day);
    for (let si = 0; si < 20; si++) {
      const stid = uid('student', si + 1);
      const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'Present'];
      const status = statuses[si % statuses.length];
      run('INSERT INTO attendance (id,studentId,classId,sectionId,date,status,remarks,markedBy,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
        [uid('att', si * 20 + day), stid, `class-${(Math.floor(si / 3) % 6) + 1}`, `sec-${(Math.floor(si / 3) % 6) + 1}${sectionNames[si % 2].toLowerCase()}`, date, status, '', uid('teacher', (si % 6) + 1), now]);
    }
  }

  // ======================== FEES ========================
  const feeCategories = ['Tuition Fee', 'Admission Fee', 'Lab Fee', 'Library Fee', 'Sports Fee'];
  for (let i = 0; i < 20; i++) {
    const stid = uid('student', i + 1);
    for (let j = 0; j < 3; j++) {
      const amt = [8000, 5000, 2000, 1000, 1500][j];
      const paid = j < 2 ? amt : 0;
      const status = j < 2 ? 'Paid' : 'Unpaid';
      const paidDate = j < 2 ? iso(2026, 7, 5 + j * 10) : '';
      run('INSERT INTO fees (id,studentId,admissionNo,category,amount,paidAmount,dueDate,paidDate,status,paymentMode,receiptNo,fine,remarks,academicYear,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [uid('fee', i * 3 + j + 1), stid, `ADM-${2020 + i}`, feeCategories[j], amt, paid, iso(2026, 7, 20), paidDate, status, paid > 0 ? 'Cash' : '', paid > 0 ? `REC-${10000 + i * 3 + j}` : '', 0, '', '2026-2027', now]);
    }
  }

  // ======================== EXAMS ========================
  const examData = [
    { name: 'Unit Test 1', type: 'Unit Test', start: iso(2026, 2, 10), end: iso(2026, 2, 15) },
    { name: 'Mid Term', type: 'Mid Term', start: iso(2026, 3, 15), end: iso(2026, 3, 25) },
    { name: 'Unit Test 2', type: 'Unit Test', start: iso(2026, 5, 5), end: iso(2026, 5, 10) },
    { name: 'Final Exam', type: 'Final', start: iso(2026, 6, 1), end: iso(2026, 6, 15) },
  ];
  for (let i = 0; i < examData.length; i++) {
    const eid = uid('exam', i + 1);
    const e = examData[i];
    const classIds = JSON.stringify(['class-1', 'class-2', 'class-3', 'class-4', 'class-5', 'class-6']);
    const subIds = JSON.stringify(subjectIds);
    run('INSERT INTO exams (id,name,type,classIds,subjectIds,startDate,endDate,maxMarks,passingMarks,academicYear,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [eid, e.name, e.type, classIds, subIds, e.start, e.end, 100, 33, '2026-2027', now]);
  }

  // ======================== RESULTS ========================
  for (let ei = 0; ei < 4; ei++) {
    const eid = uid('exam', ei + 1);
    for (let si = 0; si < 20; si++) {
      const stid = uid('student', si + 1);
      for (let subi = 0; subi < 4; subi++) {
        const marks = 40 + Math.floor(Math.random() * 55);
        const maxM = 100;
        const grade = marks >= 80 ? 'A+' : marks >= 70 ? 'A' : marks >= 60 ? 'B+' : marks >= 50 ? 'B' : marks >= 40 ? 'C' : 'F';
        run('INSERT INTO results (id,examId,studentId,subjectId,marksObtained,maxMarks,grade,remarks,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
          [uid('res', ei * 80 + si * 4 + subi + 1), eid, stid, subjectIds[subi], marks, maxM, grade, '', now]);
      }
    }
  }

  // ======================== HOMEWORK ========================
  const hwTitles = [
    'Chapter 1 Exercises', 'Math Worksheet', 'English Essay', 'Science Project', 'Urdu Reading',
    'History Assignment', 'Geography Map Work', 'Computer Lab Report', 'Physics Numericals', 'Chemistry Notes',
  ];
  for (let i = 0; i < hwTitles.length; i++) {
    const hid = uid('hw', i + 1);
    const classIdx = i % 6;
    run('INSERT INTO homework (id,title,description,subjectId,classId,sectionId,teacherId,dueDate,attachments,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [hid, hwTitles[i], `Complete the exercises for ${hwTitles[i]}`, subjectIds[i % subjectIds.length], uid('class', classIdx + 1), `sec-${classIdx + 1}a`, uid('teacher', (i % 6) + 1), iso(2026, 7, 20 + i), '', 'Active', now]);
  }

  // ======================== HOMEWORK SUBMISSIONS ========================
  for (let i = 0; i < 10; i++) {
    const hid = uid('hw', (i % 10) + 1);
    for (let j = 0; j < 3; j++) {
      const stid = uid('student', i * 2 + j + 1);
      if (parseInt(stid.split('-')[1]) > 20) continue;
      const statuses = ['Graded', 'Pending', 'Graded'];
      const marks = statuses[j] === 'Graded' ? 8 + Math.floor(Math.random() * 2) : 0;
      run('INSERT INTO homework_submissions (id,homeworkId,studentId,submission,remarks,marks,status,submittedAt) VALUES (?,?,?,?,?,?,?,?)',
        [uid('hwsub', i * 3 + j + 1), hid, stid, 'Done', '', marks, statuses[j], iso(2026, 7, 18 + i)]);
    }
  }

  // ======================== NOTICES ========================
  const notices = [
    { title: 'Annual Day Celebration', content: 'Annual day will be held on 15th August. All students must participate.', type: 'Event' },
    { title: 'Holiday Notice', content: 'School will remain closed on 14th August due to Independence Day.', type: 'Notice' },
    { title: 'PTM Schedule', content: 'Parent-Teacher meeting scheduled for 20th July, 9 AM to 1 PM.', type: 'Meeting' },
    { title: 'Fee Submission Deadline', content: 'Last date for fee submission is 25th July. Late fees will attract a fine of Rs. 500.', type: 'Notice' },
    { title: 'Science Exhibition', content: 'Inter-class science exhibition on 30th July. Students can register with their class teacher.', type: 'Event' },
  ];
  for (let i = 0; i < notices.length; i++) {
    run('INSERT INTO notices (id,title,content,type,targetAudience,createdAt) VALUES (?,?,?,?,?,?)',
      [uid('notice', i + 1), notices[i].title, notices[i].content, notices[i].type, JSON.stringify(['All']), iso(2026, 7, 1 + i)]);
  }

  // ======================== TIMETABLE ========================
  const periods = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'];
  const endPeriods = ['08:50', '09:50', '10:50', '11:50', '12:50', '13:50'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (let c = 1; c <= 3; c++) {
    for (let d = 0; d < 5; d++) {
      for (let p = 0; p < 6; p++) {
        run('INSERT INTO timetable (id,classId,sectionId,day,period,subjectId,teacherId,roomNo,startTime,endTime) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [uid('tt', (c - 1) * 30 + d * 6 + p + 1), uid('class', c), `sec-${c}a`, days[d], p + 1, subjectIds[(d + p) % subjectIds.length], uid('teacher', ((d + p) % 6) + 1), `${100 + c}`, periods[p], endPeriods[p]]);
      }
    }
  }

  // ======================== PAYROLL ========================
  for (let i = 0; i < 6; i++) {
    const t = teachers[i];
    run('INSERT INTO payroll (id,employeeId,employeeName,employeeType,month,year,basicSalary,allowances,deductions,netSalary,status,paidDate,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('pay', i + 1), `EMP-${1000 + i}`, `${t.fn} ${t.ln}`, 'Teacher', 7, 2026, t.salary, t.salary * 0.2, t.salary * 0.05, t.salary * 1.15, 'Paid', iso(2026, 7, 28), now]);
  }
  for (let i = 0; i < 5; i++) {
    const s = staffData[i];
    run('INSERT INTO payroll (id,employeeId,employeeName,employeeType,month,year,basicSalary,allowances,deductions,netSalary,status,paidDate,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('pay', 6 + i + 1), `STF-${2000 + i}`, `${s.fn} ${s.ln}`, 'Staff', 7, 2026, s.salary, s.salary * 0.15, s.salary * 0.05, s.salary * 1.10, 'Paid', iso(2026, 7, 28), now]);
  }

  // ======================== EVENTS ========================
  const events = [
    { title: 'Annual Day', desc: 'Annual day celebration with cultural programs', type: 'Event', start: iso(2026, 8, 15), end: iso(2026, 8, 15), loc: 'School Auditorium', color: '#4f46e5' },
    { title: 'Science Exhibition', desc: 'Inter-class science exhibition', type: 'Event', start: iso(2026, 7, 30), end: iso(2026, 7, 30), loc: 'School Hall', color: '#16a34a' },
    { title: 'Parent Teacher Meeting', desc: 'PTM for all classes', type: 'Meeting', start: iso(2026, 7, 20), end: iso(2026, 7, 20), loc: 'Classrooms', color: '#ea580c' },
    { title: 'Independence Day', desc: 'National holiday', type: 'Holiday', start: iso(2026, 8, 14), end: iso(2026, 8, 14), loc: 'School', color: '#dc2626' },
  ];
  for (let i = 0; i < events.length; i++) {
    run('INSERT INTO events (id,title,description,eventType,startDate,endDate,startTime,endTime,location,targetAudience,color,createdBy,recurring,recurringPattern,attachments,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('event', i + 1), events[i].title, events[i].desc, events[i].type, events[i].start, events[i].end, '09:00', '15:00', events[i].loc, JSON.stringify(['All']), events[i].color, '1', 0, '', '[]', now]);
  }

  // ======================== LEAVES ========================
  const leaveData = [
    { userId: '2', type: 'Casual Leave', start: iso(2026, 7, 25), end: iso(2026, 7, 26), reason: 'Family function', status: 'Approved' },
    { userId: '3', type: 'Sick Leave', start: iso(2026, 7, 22), end: iso(2026, 7, 23), reason: 'Fever', status: 'Approved' },
    { userId: '5', type: 'Earned Leave', start: iso(2026, 8, 1), end: iso(2026, 8, 3), reason: 'Vacation', status: 'Pending' },
    { userId: '6', type: 'Casual Leave', start: iso(2026, 7, 28), end: iso(2026, 7, 28), reason: 'Personal work', status: 'Pending' },
  ];
  for (let i = 0; i < leaveData.length; i++) {
    const l = leaveData[i];
    run('INSERT INTO leaves (id,userId,userType,leaveType,startDate,endDate,reason,status,approvedBy,remarks,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [uid('leave', i + 1), l.userId, 'teacher', l.type, l.start, l.end, l.reason, l.status, l.status === 'Approved' ? '1' : '', '', now]);
  }

  // ======================== LIBRARY BOOKS ========================
  const books = [
    { title: 'Mathematics for Class 5', author: 'NCERT', isbn: '978-81-7450-123', cat: 'Textbook', copies: 30, avail: 25 },
    { title: 'English Grammar', author: 'Wren & Martin', isbn: '978-81-219-456', cat: 'Reference', copies: 20, avail: 18 },
    { title: 'Science Explorer', author: 'NCERT', isbn: '978-81-7450-789', cat: 'Textbook', copies: 25, avail: 22 },
    { title: 'Urdu Adabi Kanz', author: 'Punjab Board', isbn: '978-969-456-012', cat: 'Textbook', copies: 20, avail: 20 },
    { title: 'Computer Basics', author: 'Sumita Arora', isbn: '978-81-219-345', cat: 'Textbook', copies: 15, avail: 14 },
    { title: 'Islamic Studies', author: 'Punjab Board', isbn: '978-969-456-678', cat: 'Textbook', copies: 20, avail: 19 },
    { title: 'Harry Potter', author: 'J.K. Rowling', isbn: '978-0-7475-3269', cat: 'Fiction', copies: 5, avail: 3 },
    { title: 'Diary of a Young Girl', author: 'Anne Frank', isbn: '978-0-553-29698', cat: 'Non-Fiction', copies: 4, avail: 4 },
  ];
  for (let i = 0; i < books.length; i++) {
    const bid = uid('book', i + 1);
    const b = books[i];
    run('INSERT INTO library_books (id,title,author,isbn,category,publisher,edition,totalCopies,availableCopies,shelfNo,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [bid, b.title, b.author, b.isbn, b.cat, 'Publisher', '1st', b.copies, b.avail, `S${10 + i}`, 'Available', now]);
  }

  // ======================== LIBRARY TRANSACTIONS ========================
  for (let i = 0; i < 5; i++) {
    const bid = uid('book', (i % 8) + 1);
    const stid = uid('student', i * 3 + 1);
    run('INSERT INTO library_transactions (id,bookId,studentId,studentName,bookTitle,issueDate,dueDate,returnDate,status,fine,remarks,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('ltrans', i + 1), bid, stid, `${studentNames[i * 3].fn} ${studentNames[i * 3].ln}`, books[i % 8].title, iso(2026, 7, 1 + i * 3), iso(2026, 7, 15 + i * 3), i < 3 ? iso(2026, 7, 14 + i * 3) : '', i < 3 ? 'Returned' : 'Issued', 0, '', now]);
  }

  // ======================== TRANSPORT ========================
  const routes = [
    { name: 'Route A - DHA', driver: 'Tariq Mahmood', phone: '0321-1111111', fare: 3000, stops: ['DHA Phase 1', 'DHA Phase 3', 'Gulberg', 'School'] },
    { name: 'Route B - Johar Town', driver: 'Ali Sher', phone: '0322-2222222', fare: 2500, stops: ['Johar Town', 'Iqbal Town', 'School'] },
    { name: 'Route C - Model Town', driver: 'Aslam Khan', phone: '0323-3333333', fare: 2800, stops: ['Model Town', 'Canal Road', 'School'] },
  ];
  for (let i = 0; i < routes.length; i++) {
    const rid = uid('route', i + 1);
    const vid = uid('vehicle', i + 1);
    const r = routes[i];
    run('INSERT INTO transport_routes (id,routeName,vehicleId,driverName,driverPhone,stops,fare,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
      [rid, r.name, vid, r.driver, r.phone, JSON.stringify(r.stops), r.fare, 'Active', now]);
    run('INSERT INTO transport_vehicles (id,vehicleNumber,vehicleType,capacity,driverName,driverPhone,routeId,status,insuranceExpiry,lastService,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [vid, `LEA-${1000 + i}`, 'Bus', 40, r.driver, r.phone, rid, 'Active', iso(2027, 1 + i, 1), iso(2026, 6, 15), now]);
  }

  // ======================== HOSTELS ========================
  const hostelData = [
    { name: 'Quaid-e-Azam Hostel', type: 'Boys', warden: 'Mr. Rashid', total: 40, occupied: 28 },
    { name: 'Fatima Jinnah Hostel', type: 'Girls', warden: 'Mrs. Sana', total: 30, occupied: 22 },
  ];
  for (let i = 0; i < hostelData.length; i++) {
    const hid = uid('hostel', i + 1);
    const h = hostelData[i];
    run('INSERT INTO hostels (id,name,type,wardenName,wardenPhone,totalRooms,occupiedRooms,address,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [hid, h.name, h.type, h.warden, '0300-0000000', h.total, h.occupied, 'Near School Campus', 'Active', now]);
    for (let r = 1; r <= 10; r++) {
      const occ = r <= (h.occupied / 4) ? 4 : r <= (h.occupied / 4 + 2) ? 2 : 0;
      run('INSERT INTO hostel_rooms (id,hostelId,roomNumber,roomType,capacity,occupied,rent,facilities,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [uid('hroom', i * 10 + r), hid, `${100 + r}`, r <= 3 ? 'AC' : 'Standard', 4, occ, r <= 3 ? 8000 : 5000, JSON.stringify(r <= 3 ? ['AC', 'WiFi', 'Attached Bath'] : ['Fan', 'WiFi']), occ < 4 ? 'Available' : 'Full', now]);
    }
  }

  // ======================== INVENTORY ========================
  const inventoryItems = [
    { name: 'Whiteboard Marker', cat: 'Stationery', qty: 200, unit: 'pcs', price: 25, supplier: 'Stationery Mart', min: 50 },
    { name: 'A4 Paper Ream', cat: 'Stationery', qty: 100, unit: 'reams', price: 650, supplier: 'Paper World', min: 20 },
    { name: 'Chalk Box', cat: 'Classroom', qty: 50, unit: 'boxes', price: 80, supplier: 'Stationery Mart', min: 10 },
    { name: 'Projector Bulb', cat: 'Electronics', qty: 5, unit: 'pcs', price: 3500, supplier: 'Tech Solutions', min: 3 },
    { name: 'First Aid Kit', cat: 'Medical', qty: 10, unit: 'kits', price: 1500, supplier: 'Medical Store', min: 5 },
    { name: 'Sports Ball', cat: 'Sports', qty: 30, unit: 'pcs', price: 500, supplier: 'Sports House', min: 10 },
    { name: 'Desk Chair', cat: 'Furniture', qty: 100, unit: 'pcs', price: 4500, supplier: 'Furniture Mart', min: 10 },
    { name: 'Computer Mouse', cat: 'Electronics', qty: 15, unit: 'pcs', price: 800, supplier: 'Tech Solutions', min: 5 },
  ];
  for (let i = 0; i < inventoryItems.length; i++) {
    const iid = uid('inv', i + 1);
    const item = inventoryItems[i];
    run('INSERT INTO inventory (id,itemName,category,itemCode,quantity,unit,unitPrice,supplier,minStock,location,status,lastRestocked,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [iid, item.name, item.cat, `ITM-${100 + i}`, item.qty, item.unit, item.price, item.supplier, item.min, 'Main Store', item.qty > item.min ? 'In Stock' : 'Low Stock', iso(2026, 7, 1), now]);
  }

  // ======================== PAYMENTS ========================
  for (let i = 0; i < 10; i++) {
    const stid = uid('student', i + 1);
    run('INSERT INTO payments (id,studentId,studentName,feeId,amount,method,transactionId,status,gatewayResponse,receiptUrl,paidAt,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('payment', i + 1), stid, `${studentNames[i].fn} ${studentNames[i].ln}`, uid('fee', i * 3 + 1), 8000, i % 2 === 0 ? 'Cash' : 'Online', `TXN-${10000 + i}`, 'Completed', '{}', '', iso(2026, 7, 5 + i), now]);
  }

  // ======================== MESSAGES ========================
  const msgs = [
    { sub: 'Welcome to new session', content: 'Welcome to the academic session 2026-2027.', from: '1', fromRole: 'admin' },
    { sub: 'PTM Reminder', content: 'Parent-Teacher meeting is scheduled for 20th July.', from: '1', fromRole: 'admin' },
    { sub: 'Homework Query', content: 'Sir, I have a doubt in chapter 3 exercises.', from: '3', fromRole: 'student' },
    { sub: 'Leave Request', content: 'I need a day off on 28th July for personal work.', from: '5', fromRole: 'teacher' },
    { sub: 'Fee Reminder', content: 'Kindly submit the fee by 25th July.', from: '1', fromRole: 'admin' },
  ];
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    run('INSERT INTO messages (id,senderId,senderName,senderRole,receiverId,receiverName,subject,content,read,parentId,attachments,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('msg', i + 1), m.from, '', m.fromRole, '1', 'Admin', m.sub, m.content, i < 3 ? 1 : 0, '', '[]', now]);
  }

  // ======================== NOTIFICATIONS ========================
  const notifs = [
    { userId: '1', title: 'New Admission Request', msg: 'A new admission application has been submitted.', type: 'info' },
    { userId: '2', title: 'Timetable Updated', msg: 'Your timetable has been updated for next week.', type: 'info' },
    { userId: '1', title: 'Fee Defaulters', msg: '5 students have pending fees this month.', type: 'warning' },
    { userId: '3', title: 'Homework Due', msg: 'Math homework is due tomorrow.', type: 'info' },
    { userId: '1', title: 'Leave Approval Required', msg: '2 leave requests pending approval.', type: 'warning' },
  ];
  for (let i = 0; i < notifs.length; i++) {
    const n = notifs[i];
    run('INSERT INTO notifications (id,userId,title,message,type,read,link,createdAt) VALUES (?,?,?,?,?,?,?,?)',
      [uid('notif', i + 1), n.userId, n.title, n.msg, n.type, 0, '', now]);
  }

  // ======================== AUDIT LOGS ========================
  const logs = [
    { userId: '1', name: 'Admin', action: 'CREATE', entity: 'student', entityId: 'student-1' },
    { userId: '1', name: 'Admin', action: 'UPDATE', entity: 'settings', entityId: '1' },
    { userId: '2', name: 'Ahmad Khan', action: 'CREATE', entity: 'homework', entityId: 'hw-1' },
    { userId: '1', name: 'Admin', action: 'DELETE', entity: 'notice', entityId: 'notice-5' },
    { userId: '1', name: 'Admin', action: 'LOGIN', entity: 'user', entityId: '1' },
  ];
  for (let i = 0; i < logs.length; i++) {
    const l = logs[i];
    run('INSERT INTO audit_logs (id,userId,userName,action,entity,entityId,oldData,newData,ipAddress,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [uid('audit', i + 1), l.userId, l.name, l.action, l.entity, l.entityId, '{}', '{}', '127.0.0.1', now]);
  }

  // ======================== ONLINE EXAMS ========================
  for (let i = 0; i < 2; i++) {
    const oeid = uid('oexam', i + 1);
    run('INSERT INTO online_exams (id,title,description,subjectId,classId,totalMarks,duration,startDate,endDate,startTime,endTime,passingMarks,shuffleQuestions,showResults,status,createdBy,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [oeid, `Online Test ${i + 1}`, `Auto-graded online exam for ${subjects[i][0]}`, subjectIds[i], 'class-3', 20, 30, iso(2026, 7, 25 + i * 5), iso(2026, 7, 25 + i * 5), '10:00', '10:30', 8, 0, 1, 'Active', '1', now]);
    for (let q = 0; q < 5; q++) {
      run('INSERT INTO online_exam_questions (id,examId,question,questionType,options,correctAnswer,marks,orderIndex) VALUES (?,?,?,?,?,?,?,?)',
        [uid('oeq', i * 5 + q + 1), oeid, `Question ${q + 1} for ${subjects[i][0]}?`, 'MCQ', JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']), 'Option A', 4, q]);
    }
  }

  // ======================== MEETINGS ========================
  const meetingData = [
    { title: 'Staff Meeting', desc: 'Monthly staff meeting to discuss school progress', type: 'Zoom', date: iso(2026, 7, 20), time: '10:00', dur: 60 },
    { title: 'Parent Orientation', desc: 'Welcome session for new parents', type: 'In-Person', date: iso(2026, 7, 25), time: '09:00', dur: 90 },
  ];
  for (let i = 0; i < meetingData.length; i++) {
    const m = meetingData[i];
    run('INSERT INTO meetings (id,title,description,meetingType,meetingLink,meetingId,password,scheduledDate,scheduledTime,duration,participants,organizerId,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('meeting', i + 1), m.title, m.desc, m.type, 'https://zoom.us/j/123456789', '123456789', 'abc123', m.date, m.time, m.dur, JSON.stringify(['1', '2', '3']), '1', 'Scheduled', now]);
  }

  // ======================== ADMISSIONS ========================
  const admissionData = [
    { name: 'Danish Khan', father: 'Khan Muhammad', class: 'class-5', status: 'Applied' },
    { name: 'Mahnoor Fatima', father: 'Ali Ahmed', class: 'class-3', status: 'Reviewed' },
    { name: 'Usama Tariq', father: 'Tariq Mehmood', class: 'class-2', status: 'Accepted' },
    { name: 'Rimsha Bibi', father: 'Mehmood Ahmad', class: 'class-4', status: 'Applied' },
    { name: 'Saad Rehman', father: 'Rehman Khan', class: 'class-1', status: 'Rejected' },
  ];
  for (let i = 0; i < admissionData.length; i++) {
    const a = admissionData[i];
    run('INSERT INTO admissions (id,applicantName,fatherName,motherName,dateOfBirth,gender,phone,email,address,previousSchool,previousClass,applyingForClass,documents,status,remarks,applicationDate,reviewedBy,reviewedAt,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [uid('adm', i + 1), a.name, a.father, '', `20${14 - parseInt(a.class.split('-')[1])}-01-01`, i % 2 === 0 ? 'Male' : 'Female', '0300-0000000', '', 'Lahore', 'Previous School', a.class.split('-')[1], a.class, '[]', a.status, '', iso(2026, 6, 1 + i * 5), a.status !== 'Applied' ? '1' : '', a.status !== 'Applied' ? iso(2026, 6, 10 + i * 5) : '', now]);
  }

  // ======================== BACKUPS ========================
  run('INSERT INTO backups (id,fileName,fileSize,backupType,status,createdBy,notes,createdAt) VALUES (?,?,?,?,?,?,?,?)',
    ['backup-1', 'backup-2026-07-01.sql', 524288, 'Full', 'Completed', '1', 'Monthly backup', iso(2026, 7, 1)]);
  run('INSERT INTO backups (id,fileName,fileSize,backupType,status,createdBy,notes,createdAt) VALUES (?,?,?,?,?,?,?,?)',
    ['backup-2', 'backup-2026-07-15.sql', 1048576, 'Full', 'Completed', '1', 'Mid-month backup', iso(2026, 7, 15)]);

  saveDb(db);
}
