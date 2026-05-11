package com.indtrans.freight.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "Indtrans 1234";
        String hash = encoder.encode(password);
        
        System.out.println("Password: " + password);
        System.out.println("Hash: " + hash);
        System.out.println("\nRun this SQL:");
        System.out.println("UPDATE employees SET password_hash = '" + hash + "' WHERE email = 'operations@indtransfreightsolutions.com';");
    }
}