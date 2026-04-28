import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'app.db');

const nowIso = () => new Date().toISOString();

export const ENTITY_MAP = {
  Alert: {
    table: 'alerts',
    idPrefix: 'alert',
    columns: ['title', 'message', 'severity', 'disaster_type', 'target_institution', 'is_active', 'sent_by', 'created_date', 'updated_date'],
  },
  Course: {
    table: 'courses',
    idPrefix: 'course',
    columns: ['title', 'description', 'category', 'level', 'duration_minutes', 'content', 'target_audience', 'is_published', 'created_date', 'updated_date'],
  },
  CourseEnrollment: {
    table: 'course_enrollments',
    idPrefix: 'enroll',
    columns: ['course_id', 'user_email', 'progress_percent', 'completed', 'completed_at', 'created_date', 'updated_date'],
  },
  Incident: {
    table: 'incidents',
    idPrefix: 'incident',
    columns: ['title', 'description', 'incident_type', 'location', 'institution', 'severity', 'casualties', 'reported_by', 'status', 'response_notes', 'resolved_at', 'created_date', 'updated_date'],
  },
  Quiz: {
    table: 'quizzes',
    idPrefix: 'quiz',
    columns: ['title', 'course_id', 'passing_score', 'questions', 'created_date', 'updated_date'],
    jsonColumns: ['questions'],
  },
  QuizAttempt: {
    table: 'quiz_attempts',
    idPrefix: 'attempt',
    columns: ['quiz_id', 'user_email', 'score', 'passed', 'answers', 'completed_at', 'created_date', 'updated_date'],
    jsonColumns: ['answers'],
  },
};

export const createEntityId = (prefix) => `${prefix}_${randomUUID()}`;

let db;

export async function getDb() {
  if (db) return db;

  fs.mkdirSync(dataDir, { recursive: true });

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec('PRAGMA foreign_keys = ON;');
  await initializeSchema(db);
  await seedData(db);

  return db;
}

async function initializeSchema(conn) {
  await conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      disaster_type TEXT NOT NULL,
      target_institution TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sent_by TEXT,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      level TEXT,
      duration_minutes INTEGER,
      content TEXT,
      target_audience TEXT,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_enrollments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      incident_type TEXT,
      location TEXT,
      institution TEXT,
      severity TEXT,
      casualties INTEGER NOT NULL DEFAULT 0,
      reported_by TEXT,
      status TEXT NOT NULL,
      response_notes TEXT,
      resolved_at TEXT,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      course_id TEXT,
      passing_score INTEGER NOT NULL DEFAULT 70,
      questions TEXT NOT NULL DEFAULT '[]',
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      answers TEXT,
      completed_at TEXT,
      created_date TEXT NOT NULL,
      updated_date TEXT NOT NULL,
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );
  `);
}

async function seedData(conn) {
  const now = nowIso();

  const adminEmail = 'admin@local.app';
  const existingAdmin = await conn.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await conn.run(
      `INSERT INTO users (id, full_name, email, password_hash, role, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [createEntityId('user'), 'Local Admin', adminEmail, passwordHash, 'admin', now, now],
    );
  }

  const courseCount = await conn.get('SELECT COUNT(*) as count FROM courses');
  if (courseCount?.count === 0) {
    const c1 = 'course_quake_basics';
    const c2 = 'course_flood_response';

    await conn.run(
      `INSERT INTO courses (id, title, description, category, level, duration_minutes, content, target_audience, is_published, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c1,
        'Earthquake Preparedness Basics',
        'Learn immediate response and safe evacuation during earthquakes.',
        'earthquake',
        'beginner',
        45,
        '## Key Topics\n\n- Drop, Cover, Hold\n- Safe evacuation\n- Emergency kit checklist',
        'all',
        1,
        now,
        now,
        c2,
        'Flood Safety and Response',
        'Understand flood warnings, movement planning, and post-flood health safety.',
        'flood',
        'intermediate',
        60,
        '## Key Topics\n\n- Flood warning signs\n- Safe routes\n- Water contamination prevention',
        'students',
        1,
        now,
        now,
      ],
    );

    await conn.run(
      `INSERT INTO quizzes (id, title, course_id, passing_score, questions, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'quiz_quake_1',
        'Earthquake Basics Check',
        c1,
        70,
        JSON.stringify([
          {
            question: 'What is the recommended immediate action during shaking?',
            options: ['Run outside immediately', 'Drop, Cover, and Hold', 'Use elevator', 'Stand near windows'],
            correct_answer: 1,
            explanation: 'Drop, Cover, and Hold reduces injury risk from falling objects.',
          },
        ]),
        now,
        now,
      ],
    );

    await conn.run(
      `INSERT INTO alerts (id, title, message, severity, disaster_type, target_institution, is_active, sent_by, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'alert_initial',
        'System Live in Backend Mode',
        'This app now uses a backend API with database persistence and authentication.',
        'info',
        'general',
        '',
        1,
        adminEmail,
        now,
        now,
      ],
    );
  }
}

export function normalizeRow(row, entityName) {
  if (!row) return row;
  const entity = ENTITY_MAP[entityName];
  const jsonColumns = entity?.jsonColumns ?? [];

  const normalized = { ...row };

  for (const key of Object.keys(normalized)) {
    if (normalized[key] === 0 || normalized[key] === 1) {
      if (key.startsWith('is_') || key === 'completed' || key === 'passed') {
        normalized[key] = Boolean(normalized[key]);
      }
    }
  }

  for (const col of jsonColumns) {
    if (typeof normalized[col] === 'string') {
      try {
        normalized[col] = JSON.parse(normalized[col]);
      } catch {
        normalized[col] = [];
      }
    }
  }

  return normalized;
}
