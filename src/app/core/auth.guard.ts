import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.auth.validateSession().pipe(
      map(() => {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRole = route.data?.['role'];
    if (requiredRole) {
      const userRole = this.auth.getRole();
      if (userRole !== requiredRole) {
        this.redirectToUserHome();
        return false;
      }
    }
    return true;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }

  
  private redirectToUserHome(): void {
    const role = this.auth.getRole();
    
    if (role === 'ADMIN' || role === 'CLIENT') {
      this.router.navigate(['/app/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
