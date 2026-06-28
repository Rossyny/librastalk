import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonInput, IonItem, IonIcon, IonButton, 
  IonProgressBar, IonText 
} from '@ionic/angular/standalone';
import { AuthService, LoginDTO } from '../services/auth.service';

// Importe a função addIcons e os ícones específicos do pacote 'ionicons/icons'
import { addIcons } from 'ionicons';
import { 
  flash, mailOutline, lockClosedOutline, logoGoogle, 
  logoApple, arrowBackOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, 
    IonInput, 
    IonItem, 
    IonIcon, 
    IonButton,
    IonProgressBar,
    IonText
  ]
})
export class LoginPage implements OnInit {

  // Modelo de dados de credenciais conectado ao formulário
  credenciais: LoginDTO = {
    email: '',
    senha: ''
  };

  carregando = false;
  mensagemErro = '';

  constructor(private authService: AuthService, private router: Router) {
    // Registra os ícones no construtor para que o HTML os reconheça
    addIcons({ 
      flash, 
      mailOutline, 
      lockClosedOutline, 
      logoGoogle, 
      logoApple,
      arrowBackOutline
    });
  }

  ngOnInit() {}

  /**
   * Executa a tentativa de login consumindo a API Spring Boot
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
        
        // Redirecionamento Inteligente baseado no Perfil de acesso do banco
        if (usuario.perfil === 'ADMIN') {
          console.log('Login: Perfil Administrador detectado. Indo para /admin');
          this.router.navigate(['/admin']);
        } else if (usuario.perfil === 'ATENDENTE') {
          console.log('Login: Perfil Atendente detectado. Indo para /atendente-dashboard');
          this.router.navigate(['/atendente-dashboard']);
        }
      },
      error: (err) => {
        console.error(err);
        this.mensagemErro = err.error?.erro || 'E-mail ou senha incorretos. Tente novamente.';
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