import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const dataDir = path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const analyticsFile = path.join(dataDir, 'analytics.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files
if (!fs.existsSync(usersFile)) {
  const defaultAdmin = {
    id: 1,
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 10),
    name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null
  };
  fs.writeFileSync(usersFile, JSON.stringify([defaultAdmin], null, 2));
  console.log('Default admin user created: admin@example.com / admin123');
}

if (!fs.existsSync(analyticsFile)) {
  fs.writeFileSync(analyticsFile, JSON.stringify([], null, 2));
}

// Simple database interface
export const db = {
  prepare: (sql: string) => ({
    run: (...params: any[]) => {
      // This is a simplified implementation for basic CRUD operations
      if (sql.includes('INSERT INTO users')) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        const newId = Math.max(...users.map((u: any) => u.id), 0) + 1;
        const newUser = {
          id: newId,
          email: params[0],
          password: params[1],
          name: params[2],
          role: params[3] || 'user',
          is_active: true,
          email_verified: false,
          email_verification_token: null,
          email_verification_expires: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null
        };
        users.push(newUser);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        return { lastInsertRowid: newId, changes: 1 };
      }
      if (sql.includes('INSERT INTO analytics')) {
        const analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
        const newId = Math.max(...analytics.map((a: any) => a.id), 0) + 1;
        const newEvent = {
          id: newId,
          user_id: params[0],
          feature_name: params[1],
          action: params[2],
          metadata: params[3],
          created_at: new Date().toISOString()
        };
        analytics.push(newEvent);
        fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
        return { lastInsertRowid: newId, changes: 1 };
      }
      if (sql.includes('UPDATE users')) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        const userId = params[params.length - 1];
        const userIndex = users.findIndex((u: any) => u.id === userId);
        if (userIndex !== -1) {
          if (sql.includes('last_login')) {
            users[userIndex].last_login = new Date().toISOString();
          }
          users[userIndex].updated_at = new Date().toISOString();
          fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
          return { changes: 1 };
        }
        return { changes: 0 };
      }
      if (sql.includes('DELETE FROM users')) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        const userId = params[0];
        const initialLength = users.length;
        const filteredUsers = users.filter((u: any) => u.id !== userId);
        fs.writeFileSync(usersFile, JSON.stringify(filteredUsers, null, 2));
        return { changes: initialLength - filteredUsers.length };
      }
      return { changes: 0 };
    },
    get: (...params: any[]) => {
      if (sql.includes('SELECT * FROM users WHERE email')) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        return users.find((u: any) => u.email === params[0]) || null;
      }
      if (sql.includes('SELECT * FROM users WHERE id')) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        return users.find((u: any) => u.id === params[0]) || null;
      }
      if (sql.includes('SELECT COUNT(*) as count FROM users')) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        if (sql.includes('WHERE is_active = 1')) {
          return { count: users.filter((u: any) => u.is_active).length };
        }
        if (sql.includes('WHERE role = "admin"')) {
          return { count: users.filter((u: any) => u.role === 'admin').length };
        }
        return { count: users.length };
      }
      return null;
    },
    all: (...params: any[]) => {
      if (sql.includes('SELECT') && sql.includes('FROM users')) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        if (sql.includes('ORDER BY created_at DESC')) {
          return users.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return users;
      }
      if (sql.includes('SELECT') && sql.includes('FROM analytics')) {
        const analytics = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
        return analytics;
      }
      return [];
    }
  })
};