import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonItem, IonLabel, IonInput, IonButton, IonProgressBar, IonText, IonIcon
} from '@ionic/angular/standalone';
import { AuthService, LoginDTO } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonCard, IonCardHeader, 
    IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, 
    IonButton, IonProgressBar, IonText, IonIcon
  ]
})
export class LoginPage {

  credenciais: LoginDTO = {
    email: '',
    senha: ''
  };

  carregando = false;
  mensagemErro = '';

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Executa a tentativa de login consumindo o serviço de autenticação
   */
  realizarLogin() {
    this.carregando = true;
    this.mensagemErro = '';

    if (!this.credenciais.email || !this.credenciais.senha) {
      this.mensagemErro = 'Por favor, preencha o e-mail e a senha.';
      this.carregando = false;
      return;
    }

    this.authService.login(this.credenciais).subscribe({
      next: (usuario) => {
        this.carregando = false;
        
        // Redirecionamento Inteligente baseado no Perfil cadastrado no banco PostgreSQL
        if (usuario.perfil === 'ADMINISTRADOR') {
          console.log('Login: Sucesso! Perfil Administrador detectado. Redirecionando para /admin');
          this.router.navigate(['/admin']);
        } else if (usuario.perfil === 'ATENDENTE') {
          console.log('Login: Sucesso! Perfil Atendente detectado. Redirecionando para /welcome (Temporário)');
          // No futuro redirecionará para o dashboard do intérprete (/dashboard)
          this.router.navigate(['/welcome']);
        }
      },
      error: (err) => {
        console.error(err);
        this.mensagemErro = err.error?.erro || 'E-mail ou senha inválidos. Tente novamente.';
        this.carregando = false;
      }
    });
  }

  /**
   * Atalho para voltar ao portal principal
   */
  voltarAoPortal() {
    this.router.navigate(['/welcome']);
  }
}