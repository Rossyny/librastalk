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
    /**
     * Endpoint para validar o token inserido no tablet e retornar os dados do guichê
     * URL: POST http://localhost:8080/api/guiches/validar-token
     */
    @PostMapping("/validar-token")
    @CrossOrigin(origins = "*") // Garante o CORS isolado caso o global falhe
    public ResponseEntity<?> validarToken(@RequestBody Map<String, String> body) {
        try {
            String token = body.get("token");
            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "O token não foi informado."));
            }

            System.out.println("===> Tentando validar o token do tablet: " + token);

            // Busca o guichê pelo token de acesso no banco de dados
            Guiche guiche = guicheRepository.findByTokenAcesso(token.trim())
                    .orElseThrow(() -> new RuntimeException("Código de ativação inválido ou não encontrado."));

            // Blindagem contra NullPointerException caso algum relacionamento esteja vazio no banco
            String identificacao = guiche.getIdentificacao() != null ? guiche.getIdentificacao() : "Guichê sem identificação";
            String localizacao = "Estabelecimento Não Informado";
            
            if (guiche.getEstabelecimento() != null && guiche.getEstabelecimento().getNome() != null) {
                localizacao = guiche.getEstabelecimento().getNome();
            }

            // Criação do map dinâmico para aceitar variações com segurança
            Map<String, Object> resposta = new java.util.HashMap<>();
            resposta.put("id", guiche.getId());
            resposta.put("numeroIdentificador", identificacao);
            resposta.put("localizacao", localizacao);

            System.out.println("===> Token validado com sucesso para o guichê ID: " + guiche.getId());
            return ResponseEntity.ok(resposta);

        } catch (Exception e) {
            // Imprime o erro real no terminal da sua IDE (Eclipse/IntelliJ)
            System.err.println("❌ ERRO AO VALIDAR TOKEN: " + e.getMessage());
            e.printStackTrace(); 
            
            return ResponseEntity.status(404).body(Map.of("erro", e.getMessage()));
        }
    }
}