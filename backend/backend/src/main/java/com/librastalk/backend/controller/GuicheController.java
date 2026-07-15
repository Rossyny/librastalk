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
import java.util.List;

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
     * Endpoint para validar o token no tablet e MARCAR COMO ATIVO no banco
     */
    @PostMapping("/validar-token")
    public ResponseEntity<?> validarToken(@RequestBody Map<String, String> body) {
        try {
            String token = body.get("token");
            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "O token não foi informado."));
            }

            Guiche guiche = guicheRepository.findByTokenAcesso(token.trim())
                    .orElseThrow(() -> new RuntimeException("Código de ativação inválido ou não encontrado."));

            // 🔥 MARCA O GUICHÊ COMO ATIVO AO CONECTAR O TABLET
            guiche.setAtivo(true);
            guicheRepository.save(guiche);

            Map<String, Object> resposta = new java.util.HashMap<>();
            resposta.put("id", guiche.getId());
            resposta.put("numeroIdentificador", guiche.getIdentificacao() != null ? guiche.getIdentificacao() : "Guichê sem identificação");
            resposta.put("localizacao", guiche.getEstabelecimento() != null ? guiche.getEstabelecimento().getNome() : "Estabelecimento Não Informado");
            resposta.put("ativo", guiche.getAtivo());

            return ResponseEntity.ok(resposta);

        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint para o Gerente consultar a quantidade ou lista de Guichês ATIVOS
     * URL: GET http://localhost:8080/api/guiches/ativos
     */
    @GetMapping("/ativos")
    public ResponseEntity<List<Guiche>> listarAtivos() {
        List<Guiche> guichesAtivos = guicheRepository.findByAtivoTrue();
        return ResponseEntity.ok(guichesAtivos);
    }

    /**
     * Endpoint para DESATIVAR o guichê quando o tablet fecha a sessão ou faz logout
     * URL: POST http://localhost:8080/api/guiches/desconectar
     */
    @PostMapping("/desconectar")
    public ResponseEntity<?> desconectar(@RequestBody Map<String, Object> body) {
        try {
            Object idObj = body.get("id");
            if (idObj == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "ID do guichê não informado."));
            }

            // Converte com segurança sem reatribuir variável local
            Long guicheId = ((Number) idObj).longValue();

            Guiche guiche = guicheRepository.findById(guicheId)
                    .orElseThrow(() -> new RuntimeException("Guichê não encontrado com ID: " + guicheId));

            // 🛑 MARCA O GUICHÊ COMO INATIVO NO BANCO
            guiche.setAtivo(false);
            guicheRepository.save(guiche);

            System.out.println("===> Guichê ID " + guicheId + " foi DESCONECTADO e marcado como inativo.");
            return ResponseEntity.ok(Map.of("mensagem", "Guichê desconectado com sucesso."));

        } catch (Exception e) {
            System.err.println("❌ Erro ao desconectar guichê: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}