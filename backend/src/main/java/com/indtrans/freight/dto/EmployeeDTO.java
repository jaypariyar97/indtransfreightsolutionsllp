package com.indtrans.freight.dto;

import java.util.Set;

public class EmployeeDTO {
    private String id;
    private String name;
    private String email;
    private String role;
    private Set<String> permissions;
    
    // Constructors
    public EmployeeDTO() {}
    
    public EmployeeDTO(String id, String name, String email, String role, Set<String> permissions) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.permissions = permissions;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Set<String> getPermissions() { return permissions; }
    public void setPermissions(Set<String> permissions) { this.permissions = permissions; }
}