import { dbGetAll, dbInsert, dbUpdate, dbDelete, dbQuery, dbQueryRaw, getDb, saveDb } from './db';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'school.db');

let dbReady = false;

async function ensureDb() {
  if (!dbReady) {
    await getDb();
    dbReady = true;
  }
}

export async function readExcel<T>(filename: string): Promise<T[]> {
  await ensureDb();
  return dbGetAll<T>(filename);
}

export async function writeExcel<T extends Record<string, unknown>>(filename: string, data: T[]): Promise<boolean> {
  await ensureDb();
  const db = await getDb();
  try {
    db.run('BEGIN TRANSACTION');
    db.run(`DELETE FROM \`${filename}\``);
    for (const item of data) {
      const keys = Object.keys(item);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map((k) => {
        const v = item[k];
        if (Array.isArray(v)) return JSON.stringify(v);
        if (typeof v === 'object' && v !== null) return JSON.stringify(v);
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (v === null || v === undefined) return null;
        return v;
      });
      db.run(`INSERT INTO \`${filename}\` (${keys.join(', ')}) VALUES (${placeholders})`, values);
    }
    db.run('COMMIT');
    saveDb(db);
    return true;
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

export async function updateExcel(filename: string, id: string, updates: Record<string, unknown>): Promise<boolean> {
  await ensureDb();
  return dbUpdate(filename, id, updates);
}

export async function deleteFromExcel(filename: string, id: string): Promise<boolean> {
  await ensureDb();
  return dbDelete(filename, id);
}

export async function searchExcel<T>(filename: string, query: Partial<Record<keyof T, string>>): Promise<T[]> {
  await ensureDb();
  const all = await dbGetAll<T>(filename);
  return all.filter((item) => {
    return Object.entries(query).every(([key, value]) => {
      const itemValue = String((item as Record<string, unknown>)[key as string] ?? '');
      return itemValue.toLowerCase().includes((value ?? '').toString().toLowerCase());
    });
  });
}

export async function appendToExcel<T>(filename: string, data: T): Promise<boolean> {
  await ensureDb();
  return dbInsert(filename, data as Record<string, unknown>);
}

export function getFilePath(_filename: string): string {
  return 'school.db';
}

export function createEmptyWorkbook(_filename: string, _headers: string[]): boolean {
  return true;
}

export async function dbQueryFn<T>(table: string, conditions: Record<string, unknown>): Promise<T[]> {
  await ensureDb();
  return dbQuery<T>(table, conditions);
}

export async function dbQueryRawFn<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ensureDb();
  return dbQueryRaw<T>(sql, params);
}
