package com.librastalk.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "mensagens_dialogo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MensagemDialogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String remetente; // Ex: "ATENDENTE" ou "CLIENTE"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudoTexto;

    @Column(nullable = false)
    private LocalDateTime enviadoEm;

    @ManyToOne
    @JoinColumn(name = "atendimento_id", nullable = false)
    private Atendimento atendimento;
}