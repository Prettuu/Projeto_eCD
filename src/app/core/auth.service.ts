import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export type UserRole = 'ADMIN' | 'CLIENT';
export type UserData = {
  token: string;
  role: UserRole;
  nome?: string;
  userId?: number;
  clientId?: number;
  email?: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private tokenKey = 'token';
  private roleKey = 'role';
  private nomeKey = 'nome';
  private userIdKey = 'userId';
  private clientIdKey = 'clientId';
  private userEmailKey = 'userEmail';
  private currentUser: UserData | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, senha: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, senha }).pipe(
      tap(res => {
        console.log('Response from login:', res);
        const user: UserData = {
          token: res.token,
          role: res.role,
          nome: res.nome,
          userId: res.userId || null,
          clientId: res.clientId || null,
          email: res.email
        };
        console.log('Setting user data:', user);
        this.setUserData(user);
        this.redirectAfterLogin(user.role);
      }),
      catchError(err => {
        console.error('Erro no login:', err);
        throw err;
      })
    );
  }

  private redirectAfterLogin(role: UserRole): void {
    this.router.navigate(['/app/home']);
  }

  private setUserData(user: UserData): void {
    console.log('Setting user data with:', JSON.stringify(user, null, 2));
    localStorage.setItem(this.tokenKey, user.token);
    localStorage.setItem(this.roleKey, user.role);
    if (user.nome) {
      localStorage.setItem(this.nomeKey, user.nome);
    }
    if (user.userId !== undefined && user.userId !== null) {
      console.log('Storing userId:', user.userId, 'type:', typeof user.userId);
      localStorage.setItem(this.userIdKey, user.userId.toString());
      const stored = localStorage.getItem(this.userIdKey);
      console.log('Verified userId in localStorage:', stored);
    } else {
      console.warn('No userId found in user data:', user);
    }
    if (user.clientId !== undefined && user.clientId !== null) {
      console.log('Storing clientId:', user.clientId, 'type:', typeof user.clientId);
      localStorage.setItem(this.clientIdKey, user.clientId.toString());
      console.log('clientId saved to localStorage:', user.clientId);
    } else {
      console.warn('No clientId found in user data (may be normal for ADMIN role)');
    }

    if (user.email) {
      localStorage.setItem(this.userEmailKey, user.email);
      console.log('Email saved to localStorage:', user.email);
    } else {
      console.warn('No email found in user data');
    }
    this.currentUser = user;
  }

  
  private loadUserFromStorage(): void {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      const role = localStorage.getItem(this.roleKey);
      const nome = localStorage.getItem(this.nomeKey);
      const userId = localStorage.getItem(this.userIdKey);
      const clientId = localStorage.getItem(this.clientIdKey);
      const email = localStorage.getItem(this.userEmailKey);

      this.currentUser = {
        token,
        role: (role as UserRole) || 'CLIENT',
        nome: nome || undefined,
        userId: userId ? parseInt(userId, 10) : undefined,
        clientId: clientId ? parseInt(clientId, 10) : undefined,
        email: email || undefined
      };
    }
  }

  
  validateSession() {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    return this.http.get<any>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).pipe(
      tap((res) => {
        const newUser: UserData = {
        token, 
          role: res.role as UserRole,
          nome: res.nome,
          userId: res.userId,
          email: res.email,
        };
        this.setUserData(newUser);
      }),
      catchError((err) => {
        this.clearStorage();
        throw err;
      })
    );
  }

  
  logout(): void {
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.nomeKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.userEmailKey);
    this.currentUser = null;
  }

  
  isLoggedIn(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token && !!this.currentUser;
  }

  
  getRole(): UserRole | null {
    if (!this.isLoggedIn()) return null;
    return this.currentUser?.role || null;
  }

  
  getNome(): string | null {
    return localStorage.getItem(this.nomeKey);
  }

  
  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  
  isClient(): boolean {
    return this.getRole() === 'CLIENT';
  }

  
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  
  getUserId(): number | null {
    try {
      const userIdStr = localStorage.getItem(this.userIdKey);
      if (!userIdStr) {
        console.warn('userId not found in localStorage');
        return null;
      }
      const userId = parseInt(userIdStr);
      if (isNaN(userId)) {
        console.warn('Invalid userId in localStorage:', userIdStr);
        return null;
      }
      return userId;
    } catch (error) {
      console.error('Error getting userId:', error);
      return null;
    }
  }

  
  getClientId(): number | null {
    try {
      const clientIdStr = localStorage.getItem(this.clientIdKey);
      if (!clientIdStr) {
        return null;
      }
      const clientId = parseInt(clientIdStr);
      if (isNaN(clientId)) {
        console.warn('Invalid clientId in localStorage:', clientIdStr);
        return null;
      }
      return clientId;
    } catch (error) {
      console.error('Error getting clientId:', error);
      return null;
    }
  }
}
