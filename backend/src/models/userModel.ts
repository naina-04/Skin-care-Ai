import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

export async function initializeDatabase() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, '[]');
      console.log('📦 Local JSON database file initialized successfully.');
    }
  } catch (err) {
    console.error('Failed to initialize local JSON database:', err);
  }
}

async function readUsers(): Promise<any[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(users: any[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

export const UserModel = {
  async findByEmail(email: string) {
    if (!email) return null;
    const users = await readUsers();
    const matched = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!matched) return null;
    return matched;
  },

  async create({ name, email, password, role = 'USER' }: any) {
    const users = await readUsers();
    
    const newUser = {
      id: uuidv4(),
      name: name ? name.trim() : null,
      email: email.trim().toLowerCase(),
      password: password, // Expected to be pre-hashed in routes
      role,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeUsers(users);
    
    return newUser;
  }
};
