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

  estaDisponivel: boolean = true;
  atendimentoAtivo: boolean = false;

  chamadoEmAndamento: ChamadoEntrante | null = null;
  mensagens: MensagemChat[] = [];
  textoMensagem: string = '';

  private chatSubscription: Subscription | null = null;
  // 🔥 Guarda a referência da inscrição da fila para cancelar no OnDestroy
  private filaSubscription: StompSubscription | null = null;

  private readonly API_ATENDIMENTOS = 'http://localhost:8080/api/atendimentos';

  // Começa vazio para exibir apenas o que vier dinamicamente do ecossistema librastalk!
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
    // 1. Carrega chamados que já estejam aguardando no banco (Opcional, se o REST/fila existir)
    this.carregarFilaGeralREST();

    // 2. Dispara a conexão e assina a fila em tempo real
    this.conectarEFilarWebSocket();
    
  }

  ngOnDestroy() {
    if (this.chatSubscription) this.chatSubscription.unsubscribe();
    if (this.filaSubscription) this.filaSubscription.unsubscribe();
  }

  carregarDadosDoAtendente() {
    // 1. Tenta pegar o ID direto do localStorage (caso use a chave avulsa)
    let usuarioId = localStorage.getItem('usuarioId') || localStorage.getItem('id_usuario');

    // 🌟 CORREÇÃO CIRÚRGICA: Alinhado com a chave do seu AuthService ('librastalk_sessao')
    const usuarioSalvo = localStorage.getItem('librastalk_sessao');
    if (usuarioSalvo) {
      try {
        const obj = JSON.parse(usuarioSalvo);
        if (obj && obj.id) usuarioId = obj.id.toString();
      } catch (e) {
        console.error('Erro ao fazer parse do usuário do localStorage', e);
      }
    }

    // 2. Se mesmo assim não encontrar nenhum ID (fallback de segurança)
    if (!usuarioId) {
      console.warn('Painel: Nenhum ID de atendente encontrado no localStorage. Usando ID 2 como fallback.');
      usuarioId = '2'; 
    }

    console.log(`Painel: Buscando dados do atendente ID ${usuarioId} no banco de dados...`);

    this.http.get<any>(`http://localhost:8080/api/usuarios/${usuarioId}`).subscribe({
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

  /**
   * 🔥 Conecta globalmente e escuta a fila de chamados do Totem
   */
  conectarEFilarWebSocket() {
    this.wsService.conectarGlobalSeNecessario();

    // Dá um pequeno delay para garantir o handshake do STOMP antes da inscrição
    setTimeout(() => {
      this.filaSubscription = this.wsService.subscrever('/topic/fila', (dadosAtendimento: any) => {
        console.log('⚡ Nova solicitação recebida via WS no Painel:', dadosAtendimento);

        if (dadosAtendimento && dadosAtendimento.status === 'AGUARDANDO') {
          const jaExiste = this.chamados.some(c => c.id === dadosAtendimento.id);
          
          if (!jaExiste) {
            const novoChamado = this.mapearObjetoParaInterface(dadosAtendimento);
            // Empurra para o topo do array visual do painel instantaneamente
            this.chamados.unshift(novoChamado);
          }
        }
      });
    }, 1000);
  }

  /**
   * Transforma a entidade Atendimento vinda do Java no modelo estrutural da UI
   */
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

    const payload = {
      atendimentoId: chamadoId,
      usuarioId: 1
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
            
            // 🚨 CORREÇÃO CIRÚRGICA: Se o cliente encerrou no totem, fecha o painel do atendente na hora!
            if (novaMsg.conteudoTexto === 'SESSAO_ENCERRADA_PELO_CLIENTE') {
              alert('O cliente encerrou o atendimento no totem.');
              this.desconectarChatAtivo(); // Essa função sua já fecha o chat e limpa tudo localmente!
              return;
            }

            this.mensagens.push(novaMsg);
          }
        });

        // Remove da lista de pendentes visto que o atendimento iniciou
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