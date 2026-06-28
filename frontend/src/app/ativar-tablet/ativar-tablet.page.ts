import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonContent, IonButton, IonInput, IonItem, IonIcon, 
  IonProgressBar, IonGrid, IonRow, IonCol, IonText 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  tabletPortraitOutline, keyOutline, arrowBackOutline, 
  checkmarkCircleOutline, alertCircleOutline, videocamOutline,
  peopleOutline, volumeMediumOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-ativar-tablet',
  templateUrl: './ativar-tablet.page.html',
  styleUrls: ['./ativar-tablet.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonButton, 
    IonInput, IonItem, IonIcon, IonProgressBar, 
    IonGrid, IonRow, IonCol, IonText
  ]
})
export class AtivarTabletPage implements OnInit {

  // Controladores de Fluxo e Estado
  estaAtivado = false;
  carregando = false;
  erroMensagem: string | null = null;
  sucessoMensagem: string | null = null;

  // Dados do Formulário de Ativação
  tokenDigitado = '';

  // Dados do Guichê (Preenchidos pelo Back-end pós-validação)
  guicheDados: any = null;

  // Estado da chamada do Cliente
  chamandoAtendente = false;

  private readonly API_URL = 'http://localhost:8080/api/auth/tablet';

  constructor(private http: HttpClient, private router: Router) {
    addIcons({
      tabletPortraitOutline,
      keyOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      videocamOutline,
      peopleOutline,
      volumeMediumOutline
    });
  }

  ngOnInit() {
    // Verifica se este tablet já foi ativado previamente e está salvo na memória local do aparelho
    const guicheSalvo = localStorage.getItem('librastalk_tablet_ativo');
    if (guicheSalvo) {
      this.guicheDados = JSON.parse(guicheSalvo);
      this.estaAtivado = true;
    }
  }

  /**
   * Envia o token digitado para o Spring Boot validar no banco PostgreSQL
   */
  ativarEquipamento() {
    if (!this.tokenDigitado.trim()) {
      this.erroMensagem = 'Por favor, insira o token de ativação.';
      return;
    }

    this.carregando = true;
    this.erroMensagem = null;

    // Dispara a requisição HTTP POST para o endpoint que você forneceu no AuthController
    this.http.post(this.API_URL, { token: this.tokenDigitado.toUpperCase() }).subscribe({
      next: (resposta: any) => {
        this.carregando = false;
        this.estaAtivado = true;
        this.guicheDados = resposta;

        // Salva os dados do guichê fisicamente no dispositivo (Persistência pós-F5 ou desligamento)
        localStorage.setItem('librastalk_tablet_ativo', JSON.stringify(resposta));
        this.sucessoMensagem = `Equipamento ativado com sucesso para o guichê ${resposta.numeroIdentificador}!`;
        
        setTimeout(() => this.sucessoMensagem = null, 4000);
      },
      error: (err) => {
        this.carregando = false;
        if (err.error && err.error.erro) {
          this.erroMensagem = err.error.erro;
        } else {
          this.erroMensagem = 'Não foi possível validar o token. Certifique-se de que o back-end está ativo.';
        }
      }
    });
  }

  /**
   * Simula a chamada do atendente (Futuramente integrado via WebSocket)
   */
  alternarChamada() {
    this.chamandoAtendente = !this.chamandoAtendente;
    if (this.chamandoAtendente) {
      console.log(`Solicitação de chamada iniciada para o Guichê #${this.guicheDados?.numeroIdentificador}`);
    } else {
      console.log('Chamada cancelada pelo cliente.');
    }
  }

  /**
   * Desvincula o tablet do estabelecimento (Para testes/mudar de guichê)
   */
  desativarEquipamento() {
    localStorage.removeItem('librastalk_tablet_ativo');
    this.estaAtivado = false;
    this.guicheDados = null;
    this.tokenDigitado = '';
    this.chamandoAtendente = false;
  }

  voltarAoPortal() {
    this.router.navigate(['/welcome']);
  }
}