package com.librastalk.backend.repository;

import com.librastalk.backend.model.Perfil;
import com.librastalk.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    // 🔥 NOVO: Conta a quantidade exata de usuários filtrados pelo Perfil
    long countByPerfil(Perfil perfil);
}