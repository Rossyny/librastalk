package com.librastalk.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "estabelecimentos")
@Getter 
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Estabelecimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true, length = 18)
    private String cnpj;

    private String endereco;
}