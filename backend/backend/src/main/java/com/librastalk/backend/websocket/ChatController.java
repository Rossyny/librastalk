package com.librastalk.backend.websocket;

import com.librastalk.backend.model.Atendimento;
import com.librastalk.backend.model.MensagemDialogo;
import com.librastalk.backend.repository.AtendimentoRepository;
import com.librastalk.backend.repository.MensagemDialogoRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller // Indica que esta classe gerencia fluxos de mensagens (neste caso, WebSockets)
@RequiredArgsConstructor // Cria o construtor automaticamente para injetar as dependências abaixo
public class ChatController {

    // Injeção da ferramenta do Spring usada para disparar mensagens via código para os canais
    private final SimpMessagingTemplate messagingTemplate;
    private final MensagemDialogoRepository mensagemRepository;
    private final AtendimentoRepository atendimentoRepository;

    /**
     * Captura as mensagens enviadas pelo front-end.
     * O endereço completo para o front enviar é: /app/chat.enviar
     */
    @MessageMapping("/chat.enviar")
    public void processarMensagem(MensagemPayload payload) {
        
        // 1. Busca o atendimento ativo no banco de dados usando o ID recebido
        Atendimento atendimento = atendimentoRepository.findById(payload.getAtendimentoId())
                .orElseThrow(() -> new RuntimeException("Atendimento não encontrado para este chat."));

        // 2. Cria a entidade de Mensagem mapeando os dados recebidos para salvar no banco
        MensagemDialogo novaMensagem = new MensagemDialogo();
        novaMensagem.setAtendimento(atendimento);
        novaMensagem.setRemetente(payload.getRemetente()); // "ATENDENTE" ou "CLIENTE"
        novaMensagem.setConteudoTexto(payload.getConteudoTexto()); // O texto digitado ou resposta rápida
        novaMensagem.setEnviadoEm(LocalDateTime.now()); // Registra o horário exato da mensagem

        // 3. Salva a mensagem fisicamente na nossa tabela do PostgreSQL
        MensagemDialogo mensagemSalva = mensagemRepository.save(novaMensagem);

        // 4. MÁGICA DO TEMPO REAL: Envia a mensagem salva direto para a "frequência" desse atendimento.
        // O endereço dinâmico será algo como: /topic/atendimento/5
        // Tanto o tablet quanto a tela do PC que estiverem inscritos nesse canal vão receber a mensagem na hora!
        messagingTemplate.convertAndSend("/topic/atendimento/" + payload.getAtendimentoId(), mensagemSalva);
    }
}

/**
 * Classe auxiliar (DTO) que representa o formato exato do JSON que o Ionic vai enviar via WebSocket.
 */
@Data // Gera automaticamente Getters, Setters e ToString do Lombok
class MensagemPayload {
    private Long atendimentoId;
    private String remetente;
    private String conteudoTexto;
}