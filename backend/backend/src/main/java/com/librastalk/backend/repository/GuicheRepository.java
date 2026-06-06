package com.librastalk.backend.repository;

import com.librastalk.backend.model.Guiche;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GuicheRepository extends JpaRepository<Guiche, Long> {
    Optional<Guiche> findByTokenAcesso(String tokenAcesso);
}