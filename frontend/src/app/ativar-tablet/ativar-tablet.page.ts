import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
  peopleOutline, volumeMediumOutline, sendOutline, closeCircleOutline
} from 'ionicons/icons';
import { WebSocketService, MensagemChat } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';

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
export class AtivarTabletPage implements OnInit, OnDestroy {

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // Controladores de Fluxo de Telas (Oficiais)
  equipamentoConfigurado: boolean = false;
  etapaInsercaoToken: boolean = false;
  chamandoAtendente: boolean = false;
  chatConectado: boolean = false;

  // Inputs e dados locais (Oficiais)
  tokenInput: string = '';
  guicheDados: any = null;
  mensagemErro: string = '';
  carregando: boolean = false;

  // Dados do Atendimento Ativo (Oficiais)
  atendimentoAtualId: number | null = null;
  mensagens: MensagemChat[] = [];
  textoMensagem: string = '';

  // =========================================================================
  // 🔄 METODOS E GETTERS DE COMPATIBILIDADE COM O TEU HTML
  // =========================================================================
  get estaAtivado(): boolean { return this.equipamentoConfigurado; }
  set estaAtivado(val: boolean) { this.equipamentoConfigurado = val; }

  get tokenAtivacao(): string { return this.tokenInput; }
  set tokenAtivacao(val: string) { this.tokenInput = val; }

  get erroMensagem(): string { return this.mensagemErro; }
  set erroMensagem(val: string) { this.mensagemErro = val; }

  sucessoMensagem: string = ''; 

  // Controla a exibição do botão de encerramento no rodapé
  get atendimentoAtivo(): boolean { return this.chatConectado || this.chamandoAtendente; }
  // =========================================================================

  private chatSubscription: Subscription | null = null;
  private statusSubscription: StompSubscription | null = null;

  private readonly API_ATENDIMENTO_URL = 'http://localhost:8080/api/atendimentos';

  private readonly API_BASE = 'http://localhost:8080/api';

  constructor(private router: Router, private http: HttpClient, private wsService: WebSocketService) {
    addIcons({ 
      tabletPortraitOutline, 
      keyOutline, 
      arrowBackOutline, 
      checkmarkCircleOutline, 
      alertCircleOutline,
      videocamOutline,
      peopleOutline,
      volumeMediumOutline,
      sendOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    this.verificarConfiguracaoPrevia();
  }

  ngOnDestroy() {
    this.desconectarChatAtivo();
  }

  verificarConfiguracaoPrevia() {
    const salvo = localStorage.getItem('librastalk_tablet_ativo');
    if (salvo) {
      this.guicheDados = JSON.parse(salvo);
      this.equipamentoConfigurado = true;
    }
  }

  voltarAoPortal() {
    this.router.navigate(['/portal']);
  }

  avancarParaToken() {
    this.etapaInsercaoToken = true;
    this.mensagemErro = '';
  }

  voltarParaBoasVindas() {
    this.etapaInsercaoToken = false;
    this.tokenInput = '';
    this.mensagemErro = '';
  }

  enviarTokenAtivacao() {
    this.validarTokenEquipamento();
  }

  validarTokenEquipamento() {
    if (!this.tokenInput.trim()) {
      this.mensagemErro = 'Por favor, informe o token de acesso.';
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';
    this.sucessoMensagem = '';

    const payload = { token: this.tokenInput.trim().toUpperCase() };

    this.http.post(`${this.API_BASE}/guiches/validar-token`, payload).subscribe({
      next: (resposta: any) => {
        this.carregando = false;
        this.guicheDados = resposta;
        console.log('===> DADOS DO GUICHÊ RETORNADOS PELO JAVA:', resposta);
        this.sucessoMensagem = 'Equipamento ativado com sucesso!';
        localStorage.setItem('librastalk_tablet_ativo', JSON.stringify(resposta));
        
        setTimeout(() => {
          this.equipamentoConfigurado = true;
          this.etapaInsercaoToken = false;
          this.sucessoMensagem = '';
        }, 1500);
      },
      error: (err) => {
        this.carregando = false;
        console.error('Erro ao validar token:', err);
        this.mensagemErro = err.error?.erro || 'Token inválido ou não cadastrado no sistema.';
      }
    });
  }

  alternarChamada() {
    // Se já estiver na fila (tela roxa) ou conversando (chat ativo), o botão serve para ENCERRAR
    if (this.chamandoAtendente || this.chatConectado) {
      this.encerrarPeloTotem();
    } else {
      // 🔥 CORREÇÃO: Se o totem estiver livre, o clique no botão deve INICIAR a solicitação!
      this.solicitarAtendimento();
    }
  }

  solicitarAtendimento() {
    if (!this.guicheDados || !this.guicheDados.id) return;

    this.chamandoAtendente = true;
    this.mensagemErro = '';

    const payload = { guicheId: this.guicheDados.id };

    this.http.post(`${this.API_BASE}/atendimentos/solicitar`, payload).subscribe({
      next: (resposta: any) => {
        console.log('Totem: Chamado registrado com sucesso na fila!', resposta);
        this.atendimentoAtualId = resposta.id;
        this.conectarEEscutarStatusAtendimento(resposta.id);
      },
      error: (err) => {
        console.error('Totem: Erro ao solicitar chamado:', err);
        this.chamandoAtendente = false;
        alert('Falha ao acionar a fila do atendimento. Tente novamente.');
      }
    });
  }

  conectarEEscutarStatusAtendimento(atendimentoId: number) {
    this.wsService.conectarGlobalSeNecessario();

    setTimeout(() => {
      this.statusSubscription = this.wsService.subscrever(`/topic/atendimento/${atendimentoId}`, (atendimentoAtualizado: any) => {
        console.log('⚡ Atualização de Atendimento recebida no Totem:', atendimentoAtualizado);

        // Cenário 1: O Atendente aceitou o chamado no painel (Muda de AGUARDANDO para EM_ANDAMENTO)
        if (atendimentoAtualizado.status === 'EM_ANDAMENTO' && !this.chatConectado) {
          console.log('🎉 Atendente aceitou o chamado! Mudando estados e abrindo chat no Totem...');
          this.chamandoAtendente = false; // 🔥 Correção aqui: Desliga a tela roxa de espera imediatamente
          this.ativarJanelaConversaWS(atendimentoId);
        }

        // Cenário 2: O atendimento foi concluído pelo atendente
        if (atendimentoAtualizado.status === 'CONCLUIDO') {
          console.log('🚪 Atendimento finalizado pelo intérprete. Resetando Totem...');
          alert('Atendimento concluído com sucesso. Obrigado!');
          this.desconectarChatAtivo();
        }
      });
    }, 1000);
  }

  /**
   * Ativa a tela de conversa por chat e subscreve no fluxo de mensagens
   */
  ativarJanelaConversaWS(atendimentoId: number) {
    this.chamandoAtendente = false; // 🔥 Redundância de segurança para garantir a limpeza da tela de espera
    this.chatConectado = true;
    
    this.wsService.conectar(atendimentoId);

    if (this.chatSubscription) this.chatSubscription.unsubscribe();

    this.chatSubscription = this.wsService.obterMensagens().subscribe({
      next: (novaMsg: MensagemChat) => {
        if (!this.chatConectado) this.chatConectado = true;
        this.mensagens.push(novaMsg);
        this.rolarChatParaBaixo();
      }
    });
  }

  encerrarPeloTotem() {
    if (!this.atendimentoAtualId) {
      this.desconectarChatAtivo();
      return;
    }

    const mensagemConfirmacao = this.chatConectado 
      ? 'Deseja realmente encerrar este atendimento?' 
      : 'Deseja realmente desistir da fila de espera?';

    if (confirm(mensagemConfirmacao)) {
      
      // 🚨 CORREÇÃO: Só envia o comando via WebSocket se o chat REALMENTE estiver conectado!
      // Se estiver apenas na fila de espera, pula essa parte para não travar o botão.
      if (this.chatConectado) {
        try {
          this.wsService.enviarMensagem(this.atendimentoAtualId, 'CLIENTE', 'SESSAO_ENCERRADA_PELO_CLIENTE');
        } catch (e) {
          console.error('Erro ao enviar mensagem de encerramento via WS:', e);
        }
      }

      // Executa o POST para o Java atualizar o banco de dados normalmente
      this.http.post(`${this.API_ATENDIMENTO_URL}/finalizar/${this.atendimentoAtualId}`, {}).subscribe({
        next: () => {
          console.log('Totem: Atendimento encerrado com sucesso no servidor.');
          this.desconectarChatAtivo();
        },
        error: (err) => {
          console.error('Erro ao comunicar encerramento ao servidor:', err);
          this.desconectarChatAtivo();
        }
      });
    }
  }

  enviarMensagemWS() {
    if (!this.textoMensagem.trim() || !this.atendimentoAtualId) return;

    this.wsService.enviarMensagem(this.atendimentoAtualId, 'CLIENTE', this.textoMensagem);
    this.textoMensagem = '';
    this.rolarChatParaBaixo();
  }

  private desconectarChatAtivo() {
    this.chamandoAtendente = false;
    this.chatConectado = false;
    this.atendimentoAtualId = null;
    this.mensagens = [];

    if (this.chatSubscription) this.chatSubscription.unsubscribe();
    if (this.statusSubscription) this.statusSubscription.unsubscribe();

    this.wsService.desconectar();
  }

  desativarEquipamento() {
    this.desconectarChatAtivo();
    localStorage.removeItem('librastalk_tablet_ativo');
    this.guicheDados = null;
    this.equipamentoConfigurado = false;
    this.tokenInput = '';
  }

  private rolarChatParaBaixo() {
    setTimeout(() => {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}