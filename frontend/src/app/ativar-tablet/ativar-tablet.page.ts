import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject, DestroyRef } from '@angular/core';
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
import { VlibrasService } from '../services/vlibras.service';
import { environment } from '../../environments/environment'; // <-- IMPORTANTE: Conexão com o ambiente dinâmico

@Component({
  selector: 'app-ativar-tablet',
  templateUrl: './ativar-tablet.page.html',
  styleUrls: ['./ativar-tablet.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonButton, 
    IonInput, IonItem, IonIcon, IonProgressBar, 
    IonGrid, IonRow, IonCol, IonText
  ],
  providers: [VlibrasService]
})
export class AtivarTabletPage implements OnInit, OnDestroy {

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  exibirTecladoVirtual: boolean = false;

  linhasTeclado = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ' ', 'BACKSPACE']
  ];

  // Controladores de Fluxo de Telas
  equipamentoConfigurado: boolean = false;
  etapaInsercaoToken: boolean = false;
  chamandoAtendente: boolean = false;
  chatConectado: boolean = false;

  // Inputs e dados locais
  tokenInput: string = '';
  guicheDados: any = null;
  mensagemErro: string = '';
  carregando: boolean = false;

  // Dados do Atendimento Ativo
  atendimentoAtualId: number | null = null;
  mensagens: MensagemChat[] = [];
  textoMensagem: string = '';

  // Getters e Setters de Compatibilidade
  get estaAtivado(): boolean { return this.equipamentoConfigurado; }
  set estaAtivado(val: boolean) { this.equipamentoConfigurado = val; }

  get tokenAtivacao(): string { return this.tokenInput; }
  set tokenAtivacao(val: string) { this.tokenInput = val; }

  get erroMensagem(): string { return this.mensagemErro; }
  set erroMensagem(val: string) { this.mensagemErro = val; }

  sucessoMensagem: string = ''; 

  get atendimentoAtivo(): boolean { return this.chatConectado || this.chamandoAtendente; }

  private chatSubscription: Subscription | null = null;
  private statusSubscription: StompSubscription | null = null;

  // Substituído o texto estático de localhost pelas variáveis globais de ambiente
  private readonly API_ATENDIMENTO_URL = `${environment.apiUrl}/api/atendimentos`;
  private readonly API_BASE = `${environment.apiUrl}/api`;

  constructor(
    private router: Router, 
    private http: HttpClient, 
    private wsService: WebSocketService, 
    private vlibrasService: VlibrasService
  ) {
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
    const tabletSalvo = localStorage.getItem('librastalk_tablet_ativo');
    if (tabletSalvo) {
      this.guicheDados = JSON.parse(tabletSalvo);
      this.equipamentoConfigurado = true;
    }

    // Abertura automática do VLibras
    setTimeout(() => {
      try {
        const botaoVlibras = document.querySelector('[vw-access-button]') as HTMLElement;
        if (botaoVlibras) {
          console.log('Totem: Forçando abertura automática do widget VLibras...');
          botaoVlibras.click();
        }
      } catch (e) {
        console.error('Totem: Erro ao tentar abrir o VLibras automaticamente:', e);
      }
    }, 2500);
  }

  ngOnDestroy() {
    this.desconectarChatAtivo();
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
    if (this.chamandoAtendente || this.chatConectado) {
      this.encerrarPeloTotem();
    } else {
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

        if (atendimentoAtualizado.status === 'EM_ANDAMENTO' && !this.chatConectado) {
          console.log('🎉 Atendente aceitou o chamado! Mudando estados e abrindo chat no Totem...');
          this.chamandoAtendente = false;
          this.ativarJanelaConversaWS(atendimentoId);
        }

        if (atendimentoAtualizado.status === 'CONCLUIDO') {
          console.log('🚪 Atendimento finalizado pelo intérprete. Resetando Totem...');
          alert('Atendimento concluído com sucesso. Obrigado!');
          this.desconectarChatAtivo();
        }
      });
    }, 1000);
  }

  ativarJanelaConversaWS(atendimentoId: number) {
    this.chamandoAtendente = false;
    this.chatConectado = true;
    
    this.wsService.conectar(atendimentoId);

    if (this.chatSubscription) this.chatSubscription.unsubscribe();

    this.chatSubscription = this.wsService.obterMensagens().subscribe({
      next: (novaMsg: MensagemChat) => {
        if (!this.chatConectado) this.chatConectado = true;
        this.mensagens.push(novaMsg);
        this.rolarChatParaBaixo();

        const textoParaTraduzir = novaMsg.conteudoTexto || (novaMsg as any).texto;
        if (novaMsg.remetente === 'ATENDENTE' && textoParaTraduzir) {
          this.traduzirTextoParaLibras(textoParaTraduzir);
        }
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
      if (this.chatConectado) {
        try {
          this.wsService.enviarMensagem(this.atendimentoAtualId, 'CLIENTE', 'SESSAO_ENCERRADA_PELO_CLIENTE');
        } catch (e) {
          console.error('Erro ao enviar mensagem de encerramento via WS:', e);
        }
      }

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

    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
      this.chatSubscription = null;
    }
    
    if (this.statusSubscription) {
      if (typeof this.statusSubscription.unsubscribe === 'function') {
        this.statusSubscription.unsubscribe();
      }
      this.statusSubscription = null;
    }

    this.wsService.desconectar();
  }

  desativarEquipamento() {
      if (!this.guicheDados || !this.guicheDados.id) {
        this.limparDadosLocaisEInterface();
        return;
      }

      this.carregando = true;

      // Monta o body exatamente como o seu método Java espera: { "id": guicheId }
      const payload = { id: this.guicheDados.id };

      this.http.post(`${this.API_BASE}/guiches/desconectar`, payload).subscribe({
        next: (resposta: any) => {
          console.log('Totem: Guichê desconectado com sucesso no backend:', resposta);
          this.carregando = false;
          this.limparDadosLocaisEInterface();
        },
        error: (err) => {
          console.error('Erro ao desconectar guichê no servidor:', err);
          this.carregando = false;
          // Mesmo se houver erro de rede, limpa a interface do tablet para não travar o usuário
          this.limparDadosLocaisEInterface();
        }
      });
    }

  private limparDadosLocaisEInterface() {
    this.desconectarChatAtivo();
    localStorage.removeItem('librastalk_tablet_ativo');
    this.guicheDados = null;
    this.equipamentoConfigurado = false;
    this.tokenInput = '';
    this.vlibrasService.exibirWidget(false);
  }

  private rolarChatParaBaixo() {
    setTimeout(() => {
      if (this.scrollContainer && this.scrollContainer.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // Métodos do Teclado Virtual
  abrirTeclado() {
    this.exibirTecladoVirtual = true;
  }

  fecharTeclado() {
    this.exibirTecladoVirtual = false;
  }

  digitarTecla(tecla: string) {
    if (tecla === 'BACKSPACE') {
      this.textoMensagem = this.textoMensagem.slice(0, -1);
    } else {
      this.textoMensagem += tecla;
    }
  }

  private traduzirTextoParaLibras(texto: string) {
    setTimeout(() => {
      try {
        const textoTratado = String(texto).trim();
        if (!textoTratado) return;

        const pluginWrapper = document.querySelector('[vw-plugin-wrapper]');
        const isWrapperVisible = pluginWrapper && (
          pluginWrapper.classList.contains('active') || 
          window.getComputedStyle(pluginWrapper).display !== 'none'
        );

        if (!isWrapperVisible) {
          const btnAcesso = document.querySelector('[vw-access-button]') as HTMLElement;
          if (btnAcesso) {
            console.log('VLibras Talk: Avatar fechado. Abrindo...');
            btnAcesso.click();
          }
        }

        // @ts-ignore
        const widget = window.vlibrasWidget;

        if (widget && typeof widget.translate === 'function') {
          console.log('VLibras Talk: Traduzindo via API oficial do widget...');
          widget.translate(textoTratado);
          return;
        }

        console.log('VLibras Talk: Disparando evento customizado vp-widget-translate...');
        const eventoTraducao = new CustomEvent('vp-widget-translate', {
          detail: { text: textoTratado }
        });
        window.dispatchEvent(eventoTraducao);

        const vlibrasInput = document.querySelector('[vw-plugin-wrapper] input.vp-input') as HTMLInputElement ||
                             document.querySelector('.vw-plugin-wrapper input') as HTMLInputElement;

        if (vlibrasInput) {
          console.log('VLibras Talk: Traduzindo via input interno do player...');
          vlibrasInput.value = textoTratado;
          vlibrasInput.dispatchEvent(new Event('input', { bubbles: true }));

          const btnTraduzirInterno = document.querySelector('[vw-plugin-wrapper] .vp-action-icon') as HTMLButtonElement ||
                                     document.querySelector('.vw-plugin-wrapper button') as HTMLButtonElement;
          
          if (btnTraduzirInterno) {
            btnTraduzirInterno.click();
          }
        }
      } catch (error) {
        console.error('Erro ao acionar a tradução automática do VLibras:', error);
      }
    }, 300);
  }
}