package com.librastalk.backend.controller;

import com.librastalk.backend.model.Guiche;
import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.service.GuicheService;
import com.librastalk.backend.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth") // URL base para este controlador
@CrossOrigin(origins = "*") // Permite que o Ionic (front-end) acesse o back-end sem erros de CORS
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;
    private final GuicheService guicheService;

    /**
     * Endpoint para Login do Atendente/Admin
     * URL: POST http://localhost:8080/api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginUsuario(@RequestBody Map<String, String> dados) {
        try {
            // Extrai as credenciais enviadas pelo JSON do front-end
            String email = dados.get("email");
            String senha = dados.get("senha");

            // Executa a lógica de autenticação no service
            Usuario usuarioLogado = usuarioService.autenticarUsuario(email, senha);
            
            // Retorna o usuário autenticado com status 200 OK
            return ResponseEntity.ok(usuarioLogado);
        } catch (Exception e) {
            // Em caso de erro (senha errada, etc), retorna o erro com status 400 Bad Request
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint para o Setup Inicial do Tablet (Validação do Token)
     * URL: POST http://localhost:8080/api/auth/tablet
     */
    @PostMapping("/tablet")
    public ResponseEntity<?> validarTablet(@RequestBody Map<String, String> dados) {
        try {
            // Extrai o token digitado pelo gerente no tablet
            String token = dados.get("token");

            // Valida se o token pertence a um guichê cadastrado
            Guiche guicheValidado = guicheService.validarTokenEquipamento(token);

            // Retorna os dados do guichê para o tablet saber quem ele é (ex: Guichê 01)
            return ResponseEntity.ok(guicheValidado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}