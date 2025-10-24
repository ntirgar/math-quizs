import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Simple in-memory user store (username -> record). In production replace with DB.
interface UserRecord { id: string; email: string; passwordHash: string; salt: string; createdAt: number; }
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
let users: Record<string, UserRecord> = {};

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE,'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') users = parsed;
    }
  } catch { /* ignore */ }
}
function saveUsers() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive:true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch { /* ignore */ }
}
loadUsers();

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'dev-secret-change-me';

export function hashPassword(password: string, salt?: string) {
  const realSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, realSalt, 310000, 32, 'sha256').toString('hex');
  return { hash, salt: realSalt };
}

export function createUser(email: string, password: string) {
  const key = email.toLowerCase();
  if (users[key]) throw new Error('User already exists');
  const { hash, salt } = hashPassword(password);
  const rec: UserRecord = { id: crypto.randomUUID(), email, passwordHash: hash, salt, createdAt: Date.now() };
  users[key] = rec;
  saveUsers();
  return { id: rec.id, email: rec.email };
}

export function verifyUser(email: string, password: string) {
  const key = email.toLowerCase();
  const rec = users[key];
  if (!rec) return null;
  const { hash } = hashPassword(password, rec.salt);
  if (hash !== rec.passwordHash) return null;
  return { id: rec.id, email: rec.email };
}

export function signToken(payload: Record<string, unknown>, ttlSeconds = 60*60*24) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, exp: Math.floor(Date.now()/1000) + ttlSeconds };
  const encode = (obj: Record<string, unknown>) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const h = encode(header);
  const b = encode(body);
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(`${h}.${b}`).digest('base64url');
  return `${h}.${b}.${sig}`;
}

export function verifyToken(token: string) {
  const [h,b,sig] = token.split('.');
  if (!h || !b || !sig) return null;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(`${h}.${b}`).digest('base64url');
  if (expected !== sig) return null;
  try {
    const body = JSON.parse(Buffer.from(b,'base64url').toString());
    if (body.exp && body.exp < Math.floor(Date.now()/1000)) return null;
    return body;
  } catch { return null; }
}

export function getUserCount(){ return Object.keys(users).length; }

// For dev demonstration purposes only
export function _debugUsers(){ return Object.values(users).map(u=>({ email:u.email, createdAt:u.createdAt })); }
