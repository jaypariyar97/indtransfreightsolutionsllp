package com.indtrans.freight.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.indtrans.freight.model.Employee;
import com.indtrans.freight.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centralised permission gate. Exposed in SpEL as {@code @perm} so controller
 * methods can declare authorisation declaratively, e.g.
 *
 * <pre>{@code
 * @PreAuthorize("@perm.has('customers','view')")
 * public List<Customer> list() { ... }
 * }</pre>
 *
 * <p>The canonical permission shape stored in {@code Employee#permissionsJson}
 * is a nested object: {@code {"customers":{"view":true,"add":false,...}}}.
 * Admins always pass. Older flat formats (a list of strings or a flat map) are
 * tolerated for backwards compatibility.
 */
@Component("perm")
public class PermissionService {

    private static final Logger log = LoggerFactory.getLogger(PermissionService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final EmployeeRepository employeeRepository;

    public PermissionService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    /** True if the current authenticated principal has {module.action}. */
    public boolean has(String module, String action) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;

        // Admin role bypass — admins implicitly have every permission.
        for (GrantedAuthority a : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equals(a.getAuthority())) return true;
        }

        String email = (auth.getPrincipal() instanceof UserDetails ud)
                ? ud.getUsername()
                : auth.getName();
        if (email == null) return false;

        return employeeRepository.findByEmailIgnoreCase(email)
                .map(emp -> evaluate(emp, module, action))
                .orElse(false);
    }

    /** True if the current user has *any* action on the module (used for menu visibility). */
    public boolean any(String module) {
        return has(module, "view")
                || has(module, "add")
                || has(module, "edit")
                || has(module, "delete");
    }

    private boolean evaluate(Employee employee, String module, String action) {
        if (employee.getRole() == Employee.Role.ADMIN) return true;
        Map<String, Map<String, Boolean>> perms = parse(employee.getPermissionsJson());
        Map<String, Boolean> modulePerms = perms.get(module);
        return modulePerms != null && Boolean.TRUE.equals(modulePerms.get(action));
    }

    /**
     * Parse {@code permissionsJson} into the canonical nested map. Falls back to
     * an empty map on any parse error so a corrupt blob can never elevate access.
     */
    public Map<String, Map<String, Boolean>> parse(String permissionsJson) {
        if (permissionsJson == null || permissionsJson.isBlank() || "{}".equals(permissionsJson.trim())) {
            return Collections.emptyMap();
        }
        try {
            Object root = MAPPER.readValue(permissionsJson, Object.class);

            // Canonical: { "customers": { "view": true, ... }, ... }
            if (root instanceof Map<?, ?> map) {
                Map<String, Map<String, Boolean>> out = new LinkedHashMap<>();
                for (Map.Entry<?, ?> e : map.entrySet()) {
                    String moduleKey = String.valueOf(e.getKey());
                    Object value = e.getValue();
                    if (value instanceof Map<?, ?> inner) {
                        Map<String, Boolean> normalised = new LinkedHashMap<>();
                        for (Map.Entry<?, ?> ie : inner.entrySet()) {
                            normalised.put(String.valueOf(ie.getKey()), Boolean.TRUE.equals(ie.getValue()));
                        }
                        out.put(moduleKey, normalised);
                    } else if (Boolean.TRUE.equals(value)) {
                        // Legacy flat map: {"customers_view": true}
                        addLegacyKey(out, moduleKey);
                    }
                }
                return out;
            }

            // Legacy: ["customers_view","customers_add",...]
            if (root instanceof java.util.List<?> list) {
                Map<String, Map<String, Boolean>> out = new LinkedHashMap<>();
                for (Object item : list) {
                    addLegacyKey(out, String.valueOf(item));
                }
                return out;
            }
        } catch (Exception e) {
            log.warn("Failed to parse permissions JSON, treating as empty: {}", e.getMessage());
        }
        return Collections.emptyMap();
    }

    /** Serialize the canonical nested map back to JSON for storage. */
    public String serialize(Map<String, Map<String, Boolean>> permissions) {
        if (permissions == null || permissions.isEmpty()) return "{}";
        try {
            return MAPPER.writeValueAsString(permissions);
        } catch (Exception e) {
            log.error("Failed to serialise permissions", e);
            return "{}";
        }
    }

    /** Convenience helper to convert a generic Object payload into the canonical nested map. */
    @SuppressWarnings("unchecked")
    public Map<String, Map<String, Boolean>> coerce(Object payload) {
        if (payload == null) return Collections.emptyMap();
        try {
            String json = (payload instanceof String s) ? s : MAPPER.writeValueAsString(payload);
            return parse(json);
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private void addLegacyKey(Map<String, Map<String, Boolean>> out, String legacyKey) {
        // Accept "customers_view", "customers.view", "customersView" — last token is the action.
        String key = legacyKey.replace('.', '_');
        int idx = key.lastIndexOf('_');
        if (idx <= 0 || idx >= key.length() - 1) return;
        String module = key.substring(0, idx).toLowerCase();
        String action = key.substring(idx + 1).toLowerCase();
        out.computeIfAbsent(module, k -> new LinkedHashMap<>()).put(action, true);
    }

    /** Read a (Jackson-parsed) Object Map<String,Map<String,Boolean>> from raw JSON. */
    public Map<String, Map<String, Boolean>> readJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return parse(json);
        }
    }
}
