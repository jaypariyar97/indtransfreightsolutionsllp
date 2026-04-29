package com.indtrans.freight.config;

import com.indtrans.freight.dto.IdCounter;
import com.indtrans.freight.repository.EmployeeRepository;  // ← CORRECT: EmployeeRepository, not IdCounterRepository
import com.indtrans.freight.repository.IdCounterRepository;
import com.indtrans.freight.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;  // ← Manual logger import
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class DataInitializer {
    
    // ← Manual logger instead of @Slf4j
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    
    private final IdCounterRepository counterRepository;
    private final EmployeeRepository employeeRepository;  // ← ADD: EmployeeRepository for admin check
    private final AuthService authService;
    
    // ← Manual constructor instead of @RequiredArgsConstructor
    public DataInitializer(
            IdCounterRepository counterRepository,
            EmployeeRepository employeeRepository,
            AuthService authService) {
        this.counterRepository = counterRepository;
        this.employeeRepository = employeeRepository;
        this.authService = authService;
    }
    
    @Bean
    @Order(1)
    public CommandLineRunner initializeCounters() {
        return args -> {
            String[] entities = {"vhc", "gcn", "bill"};
            for (String entity : entities) {
                if (counterRepository.findByEntity(entity).isEmpty()) {
                    counterRepository.save(IdCounter.builder()
                            .entity(entity)
                            .currentValue(0)
                            .build());
                    log.info("Initialized counter for: {}", entity);  // ← Now works with manual logger
                }
            }
        };
    }
    
    @Bean
    @Order(2)
    public CommandLineRunner createInitialAdmin() {
        return args -> {
            String adminEmail = "operations@indtransfreightsolutions.com";
            
            // ← FIXED: Use employeeRepository, not counterRepository!
            if (!employeeRepository.existsByEmail(adminEmail)) {
                try {
                    authService.createInitialAdmin(
                        "System Administrator",
                        adminEmail,
                        "Indtrans 1234"
                    );
                    log.info("✓ Created initial admin user: {}", adminEmail);
                    log.warn("⚠️ Change default password after first login!");
                } catch (IllegalStateException e) {
                    log.debug("Admin user already exists: {}", e.getMessage());
                }
            } else {
                log.debug("Admin user already exists: {}", adminEmail);
            }
        };
    }
}