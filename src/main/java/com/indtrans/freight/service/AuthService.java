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
    
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    
    private final AuthenticationManager authenticationManager;
    private final EmployeeRepository employeeRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public AuthService(AuthenticationManager authenticationManager,
                      EmployeeRepository employeeRepository,
                      JwtUtil jwtUtil,
                      PasswordEncoder passwordEncoder) {
        log.info("✅ AuthService constructor called - dependencies injected!");
        this.authenticationManager = authenticationManager;
        this.employeeRepository = employeeRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Transactional(readOnly = true)
    public AuthResponse authenticate(AuthRequest request) {
        log.info("🔐 Authenticating user: {}", request.getEmail());
        
        try {
            // ✅ Revert: Validate and use ENUM role
            Employee.Role targetRole = validateRole(request.getRole());
            log.info("   Target role: {}", targetRole);
            
            // Authenticate
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
                )
            );
            log.info("   ✅ Authentication successful");
            
            // ✅ Revert: Use repository method that filters by role
            Optional<Employee> employeeOpt = employeeRepository
                .findByEmailAndRole(request.getEmail(), targetRole);
            
            if (employeeOpt.isEmpty()) {
                log.error("   ❌ Employee not found: {}", request.getEmail());
                throw new BadCredentialsException("Invalid credentials");
            }
            
            Employee employee = employeeOpt.get();
            log.info("   ✅ Employee found: {}", employee.getEmail());
            
            // Generate JWT token
            String token = jwtUtil.generateToken(
                new User(employee.getEmail(), employee.getPasswordHash(), Collections.emptyList())
            );
            log.info("   ✅ Token generated");
            
            return AuthResponse.of(token, employee);
            
        } catch (BadCredentialsException e) {
            log.error("❌ Bad credentials: {}", e.getMessage());
            throw new BadCredentialsException("Invalid email or password");
        } catch (Exception e) {
            log.error("❌ Authentication failed: {}", e.getMessage(), e);
            throw new RuntimeException("Authentication failed: " + e.getMessage(), e);
        }
    }
    
    // ✅ Revert: Return ENUM, validate with valueOf
    private Employee.Role validateRole(String role) {
        if (role == null) {
            throw new IllegalArgumentException("Role is required");
        }
        try {
            return Employee.Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role);
        }
    }
    
    @Transactional
    public Employee createInitialAdmin(String name, String email, String rawPassword) {
        if (employeeRepository.existsByEmail(email)) {
            throw new IllegalStateException("Admin user already exists");
        }
        
        Employee admin = new Employee();
        admin.setName(name);
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(rawPassword));
        admin.setRole(Employee.Role.ADMIN);  // ✅ Revert: Use enum constant
        admin.setPermissionsJson("{}");
        admin.setMustChangePassword(Boolean.TRUE);

        return employeeRepository.save(admin);
    }

    /**
     * Verify current password and set a new one.
     * Clears the must_change_password flag on success.
     */
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters");
        }
        Employee employee = employeeRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!passwordEncoder.matches(currentPassword, employee.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        if (passwordEncoder.matches(newPassword, employee.getPasswordHash())) {
            throw new IllegalArgumentException("New password must differ from current password");
        }

        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employee.setMustChangePassword(Boolean.FALSE);
        employeeRepository.save(employee);
        log.info("🔑 Password changed for {}", email);
    }
}