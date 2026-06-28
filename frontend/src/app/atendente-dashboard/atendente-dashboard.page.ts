import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonContent, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonText, IonIcon, IonBadge, IonToggle 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, headsetOutline, personOutline, 
  radioOutline, callOutline, alertCircleOutline,
  chatboxEllipsesOutline, videocamOutline
} from 'ionicons/icons';

// Interface fictícia para simular chamados em tempo real vindos do PostgreSQL/WebSocket
export interface ChamadoEntrante {
  id: number;
  guicheNumero: number;
  localizacao: string;
  horarioSolicitacao: string;
  tempoEspera: string;
}

@Component({
  selector: 'app-atendente-dashboard',
  templateUrl: './atendente-dashboard.page.html',
  styleUrls: ['./atendente-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonGrid, IonRow, IonCol, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonButton, IonText, IonIcon, IonBadge, IonToggle
  ]
  })
export class AtendenteDashboardPage implements OnInit {

  // Informações do atendente (simulado a partir do que viria do Auth)
  atendenteNome = 'Amanda Nogueira';
  atendentePerfil = 'Intérprete de Libras Júnior';

  // Controle de Estado de Disponibilidade do Atendente
  estaDisponivel = true;

  // Lista simulada de chamados que apareceriam via WebSocket quando um tablet clicasse em "Chamar"
  chamados: ChamadoEntrante[] = [
    {
      id: 104,
      guicheNumero: 3,
      localizacao: 'Caixa Rápido - Setor A',
      horarioSolicitacao: '13:48',
      tempoEspera: '45s'
    },
    {
      id: 105,
      guicheNumero: 7,
      localizacao: 'Balcão de Atendimento Central',
      horarioSolicitacao: '13:49',
      tempoEspera: '10s'
    }
  ];

  constructor(private router: Router) {
    addIcons({ 
      logOutOutline, 
      headsetOutline, 
      personOutline, 
      radioOutline, 
      callOutline, 
      alertCircleOutline,
      chatboxEllipsesOutline,
      videocamOutline
    });
  }

  ngOnInit() {}

  /**
   * Altera o estado do atendente entre Disponível e Ocupado
   */
  alternarStatus(event: any) {
    this.estaDisponivel = event.detail.checked;
  }

  /**
   * Simula a aceitação do chamado para abrir a sala de conferência (WebRTC/WebSocket)
   */
  aceitarChamado(chamadoId: number) {
    console.log(`Chamado #${chamadoId} aceito! Conectando vídeo e chat...`);
    // Futuramente, essa função redirecionará para a tela de atendimento ativo (/sala-atendimento/:id)
    alert(`Conectando com absoluto sucesso ao Guichê do chamado #${chamadoId}! Iniciando WebRTC...`);
  }

  /**
   * Realiza o logout e limpa a sessão voltando para o Portal
   */
  fazerLogout() {
    this.router.navigate(['/welcome']);
  }
}