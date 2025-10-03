import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../database/supabase.js';

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
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'user'
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return user as User;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      return null;
    }
    
    return user as User | null;
  }

  static async findById(id: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return null;
    }
    
    return user as User | null;
  }

  static async findAll(limit = 50, offset = 0): Promise<User[]> {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, last_login, is_active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
    
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
    const { error } = await supabase
      .from('users')
      .update({
        email_verification_token: token,
        email_verification_expires: expires,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to set email verification token: ${error.message}`);
    }
  }

  static async verifyEmail(token: string): Promise<User | null> {
    // First find the user with the token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email_verification_token', token)
      .single();
    
    if (findError || !user) {
      return null;
    }
    
    // Check if token is expired
    if (user.email_verification_expires && new Date(user.email_verification_expires) < new Date()) {
      return null;
    }
    
    // Mark email as verified
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to verify email: ${updateError.message}`);
    }
    
    return updatedUser as User;
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email_verification_token', token)
      .single();
    
    if (error) {
      return null;
    }
    
    return user as User | null;
  }

  static async updateLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  static async update(userId: string, updates: Partial<CreateUserData>): Promise<User | null> {
    const updateData: any = {};
    
    if (updates.name) {
      updateData.name = updates.name;
    }
    
    if (updates.email) {
      updateData.email = updates.email;
    }
    
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    
    if (updates.role) {
      updateData.role = updates.role;
    }
    
    if (Object.keys(updateData).length === 0) {
      return this.findById(userId);
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
    
    return updatedUser as User;
  }

  static async delete(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    return !error;
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
    const today = new Date().toISOString().split('T')[0];
    
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      newUsersToday: newUsersToday || 0
    };
  }

  static async getStats(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    const { count: newUsersToday } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    return {
      total: totalUsers || 0,
      active: activeUsers || 0,
      newToday: newUsersToday || 0
    };
  }
}