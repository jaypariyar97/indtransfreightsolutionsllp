package com.indtrans.freight.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.indtrans.freight.dto.AuthResponse;
import com.indtrans.freight.model.Employee;
import com.indtrans.freight.repository.EmployeeRepository;
import com.indtrans.freight.security.PermissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin-only user management. The canonical permission shape on the wire and
 * in the database is a nested object:
 *
 * <pre>{@code
 * {
 *   "customers":  { "view": true, "add": true, "edit": false, "delete": false },
 *   "tracking":   { "view": true, "add": true, "edit": true,  "delete": false },
 *   ...
 * }
 * }</pre>
 */
@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final PermissionService permissionService;

    public UserController(EmployeeRepository employeeRepository,
                          PasswordEncoder passwordEncoder,
                          PermissionService permissionService) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.permissionService = permissionService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AuthResponse.UserInfo>> getAllUsers() {
        List<AuthResponse.UserInfo> all = employeeRepository.findAll().stream()
                .map(AuthResponse.UserInfo::fromEmployee)
                .collect(Collectors.toList());
        return ResponseEntity.ok(all);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        try {
            String name = string(request.get("name"));
            String email = string(request.get("email"));
            String password = string(request.get("password"));
            String roleStr = string(request.get("role"));

            if (isBlank(name) || isBlank(email) || isBlank(password)) {
                return ResponseEntity.badRequest().body(Map.of("error", "name, email and password are required"));
            }
            if (employeeRepository.existsByEmailIgnoreCase(email.trim())) {
                return ResponseEntity.badRequest().body(Map.of("error", "User with this email already exists"));
            }

            Employee user = new Employee();
            user.setName(name.trim());
            user.setEmail(email.trim());
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRole("ADMIN".equalsIgnoreCase(roleStr) ? Employee.Role.ADMIN : Employee.Role.EMPLOYEE);
            user.setPermissionsJson("{}");
            // Force the user to set their own password on first login.
            user.setMustChangePassword(Boolean.TRUE);

            Employee saved = employeeRepository.save(user);
            return ResponseEntity.ok(AuthResponse.UserInfo.fromEmployee(saved));
        } catch (Exception e) {
            log.error("Failed to create user", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create user: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            // Refuse to delete the last remaining admin.
            Employee target = employeeRepository.findById(id).orElse(null);
            if (target == null) return ResponseEntity.notFound().build();
            if (target.getRole() == Employee.Role.ADMIN) {
                long admins = employeeRepository.findAll().stream()
                        .filter(e -> e.getRole() == Employee.Role.ADMIN)
                        .count();
                if (admins <= 1) {
                    return ResponseEntity.status(409)
                            .body(Map.of("error", "Cannot delete the only admin account"));
                }
            }
            employeeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete user {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete user"));
        }
    }

    /** Returns the user's permissions as a nested map (canonical shape). */
    @GetMapping("/{id}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Map<String, Boolean>>> getUserPermissions(@PathVariable String id) {
        Employee user = employeeRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(permissionService.parse(user.getPermissionsJson()));
    }

    /**
     * Replace the user's permissions. Accepts the canonical nested map; legacy
     * flat formats (list of strings, flat map) are coerced server-side.
     */
    @PutMapping("/{id}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> updateUserPermissions(@PathVariable String id, @RequestBody Object body) {
        Employee user = employeeRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        try {
            Map<String, Map<String, Boolean>> normalised = permissionService.coerce(body);
            user.setPermissionsJson(MAPPER.writeValueAsString(normalised));
            Employee updated = employeeRepository.save(user);
            return ResponseEntity.ok(AuthResponse.UserInfo.fromEmployee(updated));
        } catch (Exception e) {
            log.error("Failed to update permissions for user {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update permissions"));
        }
    }

    /** PATCH a user's role. Useful for promoting an employee to admin. */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        Employee user = employeeRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        String role = body.get("role");
        if (!"ADMIN".equalsIgnoreCase(role) && !"EMPLOYEE".equalsIgnoreCase(role)) {
            return ResponseEntity.badRequest().body(Map.of("error", "role must be ADMIN or EMPLOYEE"));
        }
        user.setRole(Employee.Role.valueOf(role.toUpperCase()));
        return ResponseEntity.ok(AuthResponse.UserInfo.fromEmployee(employeeRepository.save(user)));
    }

    private static String string(Object o) { return o == null ? null : o.toString(); }
    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }

    @SuppressWarnings("unused")
    private Map<String, Map<String, Boolean>> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }
}
