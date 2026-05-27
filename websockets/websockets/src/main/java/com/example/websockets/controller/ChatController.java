package com.example.websockets.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import com.example.websockets.model.ChatMessage;
import com.example.websockets.service.UserSessionTracker;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate template;

    @Autowired
    private UserSessionTracker tracker;

    // MAIN CHAT
    @MessageMapping("/chat")
    public void chat(ChatMessage msg) {

        if (isBlocked(msg.content)) return;

        template.convertAndSend("/topic/messages", msg);
    }

    // TYPING
    @MessageMapping("/typing")
    public void typing(ChatMessage msg) {

        template.convertAndSend("/topic/typing", msg);
    }

    // REACTIONS
    @MessageMapping("/reaction")
    public void reaction(ChatMessage msg) {

        template.convertAndSend("/topic/reactions", msg);
    }

    private boolean isBlocked(String text) {
        String lower = text.toLowerCase();

        return lower.contains("hate")
            || lower.contains("abuse")
            || lower.contains("spam");
    }
}