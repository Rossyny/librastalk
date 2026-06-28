package com.librastalk.backend.repository;

import com.librastalk.backend.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    
    // Método customizado para buscarmos o cliente pelo CPF na hora do atendimento
    Optional<Cliente> findByCpf(String cpf);
}