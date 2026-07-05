package com.librastalk.backend.service;

import com.librastalk.backend.model.Atendimento;
import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.model.StatusAtendimento;
import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.repository.AtendimentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.librastalk.backend.repository.GuicheRepository;
import com.librastalk.backend.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
public class AtendimentoService {

    private final AtendimentoRepository atendimentoRepository;
    private final GuicheRepository guicheRepository;
    private final UsuarioRepository usuarioRepository;
    private final SimpMessagingTemplate messagingTemplate; // Para enviar mensagens via WebSocket

    // Método para iniciar uma nova conversa
    public Atendimento iniciarAtendimento(Usuario usuario, Guiche guiche, String tipoDeficiencia) {
        
        // Regra de Negócio 1: O guichê já está em uso?
        List<Atendimento> atendimentosGuiche = atendimentoRepository.findByGuicheIdAndStatus(guiche.getId(), StatusAtendimento.EM_ANDAMENTO);
        if (!atendimentosGuiche.isEmpty()) {
            throw new RuntimeException("Este guichê já possui um atendimento em andamento.");
        }

        // Regra de Negócio 2: O atendente já está em outra chamada?
        List<Atendimento> atendimentosUsuario = atendimentoRepository.findByUsuarioIdAndStatus(usuario.getId(), StatusAtendimento.EM_ANDAMENTO);
        if (!atendimentosUsuario.isEmpty()) {
            throw new RuntimeException("Este atendente já está focado em outro atendimento.");
        }

        // Se passou pelas regras, criamos a sessão
        Atendimento novoAtendimento = new Atendimento();
        novoAtendimento.setUsuario(usuario);
        novoAtendimento.setGuiche(guiche);
        novoAtendimento.setDataInicio(LocalDateTime.now());
        novoAtendimento.setStatus(StatusAtendimento.EM_ANDAMENTO);
        novoAtendimento.setTipoDeficiencia(tipoDeficiencia);

        return atendimentoRepository.save(novoAtendimento);
    }

    // Método para encerrar a conversa
    public Atendimento finalizarAtendimento(Long atendimentoId) {
        Atendimento atendimento = atendimentoRepository.findById(atendimentoId)
                .orElseThrow(() -> new RuntimeException("Atendimento não encontrado."));

        atendimento.setStatus(StatusAtendimento.CONCLUIDO);
        atendimento.setDataFim(LocalDateTime.now());

        Atendimento finalizado = atendimentoRepository.save(atendimento);

        // 🔥 NOTIFICA O TOTEM EM TEMPO REAL QUE O ATENDIMENTO FOI ENCERRADO
        try {
            System.out.println("===> Sinalizando encerramento do Atendimento ID: " + atendimentoId);
            // Envia tanto para o canal exclusivo do atendimento quanto para um canal específico que o totem vai ler
            messagingTemplate.convertAndSend("/topic/atendimento/" + atendimentoId, finalizado);
        } catch (Exception e) {
            System.err.println("⚠️ Falha ao notificar encerramento via WS: " + e.getMessage());
        }

        return finalizado;
    }

    // Adicione no final do seu AtendimentoService.java se ainda não existirem:

    public Atendimento buscarPorId(Long id) {
        return atendimentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Atendimento não encontrado. ID: " + id));
    }

    public Atendimento salvar(Atendimento atendimento) {
        return atendimentoRepository.save(atendimento);
    }

    public Atendimento criarSolicitacao(Long guicheId) {
        Guiche guiche = guicheRepository.findById(guicheId)
                .orElseThrow(() -> new RuntimeException("Guichê não encontrado. ID: " + guicheId));

        com.librastalk.backend.model.Usuario usuarioPadrao = usuarioRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Nenhum operador cadastrado para iniciar o chamado da fila."));

        Atendimento atendimento = new Atendimento();
        atendimento.setGuiche(guiche);
        atendimento.setUsuario(usuarioPadrao);
        atendimento.setDataInicio(java.time.LocalDateTime.now());
        atendimento.setStatus(StatusAtendimento.AGUARDANDO);
        atendimento.setTipoDeficiencia("AUDITIVA");

        // Salva no banco de dados
        Atendimento salvo = atendimentoRepository.save(atendimento);

        // 🔥 NOTIFICA O PAINEL DO ATENDENTE EM TEMPO REAL VIA WEBSOCKET!
        // Enviamos para o tópico que o dashboard do atendente fica escutando
        try {
            System.out.println("===> Disparando notificação via WebSocket para a fila de atendimento...");
            messagingTemplate.convertAndSend("/topic/fila", salvo);
        } catch (Exception e) {
            System.err.println("⚠️ Falha ao enviar mensagem via WS, mas o registro foi salvo: " + e.getMessage());
        }

        return salvo;
    }
}