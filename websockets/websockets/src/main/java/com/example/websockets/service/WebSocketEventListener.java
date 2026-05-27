package com.example.websockets.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    @Autowired
    private SimpMessagingTemplate template;

    @Autowired
    private UserSessionTracker tracker;

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headers.getSessionId();
        tracker.add(sessionId);
        sendCount();
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        tracker.remove(event.getSessionId());
        sendCount();
    }

    private void sendCount() {
        template.convertAndSend(
            "/topic/users",
            tracker.count()
        );
    }
}