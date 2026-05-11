package com.indtrans.freight.util;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.indtrans.freight.dto.IdCounter;
import com.indtrans.freight.repository.IdCounterRepository;
import org.springframework.dao.DuplicateKeyException;

import java.time.Year;

@Component
public class SerialNumberGenerator {

    private final IdCounterRepository counterRepository;

    // Manual constructor injection (replaces @RequiredArgsConstructor)
    public SerialNumberGenerator(IdCounterRepository counterRepository) {
        this.counterRepository = counterRepository;
    }

    @Transactional
    public String generateVhcNumber() {
        return generateSerial("vhc", "VHC", 6);
    }

    @Transactional
    public String generateGcnNumber() {
        return generateSerial("gcn", "GCN", 6);
    }

    @Transactional
    public String generateBillNumber() {
        return generateSerial("bill", "BILL", 6);
    }

//    private String generateSerial(String entity, String prefix, int digits) {
//        int year = Year.now().getValue();
//        // Per-year counter so the sequence resets on Jan 1.
//        String counterKey = entity + "_" + year;
//
//        counterRepository.incrementCounter(counterKey);
//        Integer newValue = counterRepository.getCurrentValue(counterKey);
//        if (newValue == null) {
//            throw new RuntimeException("Failed to generate serial for: " + counterKey);
//        }
//        return String.format("%s-%d-%0" + digits + "d", prefix, year, newValue);
//    }
    
    @Transactional
    private String generateSerial(String entity, String prefix, int digits) {
        int year = Year.now().getValue();
        String counterKey = entity + "_" + year; // e.g., "vhc_2026"

        // Try to increment existing counter
        int rowsAffected = counterRepository.incrementCounter(counterKey);
        
        // If no row was updated, counter doesn't exist yet → create it
        if (rowsAffected == 0) {
            try {
                // Insert new counter with initial value 0
                counterRepository.save(new IdCounter(counterKey, 0));
            } catch (DuplicateKeyException e) {
                // Another thread created it concurrently - that's ok, continue
            }
            // Now increment the (newly created or existing) counter
            counterRepository.incrementCounter(counterKey);
        }
        
        Integer newValue = counterRepository.getCurrentValue(counterKey);
        if (newValue == null) {
            throw new RuntimeException("Failed to generate serial for: " + counterKey);
        }
        
        return String.format("%s-%d-%0" + digits + "d", prefix, year, newValue);
    }
}