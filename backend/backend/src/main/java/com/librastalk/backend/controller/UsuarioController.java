package com.librastalk.backend.controller;

import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.model.Estabelecimento;
import com.librastalk.backend.repository.EstabelecimentoRepository;
import com.librastalk.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final EstabelecimentoRepository estabelecimentoRepository;

    /**
     * Endpoint para cadastrar um novo usuário (Atendente/Intérprete)
     * URL: POST http://localhost:8080/api/usuarios/cadastrar
     */
    @PostMapping("/cadastrar")
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, Object> dados) {
        try {
            // 1. Validar se o e-mail já existe para evitar duplicidade
            String email = (String) dados.get("email");
            if (usuarioRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Este e-mail já está cadastrado."));
            }

            // 2. Buscar o estabelecimento pelo ID enviado no JSON
            Long estabelecimentoId = ((Number) dados.get("estabelecimentoId")).longValue();
            Estabelecimento est = estabelecimentoRepository.findById(estabelecimentoId)
                    .orElseThrow(() -> new RuntimeException("Estabelecimento não encontrado. ID: " + estabelecimentoId));

            // 3. Montar o novo usuário
            Usuario novoUsuario = new Usuario();
            novoUsuario.setNome((String) dados.get("nome"));
            novoUsuario.setEmail(email);
            novoUsuario.setSenha((String) dados.get("senha")); // Futuramente aqui entrará o BCrypt para criptografia
            novoUsuario.setPerfil(com.librastalk.backend.model.Perfil.valueOf((String) dados.get("perfil")));
            novoUsuario.setEstabelecimento(est);

            // 4. Salvar no banco
            Usuario salvo = usuarioRepository.save(novoUsuario);

            return ResponseEntity.ok(salvo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * 🔥 NOVO: Endpoint para buscar dados de um usuário pelo ID
     * URL: GET http://localhost:8080/api/usuarios/{id}
     */
    @GetMapping("/{id}")
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        try {
            Usuario usuario = usuarioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado. ID: " + id));

            // Retorna os dados do banco mapeados lindamente em JSON
            return ResponseEntity.ok(Map.of(
                "nome", usuario.getNome(),
                "perfil", usuario.getPerfil() != null ? usuario.getPerfil().toString() : "ATENDENTE"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * 🔥 NOVO: Endpoint para listar todos os usuários
     * URL: GET http://localhost:8080/api/usuarios
     */
    @GetMapping
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> listarTodos() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    /**
     * 🔥 NOVO: Endpoint para retornar a contagem exata de atendentes no banco
     * URL: GET http://localhost:8080/api/usuarios/contar-atendentes
     */
    @GetMapping("/contar-atendentes")
    @CrossOrigin(origins = "*")
    public ResponseEntity<?> contarAtendentes() {
        try {
            long total = usuarioRepository.countByPerfil(com.librastalk.backend.model.Perfil.ATENDENTE);
            return ResponseEntity.ok(Map.of("totalAtendentes", total));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}