package com.indtrans.freight.service;

import com.indtrans.freight.dto.AuthRequest;
import com.indtrans.freight.dto.AuthResponse;
import com.indtrans.freight.model.Employee;
import com.indtrans.freight.repository.EmployeeRepository;
import com.indtrans.freight.util.JwtUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log =
            LoggerFactory.getLogger(AuthService.class);

    private final AuthenticationManager authenticationManager;
    private final EmployeeRepository employeeRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthService(
            AuthenticationManager authenticationManager,
            EmployeeRepository employeeRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder
    ) {

        log.info("✅ AuthService constructor called");

        this.authenticationManager = authenticationManager;
        this.employeeRepository = employeeRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AuthResponse authenticate(AuthRequest request) {

        String normalizedEmail =
                request.getEmail().trim().toLowerCase();

        log.info("🔐 Authenticating user: {}", normalizedEmail);

        try {

            Employee.Role targetRole =
                    validateRole(request.getRole());

            log.info("   Target role: {}", targetRole);

            // Authenticate credentials
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    normalizedEmail,
                                    request.getPassword()
                            )
                    );

            log.info("   ✅ Authentication successful");

            // Find employee by email + role
            Optional<Employee> employeeOpt =
                    employeeRepository.findByEmailIgnoreCaseAndRole(
                            normalizedEmail,
                            targetRole
                    );

            if (employeeOpt.isEmpty()) {

                log.error("❌ Employee not found: {}", normalizedEmail);

                throw new BadCredentialsException(
                        "Invalid credentials"
                );
            }

            Employee employee = employeeOpt.get();

            log.info("✅ Employee found: {}", employee.getEmail());

            // Generate JWT
            String token = jwtUtil.generateToken(
                    new User(
                            employee.getEmail(),
                            employee.getPasswordHash(),
                            Collections.emptyList()
                    )
            );

            log.info("✅ Token generated");

            return AuthResponse.of(token, employee);

        } catch (BadCredentialsException e) {

            log.error("❌ Bad credentials: {}", e.getMessage());

            throw new BadCredentialsException(
                    "Invalid email or password"
            );

        } catch (Exception e) {

            log.error("❌ Authentication failed", e);

            throw new RuntimeException(
                    "Authentication failed: " + e.getMessage(),
                    e
            );
        }
    }

    private Employee.Role validateRole(String role) {

        if (role == null) {
            throw new IllegalArgumentException(
                    "Role is required"
            );
        }

        try {

            return Employee.Role.valueOf(
                    role.trim().toUpperCase()
            );

        } catch (IllegalArgumentException e) {

            throw new IllegalArgumentException(
                    "Invalid role: " + role
            );
        }
    }

    @Transactional
    public Employee createInitialAdmin(
            String name,
            String email,
            String rawPassword
    ) {

        String normalizedEmail =
                email.trim().toLowerCase();

        if (employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {

            throw new IllegalStateException(
                    "Admin user already exists"
            );
        }

        Employee admin = new Employee();

        admin.setName(name);
        admin.setEmail(normalizedEmail);

        admin.setPasswordHash(
                passwordEncoder.encode(rawPassword)
        );

        admin.setRole(Employee.Role.ADMIN);

        admin.setPermissionsJson("{}");

        admin.setMustChangePassword(Boolean.TRUE);

        return employeeRepository.save(admin);
    }

    /**
     * Verify current password and set new password.
     */
    @Transactional
    public void changePassword(
            String email,
            String currentPassword,
            String newPassword
    ) {

        if (newPassword == null || newPassword.length() < 8) {

            throw new IllegalArgumentException(
                    "New password must be at least 8 characters"
            );
        }

        String normalizedEmail =
                email.trim().toLowerCase();

        log.info("🔑 Attempting password change for: {}",
                normalizedEmail);

        Employee employee = employeeRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> {

                    log.error("❌ User not found: {}",
                            normalizedEmail);

                    return new BadCredentialsException(
                            "User not found"
                    );
                });

        // Verify current password
        if (!passwordEncoder.matches(
                currentPassword,
                employee.getPasswordHash()
        )) {

            throw new BadCredentialsException(
                    "Current password is incorrect"
            );
        }

        // Prevent same password reuse
        if (passwordEncoder.matches(
                newPassword,
                employee.getPasswordHash()
        )) {

            throw new IllegalArgumentException(
                    "New password must differ from current password"
            );
        }

        // Update password
        employee.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        employee.setMustChangePassword(Boolean.FALSE);

        employeeRepository.save(employee);

        log.info("✅ Password changed successfully for {}",
                normalizedEmail);
    }
}