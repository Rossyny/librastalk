package com.librastalk.backend.repository;

import com.librastalk.backend.model.MensagemDialogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MensagemDialogoRepository extends JpaRepository<MensagemDialogo, Long> {
    List<MensagemDialogo> findByAtendimentoIdOrderByEnviadoEmAsc(Long atendimentoId);
}