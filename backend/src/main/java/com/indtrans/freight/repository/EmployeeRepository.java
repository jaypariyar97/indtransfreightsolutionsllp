package com.indtrans.freight.repository;

import com.indtrans.freight.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    Optional<Employee> findByEmail(String email);
    
    // ✅ Add this method to filter by role (matches your ENUM database)
    Optional<Employee> findByEmailAndRole(String email, Employee.Role role);
    
    boolean existsByEmail(String email);
}