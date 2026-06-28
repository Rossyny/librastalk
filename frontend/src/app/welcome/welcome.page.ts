import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonText, IonIcon 
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonButton, IonText, IonIcon
  ]
})
export class WelcomePage {

  constructor(private router: Router) {}

  /**
   * Navega para o painel administrativo do Gerente
   */
  irParaGerente() {
    this.router.navigate(['/login']);
  }

  /**
   * Navega para a tela de autenticação unificada antes de ir para o dashboard
   */
  irParaInterprete() {
    this.router.navigate(['/login']);
  }

  /**
   * Navega para a tela de ativação do tablet do Guichê físico
   */
  irParaTablet() {
    // Rota que criaremos a seguir
    this.router.navigate(['/ativar-tablet']);
  }
}