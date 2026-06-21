# Libras Talk - Backend 🤟💬

O **Libras Talk** é uma plataforma de comunicação assistiva projetada para romper barreiras de comunicação em atendimentos presenciais.
O sistema interliga o painel do atendente (via computador) a um tablet posicionado para o cliente surdo ou com deficiência
auditiva/fala, permitindo a troca de mensagens em tempo real que servem de base para a tradução automatizada de Libras (com integração planejada ao VLibras).

Este repositório contém o **Core Backend** da aplicação, desenvolvido com uma arquitetura robusta, escalável e focada nas melhores práticas de Engenharia de Software.
Nos próximos passos o FRONTEND será adicionado a este repositório.

---

## 🚀 Tecnologias Utilizadas

* **Java 25
* **Spring Boot 3.x**
* **Spring Data JPA** (Persistência de dados e consultas derivadas)
* **Spring WebSocket & STOMP** (Protocolo de comunicação bidirecional em tempo real)
* **PostgreSQL** (Banco de dados relacional robusto)
* **Project Lombok** (Redução de código boilerplate e otimização de legibilidade)

---

## 🏗️ Arquitetura do Sistema

O projeto segue o padrão arquitetural em camadas, garantindo a separação de responsabilidades:

1. **Model (Entidades):** Mapeamento do banco de dados relacional.
   * `Estabelecimento`, `Usuario` (Atendentes/Admins), `Guiche` (Terminais físicos/Tablets), `Atendimento` e `MensagemDialogo`.
2. **Repository (Acesso a Dados):** Interfaces que herdam do `JpaRepository`, utilizando *Query Methods* dinâmicos do Hibernate para comunicação com o PostgreSQL.
3. **Service (Regras de Negócio):** Onde reside a inteligência e as validações do sistema.
4. **Controller (Endpoints REST):** Exposição de APIs HTTP para autenticação de usuários e setup inicial dos tablets via tokens exclusivos.
5. **WebSocket Configuration & Chat Controller:** Infraestrutura responsável por gerenciar conexões via protocolo STOMP, garantindo que as mensagens trafeguem e sejam salvas em milissegundos.

---

## 🧠 Regras de Negócio Implementadas

Para blindar o sistema contra inconsistências operacionais, o back-end valida rigorosamente o fluxo de chamados:
* **Prevenção de Duplicidade no Guichê:** Um tablet físico (`Guiche`) não pode iniciar um novo atendimento se já houver uma sessão ativa (`EM_ANDAMENTO`) vinculada a ele.
* **Foco do Atendente:** Um usuário operador não pode abrir dois atendimentos simultâneos, garantindo a qualidade e dedicação ao cliente atual.
* **Segurança de Acesso:** Tablets só são liberados para uso no balcão após a validação de um token efêmero gerado pelo painel administrativo do estabelecimento.

---

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
* JDK 25 configurado.
* PostgreSQL instalado e rodando.
* IDE VS Code (ou alguma de preferência).

### Passo a Passo
1. Clone o repositório;
2. Configure o arquivo "application.properties" inserindo as credenciais do banco;
3. Execute a aplicação através da IDE ou via terminal na raiz do projeto.


## Fase atual do Desenvolvimento
* ** Fase de testes com o Postman
