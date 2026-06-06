package com.librastalk.backend.service;

import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.repository.GuicheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GuicheService {

    private final GuicheRepository guicheRepository;

    public Guiche validarTokenEquipamento(String tokenAcesso) {
        Optional<Guiche> guiche = guicheRepository.findByTokenAcesso(tokenAcesso);
        
        if (guiche.isEmpty()) {
            throw new RuntimeException("Token de acesso inválido. Equipamento não reconhecido.");
        }
        
        return guiche.get();
    }
}