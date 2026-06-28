package com.librastalk.backend.controller;

import com.librastalk.backend.model.Atendimento;
import com.librastalk.backend.model.Cliente;
import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.repository.GuicheRepository;
import com.librastalk.backend.repository.UsuarioRepository;
import com.librastalk.backend.repository.ClienteRepository;
import com.librastalk.backend.repository.AtendimentoRepository;
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
    private final UsuarioRepository usuarioRepository;
    private final GuicheRepository guicheRepository;
    private final ClienteRepository clienteRepository;
    private final AtendimentoRepository atendimentoRepository;

    /**
     * Endpoint para iniciar um atendimento (Relação Atendente + Tablet)
     * URL: POST http://localhost:8080/api/atendimentos/iniciar
     */
    @PostMapping("/iniciar")
    public ResponseEntity<?> iniciar(@RequestBody Map<String, Object> dados) {
        try {
            // Extrai com segurança os IDs numéricos e o texto do JSON
            Long usuarioId = ((Number) dados.get("usuarioId")).longValue();
            Long guicheId = ((Number) dados.get("guicheId")).longValue();
            String tipoDeficiencia = (String) dados.get("tipoDeficiencia");

            // Busca as entidades completas no banco de dados
            Usuario usuario = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado. ID: " + usuarioId));
            
            Guiche guiche = guicheRepository.findById(guicheId)
                    .orElseThrow(() -> new RuntimeException("Guichê não encontrado. ID: " + guicheId));

            // Aciona o serviço passando os objetos de modelo reais
            Atendimento atendimento = atendimentoService.iniciarAtendimento(usuario, guiche, tipoDeficiencia);
            
            return ResponseEntity.ok(atendimento);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint para cadastrar e vincular um cliente a um atendimento em andamento
     * URL: PUT http://localhost:8080/api/atendimentos/{id}/vincular-cliente
     */
    @PutMapping("/{id}/vincular-cliente")
    public ResponseEntity<?> vincularCliente(@PathVariable Long id, @RequestBody Map<String, String> dadosCliente) {
        try {
            // 1. Busca o atendimento ativo que está rolando
            Atendimento atendimento = atendimentoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Atendimento não encontrado. ID: " + id));

            String cpf = dadosCliente.get("cpf");
            String nome = dadosCliente.get("nome");
            String contato = dadosCliente.get("contato");

            // 2. Se o cliente já existir no banco pelo CPF, reutiliza. Se não, cadastra na hora!
            Cliente cliente = clienteRepository.findByCpf(cpf)
                    .orElseGet(() -> {
                        Cliente novo = new Cliente();
                        novo.setCpf(cpf);
                        novo.setNome(nome);
                        novo.setContato(contato);
                        return clienteRepository.save(novo);
                    });

            // 3. Vincula o cliente ao atendimento atual e atualiza no banco
            atendimento.setCliente(cliente);
            Atendimento atualizado = atendimentoRepository.save(atendimento);

            return ResponseEntity.ok(atualizado);
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