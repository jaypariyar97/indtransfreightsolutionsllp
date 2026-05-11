package com.indtrans.freight.controller;

import com.indtrans.freight.dto.AuthRequest;
import com.indtrans.freight.dto.AuthResponse;
import com.indtrans.freight.model.Employee;
import com.indtrans.freight.repository.EmployeeRepository;
import com.indtrans.freight.service.AuthService;
import com.indtrans.freight.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final EmployeeRepository employeeRepository;

    public AuthController(AuthService authService,
                          PasswordResetService passwordResetService,
                          EmployeeRepository employeeRepository) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    /**
     * Returns the currently signed-in user as a {@link AuthResponse.UserInfo}
     * (no password hash, parsed permissions). Used by the frontend to refresh
     * its cached user payload after a permissions change.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        Employee employee = employeeRepository.findByEmail(user.getUsername()).orElse(null);
        if (employee == null) {
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(AuthResponse.UserInfo.fromEmployee(employee));
    }

   @PostMapping("/change-password")
public ResponseEntity<?> changePassword(
        @RequestBody Map<String, String> body) {

    org.springframework.security.core.Authentication authentication =
            org.springframework.security.core.context.SecurityContextHolder
                    .getContext()
                    .getAuthentication();

    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401)
                .body(Map.of("error", "Not authenticated"));
    }

    String email = authentication.getName();

    String currentPassword = body.get("currentPassword");
    String newPassword = body.get("newPassword");

    if (currentPassword == null || newPassword == null) {
        return ResponseEntity.badRequest()
                .body(Map.of("error",
                        "currentPassword and newPassword are required"));
    }

    try {
        authService.changePassword(
                email,
                currentPassword,
                newPassword
        );

        return ResponseEntity.ok(
                Map.of("message",
                        "Password changed successfully")
        );

    } catch (org.springframework.security.authentication.BadCredentialsException e) {

        return ResponseEntity.status(400)
                .body(Map.of("error", e.getMessage()));

    } catch (IllegalArgumentException e) {

        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }
}
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email != null && !email.isBlank()) {
            try {
                passwordResetService.requestReset(email.trim());
            } catch (Exception ex) {
                // Swallow on purpose — never reveal which addresses exist.
            }
        }
        return ResponseEntity.ok(Map.of(
                "message", "If that email is registered, a reset link has been sent. Check your inbox."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "token and newPassword are required"));
        }
        try {
            passwordResetService.confirmReset(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password has been reset. You can now sign in."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
}
