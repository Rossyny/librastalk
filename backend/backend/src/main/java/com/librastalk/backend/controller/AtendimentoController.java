package com.librastalk.backend.controller;

import com.librastalk.backend.model.Atendimento;
import com.librastalk.backend.model.Cliente;
import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.model.StatusAtendimento;
import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.repository.GuicheRepository;
import com.librastalk.backend.repository.UsuarioRepository;
import com.librastalk.backend.repository.ClienteRepository;
import com.librastalk.backend.repository.AtendimentoRepository;
import com.librastalk.backend.service.AtendimentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

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
    private final SimpMessagingTemplate messagingTemplate;
    /**
     * Endpoint para o Totem solicitar um atendimento (Entrar na fila de espera)
     * URL: POST http://localhost:8080/api/atendimentos/solicitar
     */
    @PostMapping("/solicitar")
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> solicitarAtendimento(@RequestBody Map<String, Object> dados) {
        try {
            // Pega o ID do guichê enviado pelo tablet
            Long guicheId = ((Number) dados.get("guicheId")).longValue();
            
            System.out.println("===> Totem solicitando atendimento para o Guichê ID: " + guicheId);

            // Chama o método correspondente no seu AtendimentoService para gerar a chamada na fila
            // (Ajuste o nome do método caso no seu Service esteja diferente, ex: criarSolicitacao)
            Atendimento novoAtendimento = atendimentoService.criarSolicitacao(guicheId);

            System.out.println("===> Chamada criada com sucesso! ID Atendimento: " + novoAtendimento.getId());
            return ResponseEntity.ok(novoAtendimento);
        } catch (Exception e) {
            System.err.println("❌ ERRO AO SOLICITAR ATENDIMENTO: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint para iniciar/aceitar um atendimento vindo da fila de espera
     * URL: POST http://localhost:8080/api/atendimentos/iniciar
     */
    @PostMapping("/iniciar")
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> iniciar(@RequestBody Map<String, Object> dados) {
        try {
            Long atendimentoId = ((Number) dados.get("atendimentoId")).longValue();
            Long usuarioId = ((Number) dados.get("usuarioId")).longValue();

            System.out.println("===> Atendente ID " + usuarioId + " aceitando o Atendimento ID " + atendimentoId);

            Atendimento atendimento = atendimentoRepository.findById(atendimentoId)
                    .orElseThrow(() -> new RuntimeException("Atendimento não encontrado na fila. ID: " + atendimentoId));

            Usuario usuarioAtendente = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new RuntimeException("Atendente não encontrado. ID: " + usuarioId));

            java.util.List<Atendimento> atendimentosAtivos = atendimentoRepository.findByUsuarioIdAndStatus(usuarioId, StatusAtendimento.EM_ANDAMENTO);
            if (!atendimentosAtivos.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Você já possui um atendimento em andamento!"));
            }

            atendimento.setUsuario(usuarioAtendente);
            atendimento.setStatus(StatusAtendimento.EM_ANDAMENTO);
            atendimento.setDataInicio(java.time.LocalDateTime.now());

            // Salva a alteração no banco de dados
            Atendimento atualizado = atendimentoRepository.save(atendimento);

            // =========================================================================
            // 🔥 SINALIZA O TABLET EM TEMPO REAL QUE O ATENDENTE ACEITOU O CHAMADO!
            // =========================================================================
            try {
                System.out.println("===> Notificando o Totem via WS que o atendimento ID " + atendimentoId + " iniciou.");
                messagingTemplate.convertAndSend("/topic/atendimento/" + atendimentoId, atualizado);
            } catch (Exception e) {
                System.err.println("⚠️ Falha ao notificar início via WS: " + e.getMessage());
            }
            // =========================================================================

            System.out.println("===> Atendimento ID " + atendimentoId + " iniciado com sucesso pelo atendente!");
            return ResponseEntity.ok(atualizado);

        } catch (Exception e) {
            System.err.println("❌ ERRO AO INICIAR ATENDIMENTO: " + e.getMessage());
            e.printStackTrace();
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