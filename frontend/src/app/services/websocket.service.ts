import { Injectable, signal, WritableSignal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MensagemChat {
  id?: number;
  atendimentoId: number;
  remetente: 'CLIENTE' | 'ATENDENTE';
  conteudoTexto: string;
  enviadoEm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  
  private stompClient: Client | null = null;
  
  // Lógica inteligente: se a API for https (produção), usa wss://. Se for http (local), usa ws://
  private readonly WS_URL = environment.apiUrl.startsWith('https')
    ? `${environment.apiUrl.replace('https://', 'wss://')}/ws-librastalk`
    : `${environment.apiUrl.replace('http://', 'ws://')}/ws-librastalk`;

  private mensagemSubject = new Subject<MensagemChat>();
  public conectado: WritableSignal<boolean> = signal(false);

  constructor() {}

  /**
   * 🔥 NOVO: Conecta ao WebSocket de forma global (usado na abertura do Painel)
   * sem precisar estar preso a um chat de atendimento específico.
   */
  conectarGlobalSeNecessario(): void {
    if (this.stompClient && this.stompClient.active) {
      console.log('STOMP: Cliente já está conectado globalmente.');
      return;
    }

    console.log(`STOMP: Inicializando conexão global no endpoint: ${this.WS_URL}`);

    this.stompClient = new Client({
      brokerURL: this.WS_URL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: (frame) => {
        console.log('STOMP: Conectado globalmente com sucesso!', frame);
        this.conectado.set(true);
      },
      onStompError: (frame) => {
        console.error('STOMP: Erro no Broker - ' + frame.headers['message']);
        this.conectado.set(false);
      },
      onDisconnect: () => {
        console.log('STOMP: Conexão encerrada.');
        this.conectado.set(false);
      }
    });

    this.stompClient.activate();
  }

  /**
   * 🔥 NOVO: Permite que qualquer componente se inscreva em um tópico genérico
   * e execute uma ação sempre que uma mensagem chegar.
   */
  subscrever(topico: string, callback: (dados: any) => void): StompSubscription | null {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error(`STOMP: Não foi possível se inscrever em ${topico}. Conexão inativa.`);
      return null;
    }

    console.log(`STOMP: Criando subscrição no canal: ${topico}`);
    return this.stompClient.subscribe(topico, (mensagem: IMessage) => {
      if (mensagem.body) {
        try {
          const payload = JSON.parse(mensagem.body);
          callback(payload);
        } catch (e) {
          console.error('STOMP: Erro ao processar payload do tópico ' + topico, e);
        }
      }
    });
  }

  /**
   * Estabelece a conexão WebSocket e vincula a um chat específico
   */
  conectar(atendimentoId: number): void {
    // Se o cliente já existir e estiver ativo (pela conexão global), apenas faz o bind do canal de chat
    if (this.stompClient && this.stompClient.connected) {
      this.inscreverNoAtendimento(atendimentoId);
      return;
    }

    this.conectarGlobalSeNecessario();
    // Aguarda um breve instante para a conexão firmar e assina o canal
    setTimeout(() => this.inscreverNoAtendimento(atendimentoId), 500);
  }

  private inscreverNoAtendimento(atendimentoId: number): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    const topico = `/topic/atendimento/${atendimentoId}`;
    console.log(`STOMP: Se inscrevendo no canal de chat exclusivo: ${topico}`);

    this.stompClient.subscribe(topico, (mensagem: IMessage) => {
      if (mensagem.body) {
        try {
          const msgObj: MensagemChat = JSON.parse(mensagem.body);
          this.mensagemSubject.next(msgObj);
        } catch (e) {
          console.error('STOMP: Erro ao parsear o JSON da mensagem recebida:', e);
        }
      }
    });
  }

  enviarMensagem(atendimentoId: number, remetente: 'CLIENTE' | 'ATENDENTE', conteudoTexto: string): void {
    if (!this.stompClient || !this.stompClient.connected) return;

    const payload: MensagemChat = {
      atendimentoId: atendimentoId,
      remetente: remetente,
      conteudoTexto: conteudoTexto
    };

    this.stompClient.publish({
      destination: '/app/chat.enviar',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' }
    });
  }

  obterMensagens(): Observable<MensagemChat> {
    return this.mensagemSubject.asObservable();
  }

  desconectar(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.conectado.set(false);
    }
  }
}