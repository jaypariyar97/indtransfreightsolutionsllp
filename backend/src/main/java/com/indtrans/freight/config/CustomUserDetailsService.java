package com.indtrans.freight.config;

import com.indtrans.freight.model.Employee;
import com.indtrans.freight.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Employee employee = employeeRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
        
        // ✅ Convert enum to String using .name()
        String roleString = employee.getRole().name();
        
        return User.withUsername(employee.getEmail())
                .password(employee.getPasswordHash())
                .roles(roleString)  // ✅ String, not enum
                .authorities(Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_" + roleString)  // ✅ String concatenation
                ))
                .build();
    }
}