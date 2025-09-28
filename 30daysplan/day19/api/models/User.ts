import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/database.js';
import fs from 'fs';
import path from 'path';

export interface User {
  id?: string;
  email: string;
  password?: string;
  name: string;
  role: 'user' | 'admin';
  created_at?: string;
  last_login?: string;
  is_active?: boolean;
  email_verified?: boolean;
  email_verification_token?: string;
  email_verification_expires?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const stmt = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(userData.email, hashedPassword, userData.name, userData.role || 'user');
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    return user as User;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return user as User | null;
  }

  static async findById(id: string): Promise<User | null> {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return user as User | null;
  }

  static async findAll(limit = 50, offset = 0): Promise<User[]> {
    const users = db.prepare(
      'SELECT id, email, name, role, created_at, last_login, is_active FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
    return users as User[];
  }

  static async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password!);
    if (!isValid) {
      return null;
    }
    
    return user;
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async setEmailVerificationToken(userId: string, token: string, expires: string): Promise<void> {
    const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'users.json'), 'utf8'));
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].email_verification_token = token;
      users[userIndex].email_verification_expires = expires;
      users[userIndex].updated_at = new Date().toISOString();
      fs.writeFileSync(path.join(process.cwd(), 'data', 'users.json'), JSON.stringify(users, null, 2));
    }
  }

  static async verifyEmail(token: string): Promise<User | null> {
    const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'users.json'), 'utf8'));
    const userIndex = users.findIndex((u: any) => u.email_verification_token === token);
    
    if (userIndex === -1) {
      return null;
    }
    
    const user = users[userIndex];
    
    // Check if token is expired
    if (user.email_verification_expires && new Date(user.email_verification_expires) < new Date()) {
      return null;
    }
    
    // Mark email as verified
    users[userIndex].email_verified = true;
    users[userIndex].email_verification_token = null;
    users[userIndex].email_verification_expires = null;
    users[userIndex].updated_at = new Date().toISOString();
    
    fs.writeFileSync(path.join(process.cwd(), 'data', 'users.json'), JSON.stringify(users, null, 2));
    
    return users[userIndex] as User;
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'users.json'), 'utf8'));
    const user = users.find((u: any) => u.email_verification_token === token);
    return user as User | null;
  }

  static async updateLastLogin(userId: string): Promise<void> {
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
  }

  static async update(userId: string, updates: Partial<CreateUserData>): Promise<User | null> {
    const fields = [];
    const values = [];
    
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    
    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      fields.push('password = ?');
      values.push(hashedPassword);
    }
    
    if (updates.role) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    
    if (fields.length === 0) {
      return this.findById(userId);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    
    return this.findById(userId);
  }

  static async delete(userId: string): Promise<boolean> {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return result.changes > 0;
  }

  static generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }

  static async updateUser(userId: string, updates: any): Promise<User | null> {
    return this.update(userId, updates);
  }

  static async deleteUser(userId: string): Promise<boolean> {
    return this.delete(userId);
  }

  static async getUserStats(): Promise<any> {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get();
    const newUsersToday = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE("now")'
    ).get();
    
    return {
      totalUsers: (totalUsers as any).count,
      activeUsers: (activeUsers as any).count,
      newUsersToday: (newUsersToday as any).count
    };
  }

  static async getStats(): Promise<any> {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get();
    const newUsersToday = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE("now")'
    ).get();
    
    return {
      total: (totalUsers as any).count,
      active: (activeUsers as any).count,
      newToday: (newUsersToday as any).count
    };
  }
}