import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonIcon, IonBadge 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, briefcaseOutline, personAddOutline, 
  hardwareChipOutline, keyOutline, settingsOutline, 
  peopleOutline, desktopOutline 
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonButton, IonIcon, IonBadge
  ]
})
export class HomePage implements OnInit {

  gerenteNome = 'Carregando Administrador...';
  estabelecimentoNome = 'Libras Talk Corporate';

  // Contadores simulados para o topo do painel administrativo
  totalAtendentes = 4;
  totalGuiches = 3;

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ 
      logOutOutline, 
      briefcaseOutline, 
      personAddOutline, 
      hardwareChipOutline, 
      keyOutline, 
      settingsOutline,
      peopleOutline,
      desktopOutline
    });
  }

  ngOnInit() {
    // Captura o usuário autenticado via Signal
    const usuario = this.authService.getUsuarioLogado();
    if (usuario) {
      this.gerenteNome = usuario.nome;
      // Se o objeto do banco trouxer dados do estabelecimento, podemos exibir aqui
      if (usuario.estabelecimentoId && usuario.nome) {
        this.estabelecimentoNome = usuario.nome;
      }
    }
  }

  irParaCadastrarAtendente() {
    console.log('Navegando para cadastro de atendentes...');
    // Futura rota: this.router.navigate(['/cadastrar-atendente']);
  }

  irParaGerenciarGuiches() {
    console.log('Navegando para gerenciamento de guichês...');
    // Futura rota: this.router.navigate(['/gerenciar-guiches']);
  }

  gerarNovoToken() {
    const tokenGerado = Math.random().toString(36).substring(2, 8).toUpperCase();
    alert(`Novo Token de Ativação gerado com sucesso: ${tokenGerado}\nUtilize este código para ativar um novo Tablet de Guichê.`);
  }

  fazerLogout() {
    this.authService.logout();
    this.router.navigate(['/welcome']);
  }
}