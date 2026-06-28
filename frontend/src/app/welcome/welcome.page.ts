import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonText, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { briefcaseOutline, headsetOutline, tabletPortraitOutline, sparklesOutline } from 'ionicons/icons';

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

  constructor(private router: Router) {
    // Trocamos micOutline por headsetOutline (combina muito mais com Atendente!)
    addIcons({ 
      briefcaseOutline, 
      headsetOutline, 
      tabletPortraitOutline, 
      sparklesOutline 
    });
  }

  irParaGerente() {
    this.router.navigate(['/login']);
  }

  /**
   * Navega para a tela de login do Atendente corporativo
   */
  irParaAtendente() {
    this.router.navigate(['/login']);
  }

  irParaTablet() {
    this.router.navigate(['/login']);
  }
}