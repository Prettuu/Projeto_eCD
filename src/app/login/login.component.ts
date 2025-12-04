import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  senha = '';
  erro = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    if (this.auth.isLoggedIn()) {
      this.redirectByRole();
    }
  }

  
  login(event?: Event): void {
    if (event) event.preventDefault();
    
    this.erro = '';
    this.loading = true;

    if (!this.email || !this.senha) {
      this.erro = 'Preencha todos os campos.';
      this.loading = false;
      return;
    }

    this.auth.login(this.email, this.senha).subscribe({
      next: () => {

        this.loading = false;
      },
      error: (err) => {
        this.erro = err?.error?.message || err?.message || 'Usuário ou senha incorretos.';
        this.loading = false;
      }
    });
  }

  
  private redirectByRole(): void {
    this.router.navigate(['/app/home']);
  }

  
  primeiroAcesso(): void {
    this.router.navigate(['/register/create']);
  }
}
