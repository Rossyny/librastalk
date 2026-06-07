package com.librastalk.backend.service;

import com.librastalk.backend.model.Usuario;
import com.librastalk.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor // Cria o construtor automaticamente para injetar o Repository
public class UsuarioService {

    // Repositório injetado para comunicação com a tabela de usuários
    private final UsuarioRepository usuarioRepository;

    /**
     * Método para cadastrar um novo atendente ou administrador.
     */
    public Usuario cadastrarUsuario(Usuario usuario) {
        // Busca se já existe alguém com o e-mail informado
        Optional<Usuario> existente = usuarioRepository.findByEmail(usuario.getEmail());
        if (existente.isPresent()) {
            // Se existir, interrompe o fluxo com uma exceção
            throw new RuntimeException("Este e-mail já está em uso no sistema.");
        }

        // Opção A: Salva a senha em texto puro (sem criptografia por enquanto)
        return usuarioRepository.save(usuario);
    }

    /**
     * Método de Autenticação (Login) do funcionário.
     */
    public Usuario autenticarUsuario(String email, String senha) {
        // Tenta encontrar o usuário pelo e-mail, se não achar lança erro
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // Opção A: Comparação direta de strings para validação da senha
        if (!usuario.getSenha().equals(senha)) {
            throw new RuntimeException("Senha incorreta.");
        }

        // Se o e-mail existir e a senha bater, retorna o usuário logado
        return usuario;
    }
}