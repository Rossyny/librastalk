import { Injectable, signal, WritableSignal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';

// Interface que espelha exatamente a Entidade Mensagem do seu Back-end Java
export interface MensagemChat {
  id?: number;
  atendimentoId: number;
  remetente: 'CLIENTE' | 'ATENDENTE';
  conteudoTexto: String;
  enviadoEm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  
  private stompClient: Client | null = null;
  
  // URL base do seu servidor Spring Boot
  private readonly WS_URL = 'ws://localhost:8080/ws-librastalk';

  // Usando um Subject do RxJS para transmitir novas mensagens recebidas para a tela ativa
  private mensagemSubject = new Subject<MensagemChat>();

  // Signal para monitorar o status de conexão em tempo real na UI (Conectado / Desconectado)
  public conectado: WritableSignal<boolean> = signal(false);

  constructor() {}

  /**
   * Estabelece a conexão WebSocket usando o protocolo STOMP
   * @param atendimentoId ID do atendimento para inscrição automática no canal correspondente
   */
  conectar(atendimentoId: number): void {
    if (this.stompClient && this.stompClient.active) {
      console.log('STOMP: Cliente já está ativo e conectado.');
      return;
    }

    console.log(`STOMP: Tentando conectar no endpoint: ${this.WS_URL}`);

    this.stompClient = new Client({
      brokerURL: this.WS_URL,
      reconnectDelay: 5000, // Tenta reconectar automaticamente a cada 5 segundos se a rede cair
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      // Callback executado quando a conexão com o Spring Boot é homologada (101 Switching Protocols)
      onConnect: (frame) => {
        console.log('STOMP: Conectado com sucesso!', frame);
        this.conectado.set(true);

        // Se inscreve automaticamente na "frequência" do atendimento atual
        this.inscreverNoAtendimento(atendimentoId);
      },

      // Callback executado em caso de erros no protocolo STOMP
      onStompError: (frame) => {
        console.error('STOMP: Erro no Broker - ' + frame.headers['message']);
        console.error('STOMP: Detalhes adicionais: ' + frame.body);
        this.conectado.set(false);
      },

      // Callback executado caso a conexão seja encerrada
      onDisconnect: () => {
        console.log('STOMP: Conexão encerrada.');
        this.conectado.set(false);
      }
    });

    // Ativa o cliente STOMP
    this.stompClient.activate();
  }

  /**
   * Se inscreve no canal de comunicação exclusivo de um atendimento específico
   */
  private inscreverNoAtendimento(atendimentoId: number): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('STOMP: Não é possível se inscrever. Conexão inativa.');
      return;
    }

    const topico = `/topic/atendimento/${atendimentoId}`;
    console.log(`STOMP: Se inscrevendo no canal: ${topico}`);

    this.stompClient.subscribe(topico, (mensagem: IMessage) => {
      if (mensagem.body) {
        try {
          const msgObj: MensagemChat = JSON.parse(mensagem.body);
          console.log('STOMP: Nova mensagem recebida via WebSocket:', msgObj);
          
          // Dispara a mensagem recebida para todos os componentes inscritos neste serviço
          this.mensagemSubject.next(msgObj);
        } catch (e) {
          console.error('STOMP: Erro ao parsear o JSON da mensagem recebida:', e);
        }
      }
    });
  }

  /**
   * Envia uma mensagem para o canal de entrada do chat do Spring Boot (@MessageMapping)
   */
  enviarMensagem(atendimentoId: number, remetente: 'CLIENTE' | 'ATENDENTE', conteudoTexto: string): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.error('STOMP: Não foi possível enviar a mensagem. Conexão inativa.');
      return;
    }

    const payload: MensagemChat = {
      atendimentoId: atendimentoId,
      remetente: remetente,
      conteudoTexto: conteudoTexto
    };

    console.log('STOMP: Enviando payload:', payload);

    // Dispara no canal que mapeia para o @MessageMapping("/chat.enviar") do Spring Boot
    this.stompClient.publish({
      destination: '/app/chat.enviar',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' }
    });
  }

  /**
   * Retorna o Observable contendo a corrente de novas mensagens para que os componentes escutem
   */
  obterMensagens(): Observable<MensagemChat> {
    return this.mensagemSubject.asObservable();
  }

  /**
   * Desconecta o cliente de comunicação ativo e limpa as inscrições
   */
  desconectar(): void {
    if (this.stompClient) {
      console.log('STOMP: Desconectando do servidor de forma ativa...');
      this.stompClient.deactivate();
      this.stompClient = null;
      this.conectado.set(false);
    }
  }
}