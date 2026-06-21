package com.librastalk.backend.controller;

import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.model.Estabelecimento;
import com.librastalk.backend.repository.EstabelecimentoRepository;
import com.librastalk.backend.repository.GuicheRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/guiches")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class GuicheController {

    private final GuicheRepository guicheRepository;
    private final EstabelecimentoRepository estabelecimentoRepository;

    /**
     * Endpoint para cadastrar um novo guichê e gerar seu token de acesso automático
     * URL: POST http://localhost:8080/api/guiches/cadastrar
     */
    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, Object> dados) {
        try {
            Long estabelecimentoId = ((Number) dados.get("estabelecimentoId")).longValue();
            Estabelecimento est = estabelecimentoRepository.findById(estabelecimentoId)
                    .orElseThrow(() -> new RuntimeException("Estabelecimento não encontrado. ID: " + estabelecimentoId));

            Guiche novoGuiche = new Guiche();
            novoGuiche.setIdentificacao((String) dados.get("identificacao")); // Ex: "Caixa 02"
            novoGuiche.setEstabelecimento(est);

            // Geração automática do Token Único
            // Aqui usamos os 6 primeiros caracteres de um UUID em maiúsculo (ex: "A1B2C3") para ficar amigável
            String tokenGerado = "TALK" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            novoGuiche.setTokenAcesso(tokenGerado);

            // Salva no banco de dados
            Guiche salvo = guicheRepository.save(novoGuiche);

            // Retorna o objeto com o token para o administrador visualizar e configurar no tablet
            return ResponseEntity.ok(salvo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}