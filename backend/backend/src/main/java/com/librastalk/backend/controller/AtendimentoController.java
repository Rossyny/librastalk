package com.librastalk.backend.controller;

import com.librastalk.backend.model.Atendimento;
import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.service.AtendimentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/atendimentos") // URL base para controle de chamados
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AtendimentoController {

    private final AtendimentoService atendimentoService;

    /**
     * Endpoint para iniciar um atendimento (Relação Atendente + Tablet)
     * URL: POST http://localhost:8080/api/atendimentos/iniciar
     */
    @PostMapping("/iniciar")
    public ResponseEntity<?> iniciar(@RequestBody Map<String, Object> dados) {
        try {
            // ATENÇÃO: Para simplificar o payload do POST, fingimos receber objetos montados.
            // Na integração real, o front passará os IDs e os services buscarão no banco.
            Usuario usuario = (Usuario) dados.get("usuario");
            Guiche guiche = (Guiche) dados.get("guiche");
            String tipoDeficiencia = (String) dados.get("tipoDeficiencia");

            // Aciona o serviço que bloqueia duplicidades e cria o registro
            Atendimento atendimento = atendimentoService.iniciarAtendimento(usuario, guiche, tipoDeficiencia);
            
            return ResponseEntity.ok(atendimento);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint para finalizar um atendimento ativo
     * URL: POST http://localhost:8080/api/atendimentos/finalizar/{id}
     */
    @PostMapping("/finalizar/{id}")
    public ResponseEntity<?> finalizar(@PathVariable Long id) {
        try {
            // Encerra o chamado e preenche a data de término no banco
            Atendimento finalizado = atendimentoService.finalizarAtendimento(id);
            return ResponseEntity.ok(finalizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}