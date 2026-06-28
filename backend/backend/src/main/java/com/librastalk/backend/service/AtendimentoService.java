package com.librastalk.backend.service;

import com.librastalk.backend.model.Atendimento;
import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.model.StatusAtendimento;
import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.repository.AtendimentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AtendimentoService {

    private final AtendimentoRepository atendimentoRepository;

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

        return atendimentoRepository.save(atendimento);
    }

    // Adicione no final do seu AtendimentoService.java se ainda não existirem:

    public Atendimento buscarPorId(Long id) {
        return atendimentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Atendimento não encontrado. ID: " + id));
    }

    public Atendimento salvar(Atendimento atendimento) {
        return atendimentoRepository.save(atendimento);
    }
}