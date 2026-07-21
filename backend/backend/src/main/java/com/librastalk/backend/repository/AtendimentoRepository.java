package com.librastalk.backend.repository;

import com.librastalk.backend.model.Atendimento;
import com.librastalk.backend.model.StatusAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {
    List<Atendimento> findByGuicheIdAndStatus(Long guicheId, StatusAtendimento status);
    List<Atendimento> findByUsuarioIdAndStatus(Long usuarioId, StatusAtendimento status);

    List<Atendimento> findByStatus(StatusAtendimento status);
}
