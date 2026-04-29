package com.indtrans.freight.repository;

import com.indtrans.freight.dto.IdCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface IdCounterRepository extends JpaRepository<IdCounter, String> {
    
    /**
     * Find counter by entity name (vhc/gcn/bill)
     */
    Optional<IdCounter> findByEntity(String entity);
    
    /**
     * Atomically increment counter value (native SQL for thread-safety)
     */
    @Modifying
    @Transactional
    @Query(value = """
        UPDATE id_counters 
        SET current_value = current_value + 1, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE entity = :entity
        """, nativeQuery = true)
    int incrementCounter(String entity);
    
    /**
     * Get current value without incrementing
     */
    @Query("SELECT c.currentValue FROM IdCounter c WHERE c.entity = :entity")
    Integer getCurrentValue(String entity);
}