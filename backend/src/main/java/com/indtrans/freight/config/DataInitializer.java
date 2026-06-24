package com.indtrans.freight.config;

import com.indtrans.freight.dto.IdCounter;
import com.indtrans.freight.repository.EmployeeRepository;
import com.indtrans.freight.repository.IdCounterRepository;
import com.indtrans.freight.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final IdCounterRepository counterRepository;
    private final EmployeeRepository employeeRepository;
    private final AuthService authService;

    @Value("${app.bootstrap-admin.enabled:true}")
    private boolean bootstrapAdminEnabled;

    @Value("${app.bootstrap-admin.email:operations@indtransfreightsolutions.com}")
    private String bootstrapAdminEmail;

    @Value("${app.bootstrap-admin.password:}")
    private String bootstrapAdminPassword;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

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
                    log.info("Initialized counter for: {}", entity);
                }
            }
        };
    }

    @Bean
    @Order(2)
    public CommandLineRunner createInitialAdmin() {
        return args -> {
            if (!bootstrapAdminEnabled) {
                log.info("Bootstrap admin creation is disabled.");
                return;
            }

            String adminEmail = bootstrapAdminEmail.trim().toLowerCase();
            String adminPassword = bootstrapAdminPassword;
            boolean usingEmbeddedH2 = datasourceUrl != null && datasourceUrl.startsWith("jdbc:h2:");

            if (adminPassword == null || adminPassword.isBlank()) {
                if (!usingEmbeddedH2) {
                    log.warn("Skipping bootstrap admin creation because APP_BOOTSTRAP_ADMIN_PASSWORD is not set.");
                    return;
                }

                adminPassword = "Indtrans 1234";
                log.warn("Using the default bootstrap admin password for embedded H2 only. Set APP_BOOTSTRAP_ADMIN_PASSWORD for non-local deployments.");
            }

            if (!employeeRepository.existsByEmailIgnoreCase(adminEmail)) {
                try {
                    authService.createInitialAdmin(
                            "System Administrator",
                            adminEmail,
                            adminPassword
                    );
                    log.info("Created initial admin user: {}", adminEmail);
                    log.warn("Change the bootstrap admin password after first login.");
                } catch (IllegalStateException e) {
                    log.debug("Admin user already exists: {}", e.getMessage());
                }
            } else {
                log.debug("Admin user already exists: {}", adminEmail);
            }
        };
    }
}
