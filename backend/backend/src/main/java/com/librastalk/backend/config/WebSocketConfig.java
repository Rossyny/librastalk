package com.librastalk.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration // Avisa ao Spring que esta é uma classe de configuração do sistema
@EnableWebSocketMessageBroker // Ativa o suporte a mensagens em tempo real com Message Broker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Define a URL que o Ionic (front-end) vai usar para estabelecer a conexão inicial do WebSocket
        // Ex do endereço: ws://localhost:8080/ws-librastalk
        registry.addEndpoint("/ws-librastalk")
                .setAllowedOrigins("*"); // Permite que dispositivos externos (como o tablet) se conectem sem bloqueio de CORS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Habilita um "Broker" (corretor/distribuidor de mensagens) na memória.
        // O front-end vai se "inscrever" em URLs que começam com "/topic" para ouvir as mensagens.
        // Ex: O tablet vai ficar ouvindo em "/topic/atendimento/1"
        registry.enableSimpleBroker("/topic");

        // Define o prefixo que o front-end usará para ENVIAR mensagens para o nosso back-end.
        // Ex: Para mandar uma mensagem, o front disparará para "/app/enviar-mensagem"
        registry.setApplicationDestinationPrefixes("/app");
    }
}