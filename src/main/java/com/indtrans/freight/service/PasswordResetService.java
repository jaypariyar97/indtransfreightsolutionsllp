package com.indtrans.freight.service;

import com.indtrans.freight.model.Employee;
import com.indtrans.freight.model.PasswordResetToken;
import com.indtrans.freight.repository.EmployeeRepository;
import com.indtrans.freight.repository.PasswordResetTokenRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final long TOKEN_TTL_MINUTES = 60;

    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    /** Public app URL used to build the reset link. Set via APP_PUBLIC_URL. */
    @Value("${app.public-url:http://localhost}")
    private String publicUrl;

    /**
     * Generate a token for the email if it exists, store it, and dispatch the
     * reset email. ALWAYS returns silently — we never reveal whether an email
     * is registered or not (prevents account enumeration).
     */
    @Transactional
    public void requestReset(String email) {
        Optional<Employee> match = employeeRepository.findByEmail(email);
        if (match.isEmpty()) {
            // Brief delay to make timing similar to the success branch.
            try { Thread.sleep(120); } catch (InterruptedException ignore) {
                Thread.currentThread().interrupt();
            }
            log.info("Password reset requested for unknown email '{}'", email);
            return;
        }
        Employee employee = match.get();

        // Invalidate previous active tokens for this user so old links stop working.
        tokenRepository.invalidateActiveForEmployee(employee.getId());

        PasswordResetToken token = new PasswordResetToken();
        token.setEmployeeId(employee.getId());
        token.setToken(UUID.randomUUID().toString().replace("-", ""));
        token.setExpiresAt(Instant.now().plus(TOKEN_TTL_MINUTES, ChronoUnit.MINUTES));
        tokenRepository.save(token);

        String base = publicUrl.replaceAll("/$", "");
        String resetLink = base + "/admin/reset-password?token=" + token.getToken();

        String subject = "Reset your Indtrans portal password";
        String body =
            "Hi " + (employee.getName() == null ? "there" : employee.getName()) + ",\n\n" +
            "We received a request to reset your password for the Indtrans Freight Solutions portal.\n\n" +
            "Click the link below to choose a new password. This link is valid for " +
            TOKEN_TTL_MINUTES + " minutes and can be used only once:\n\n" +
            resetLink + "\n\n" +
            "If you did not request this, you can safely ignore this message — your password will remain unchanged.\n\n" +
            "— Indtrans Freight Solutions";
        emailService.send(employee.getEmail(), subject, body);
    }

    /**
     * Validate the token and set a new password. Throws RuntimeException with
     * a user-safe message on every failure path so the controller can surface it.
     */
    @Transactional
    public void confirmReset(String tokenValue, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters");
        }
        PasswordResetToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link"));

        if (token.isUsed()) {
            throw new IllegalArgumentException("This reset link has already been used");
        }
        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("This reset link has expired — please request a new one");
        }

        Employee employee = employeeRepository.findById(token.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("User no longer exists"));

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employee.setMustChangePassword(Boolean.FALSE);
        employeeRepository.save(employee);

        token.setUsed(true);
        tokenRepository.save(token);

        log.info("🔑 Password reset completed for {}", employee.getEmail());
    }
}
