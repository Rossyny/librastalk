package com.librastalk.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "clientes")
@Data // Gera automaticamente Getters, Setters, Equals e HashCode via Lombok
public class Cliente {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nome;
    
    @Column(unique = true, nullable = false, length = 14) // Garante que não haverá CPFs duplicados
    private String cpf;
    
    private String contato; // Pode armazenar e-mail ou telefone do cliente para pós-atendimento
}