import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonContent, IonGrid, IonRow, IonCol, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, 
  IonButton, IonText, IonIcon, IonBadge, IonToggle, IonItem, IonInput
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, headsetOutline, personOutline, 
  radioOutline, callOutline, alertCircleOutline,
  chatboxEllipsesOutline, videocamOutline, sendOutline
} from 'ionicons/icons';
import { WebSocketService, MensagemChat } from '../services/websocket.service';
import { Subscription } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';
import { environment } from '../../environments/environment'; // <-- IMPORTANTE: Conexão com o ambiente dinâmico

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
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonButton, 
    IonText, 
    IonIcon, 
    IonBadge, 
    IonToggle,
    IonItem,
    IonInput
  ]
})
export class AtendenteDashboardPage implements OnInit, OnDestroy {

  atendenteNome: string = '';
  atendentePerfil: string = 'Atendente de Caixa';
  atendenteId: number = 2; // ID padrão de fallback caso não encontre no localStorage

  estaDisponivel: boolean = true;
  atendimentoAtivo: boolean = false;

  chamadoEmAndamento: ChamadoEntrante | null = null;
  mensagens: MensagemChat[] = [];
  textoMensagem: string = '';

  private chatSubscription: Subscription | null = null;
  private filaSubscription: StompSubscription | null = null;

  // Substituído o texto estático de localhost pelas variáveis globais de ambiente
  private readonly API_ATENDIMENTOS = `${environment.apiUrl}/api/atendimentos`;

  chamados: ChamadoEntrante[] = [];

  constructor(private router: Router, private http: HttpClient, private wsService: WebSocketService) {
    addIcons({ 
      logOutOutline, 
      headsetOutline, 
      personOutline, 
      radioOutline, 
      callOutline, 
      alertCircleOutline,
      chatboxEllipsesOutline,
      videocamOutline,
      sendOutline
    });
  }

  ngOnInit() {
    this.carregarDadosDoAtendente();
    this.carregarFilaGeralREST();
    this.conectarEFilarWebSocket();
  }

  ngOnDestroy() {
    if (this.chatSubscription) this.chatSubscription.unsubscribe();
    if (this.filaSubscription) this.filaSubscription.unsubscribe();
  }

  carregarDadosDoAtendente() {
    let usuarioIdStr = localStorage.getItem('usuarioId') || localStorage.getItem('id_usuario');

    const usuarioSalvo = localStorage.getItem('librastalk_sessao');
    if (usuarioSalvo) {
      try {
        const obj = JSON.parse(usuarioSalvo);
        if (obj && obj.id) usuarioIdStr = obj.id.toString();
      } catch (e) {
        console.error('Erro ao fazer parse do usuário do localStorage', e);
      }
    }

    if (!usuarioIdStr) {
      console.warn('Painel: Nenhum ID de atendente encontrado no localStorage. Usando ID 2 como fallback.');
      usuarioIdStr = '2'; 
    }

    this.atendenteId = Number(usuarioIdStr);
    console.log(`Painel: Buscando dados do atendente ID ${this.atendenteId} no banco de dados...`);

    // Substituído a URL estática por environment.apiUrl
    this.http.get<any>(`${environment.apiUrl}/api/usuarios/${this.atendenteId}`).subscribe({
      next: (usuarioDoBanco) => {
        this.atendenteNome = usuarioDoBanco.nome;
        
        if (usuarioDoBanco.perfil === 'ATENDENTE') {
          this.atendentePerfil = 'Atendente de Caixa';
        } else if (usuarioDoBanco.perfil === 'ADMIN') {
          this.atendentePerfil = 'Administrador do Sistema';
        } else {
          this.atendentePerfil = usuarioDoBanco.perfil || 'Operador do Painel';
        }
        
        console.log('Painel: Nome do atendente carregado com sucesso:', this.atendenteNome);
      },
      error: (err) => {
        console.error('Painel: Erro ao buscar nome do atendente no banco:', err);
        this.atendenteNome = 'Atendente Ativo';
        this.atendentePerfil = 'Intérprete de Libras Certificado';
      }
    });
  }

  carregarFilaGeralREST() {
    this.http.get<any[]>(`${this.API_ATENDIMENTOS}/fila`).subscribe({
      next: (dados) => {
        if (dados && Array.isArray(dados)) {
          this.chamados = dados.map(atend => this.mapearObjetoParaInterface(atend));
        }
      },
      error: (err) => console.log('Endpoint HTTP /fila não consultado ou sem registros prévios.')
    });
  }

  conectarEFilarWebSocket() {
    this.wsService.conectarGlobalSeNecessario();

    setTimeout(() => {
      this.filaSubscription = this.wsService.subscrever('/topic/fila', (dadosAtendimento: any) => {
        console.log('⚡ Nova solicitação recebida via WS no Painel:', dadosAtendimento);

        if (dadosAtendimento && dadosAtendimento.status === 'AGUARDANDO') {
          const jaExiste = this.chamados.some(c => c.id === dadosAtendimento.id);
          
          if (!jaExiste) {
            const novoChamado = this.mapearObjetoParaInterface(dadosAtendimento);
            this.chamados.unshift(novoChamado);
          }
        }
      });
    }, 1000);
  }

  private mapearObjetoParaInterface(atend: any): ChamadoEntrante {
    return {
      id: atend.id,
      guicheNumero: atend.guiche?.id || 1,
      localizacao: atend.guiche?.identificacao || 'Totem de Atendimento',
      horarioSolicitacao: atend.dataInicio ? new Date(atend.dataInicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : 'Agora',
      tempoEspera: '0s'
    };
  }

  alternarStatus(event: any) {
    this.estaDisponivel = event.detail.checked;
  }

  aceitarChamado(chamadoId: number) {
    const chamadoEncontrado = this.chamados.find(c => c.id === chamadoId);
    if (!chamadoEncontrado) return;

    // Envia dinamicamente o ID do atendente autenticado no sistema
    const payload = {
      atendimentoId: chamadoId,
      usuarioId: this.atendenteId
    };

    this.http.post(`${this.API_ATENDIMENTOS}/iniciar`, payload).subscribe({
      next: (resposta: any) => {
        console.log('API: Atendimento iniciado com sucesso', resposta);
        
        this.chamadoEmAndamento = chamadoEncontrado;
        this.atendimentoAtivo = true;

        if (this.chatSubscription) this.chatSubscription.unsubscribe();

        this.wsService.conectar(chamadoId);

        this.chatSubscription = this.wsService.obterMensagens().subscribe({
          next: (novaMsg: MensagemChat) => {
            if (novaMsg.conteudoTexto === 'SESSAO_ENCERRADA_PELO_CLIENTE') {
              alert('O cliente encerrou o atendimento no totem.');
              this.desconectarChatAtivo();
              return;
            }

            this.mensagens.push(novaMsg);
          }
        });

        this.chamados = this.chamados.filter(c => c.id !== chamadoId);
      },
      error: (err) => {
        console.error('API: Erro ao tentar iniciar atendimento:', err);
        alert('Não foi possível iniciar o chamado.');
      }
    });
  }

  enviarMensagemWS() {
    if (!this.textoMensagem.trim() || !this.chamadoEmAndamento) return;
    this.wsService.enviarMensagem(this.chamadoEmAndamento.id, 'ATENDENTE', this.textoMensagem);
    this.textoMensagem = '';
  }

  finalizarAtendimentoAtual() {
    if (!this.chamadoEmAndamento) return;

    this.http.post(`${this.API_ATENDIMENTOS}/finalizar/${this.chamadoEmAndamento.id}`, {}).subscribe({
      next: () => this.desconectarChatAtivo(),
      error: () => this.desconectarChatAtivo()
    });
  }

  private desconectarChatAtivo() {
    if (this.chamadoEmAndamento) {
      const idRemover = this.chamadoEmAndamento.id;
      this.chamados = this.chamados.filter(c => c.id !== idRemover);
    }
    this.atendimentoAtivo = false;
    this.chamadoEmAndamento = null;
    this.mensagens = [];
    if (this.chatSubscription) this.chatSubscription.unsubscribe();
  }

  fazerLogout() {
    this.router.navigate(['/login']);
  }
}
