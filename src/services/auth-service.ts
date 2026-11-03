import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { User, UserRole } from '../types';
import { readExcel, writeExcel, updateExcel } from '../lib/excel';

const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (stored.includes(':')) {
    const [salt, hash] = stored.split(':');
    const verify = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    try {
      if (hash.length !== verify.length) return false;
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
    } catch {
      return false;
    }
  }
  return password === stored;
}

export async function loginUser(username: string, password: string): Promise<User | null> {
  const users = await readExcel<User>('users');
  const user = users.find((u) => u.username === username && u.active !== false);
  if (!user) return null;
  if (!verifyPassword(password, user.password)) return null;
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readExcel<User>('users');
  return users.find((u) => u.id === id) ?? null;
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const users = await readExcel<User>('users');
  return users.filter((u) => u.role === role);
}

export async function updatePassword(id: string, newPassword: string): Promise<boolean> {
  return await updateExcel('users', id, { password: hashPassword(newPassword) });
}

export async function createUser(user: Omit<User, 'createdAt'>): Promise<boolean> {
  const users = await readExcel<User>('users');
  const newUser: User = {
    ...user,
    password: hashPassword(user.password),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return await writeExcel('users', users as unknown as Record<string, unknown>[]);
}
