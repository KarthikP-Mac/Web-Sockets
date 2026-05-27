package com.example.websockets.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    public String type; 
    // CHAT | TYPING | REACTION | SYSTEM

    public String sender;
    public String content;

    public String emoji;

}