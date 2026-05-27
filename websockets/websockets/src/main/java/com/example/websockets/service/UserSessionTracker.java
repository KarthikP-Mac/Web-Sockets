package com.example.websockets.service;

import org.springframework.stereotype.Component;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class UserSessionTracker {

    private final Set<String> users = ConcurrentHashMap.newKeySet();

    public void add(String user) {
        users.add(user);
    }

    public void remove(String user) {
        users.remove(user);
    }

    public int count() {
        return users.size();
    }
}