import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data?.['role'];
    
    if (!requiredRole) {
      return true;
    }

    const userRole = this.auth.getRole();

    if (userRole !== requiredRole) {

      this.router.navigate(['/app/home']);
      return false;
    }

    return true;
  }
}