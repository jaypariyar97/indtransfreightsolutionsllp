package com.indtrans.freight.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.indtrans.freight.model.Employee;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * DTO returned from /auth/login and /auth/me.
 *
 * <p>The {@code permissions} field on {@link UserInfo} is always sent as a
 * <strong>parsed nested map</strong>:
 * {@code { "customers": { "view": true, ... }, ... }}. Older payloads stored
 * a raw JSON string here, which forced the frontend to JSON.parse() on every
 * call and gave it the wrong type at compile time. Sending the parsed object
 * keeps the frontend honest.
 */
public class AuthResponse {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private String token;
    private String tokenType = "Bearer";
    private UserInfo user;

    public AuthResponse() {}

    public AuthResponse(String token, String tokenType, UserInfo user) {
        this.token = token;
        this.tokenType = tokenType;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public static class UserInfo {
        private String id;
        private String name;
        private String email;
        private String role;
        /** Always nested {@code Map<String, Map<String, Boolean>>} when sent over the wire. */
        private Map<String, Map<String, Boolean>> permissions;
        private Boolean mustChangePassword;

        public UserInfo() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public Map<String, Map<String, Boolean>> getPermissions() { return permissions; }
        public void setPermissions(Map<String, Map<String, Boolean>> permissions) { this.permissions = permissions; }
        public Boolean getMustChangePassword() { return mustChangePassword; }
        public void setMustChangePassword(Boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

        /** Build a UserInfo from an Employee, parsing the JSON blob safely. */
        public static UserInfo fromEmployee(Employee employee) {
            UserInfo info = new UserInfo();
            info.id = employee.getId();
            info.name = employee.getName();
            info.email = employee.getEmail();
            info.role = employee.getRole().name();
            info.permissions = parsePermissions(employee.getPermissionsJson());
            info.mustChangePassword = employee.getMustChangePassword();
            return info;
        }

        private static Map<String, Map<String, Boolean>> parsePermissions(String json) {
            if (json == null || json.isBlank() || "{}".equals(json.trim())) {
                return new LinkedHashMap<>();
            }
            try {
                Object root = MAPPER.readValue(json, Object.class);
                if (root instanceof Map<?, ?> m) {
                    Map<String, Map<String, Boolean>> out = new LinkedHashMap<>();
                    for (Map.Entry<?, ?> e : m.entrySet()) {
                        if (e.getValue() instanceof Map<?, ?> inner) {
                            Map<String, Boolean> bucket = new LinkedHashMap<>();
                            for (Map.Entry<?, ?> ie : inner.entrySet()) {
                                bucket.put(String.valueOf(ie.getKey()), Boolean.TRUE.equals(ie.getValue()));
                            }
                            out.put(String.valueOf(e.getKey()), bucket);
                        } else if (Boolean.TRUE.equals(e.getValue())) {
                            String legacy = String.valueOf(e.getKey()).replace('.', '_');
                            int idx = legacy.lastIndexOf('_');
                            if (idx > 0 && idx < legacy.length() - 1) {
                                String mod = legacy.substring(0, idx);
                                String act = legacy.substring(idx + 1);
                                out.computeIfAbsent(mod, k -> new LinkedHashMap<>()).put(act, true);
                            }
                        }
                    }
                    return out;
                }
                if (root instanceof java.util.List<?> list) {
                    Map<String, Map<String, Boolean>> out = new LinkedHashMap<>();
                    for (Object item : list) {
                        String legacy = String.valueOf(item).replace('.', '_');
                        int idx = legacy.lastIndexOf('_');
                        if (idx > 0 && idx < legacy.length() - 1) {
                            String mod = legacy.substring(0, idx);
                            String act = legacy.substring(idx + 1);
                            out.computeIfAbsent(mod, k -> new LinkedHashMap<>()).put(act, true);
                        }
                    }
                    return out;
                }
            } catch (Exception e) {
                // fall through
            }
            try {
                return MAPPER.readValue(json, new TypeReference<>() {});
            } catch (Exception e) {
                return new LinkedHashMap<>();
            }
        }
    }

    /** Convenience used by AuthService. */
    public static AuthResponse of(String token, Employee employee) {
        AuthResponse r = new AuthResponse();
        r.setToken(token);
        r.setUser(UserInfo.fromEmployee(employee));
        return r;
    }
}
