package com.indtrans.freight.dto;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Entity for serial number counters (VHC, GCN, BILL)
 * No Lombok dependencies - manual getters/setters
 */
@Entity
@Table(name = "id_counters")
public class IdCounter {
    
    @Id
    @Column(length = 50)
    private String entity;  // "vhc", "gcn", "bill"
    
    @Column(name = "current_value")
    private Integer currentValue = 0;
    
    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    private Instant updatedAt;
    
    // === CONSTRUCTORS ===
    public IdCounter() {
    }
    
    public IdCounter(String entity, Integer currentValue) {
        this.entity = entity;
        this.currentValue = currentValue;
    }
    
    // === GETTERS AND SETTERS ===
    public String getEntity() {
        return entity;
    }
    
    public void setEntity(String entity) {
        this.entity = entity;
    }
    
    public Integer getCurrentValue() {
        return currentValue;
    }
    
    public void setCurrentValue(Integer currentValue) {
        this.currentValue = currentValue;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // === MANUAL BUILDER ===
    public static IdCounterBuilder builder() {
        return new IdCounterBuilder();
    }
    
    public static class IdCounterBuilder {
        private String entity;
        private Integer currentValue = 0;
        
        public IdCounterBuilder entity(String entity) { this.entity = entity; return this; }
        public IdCounterBuilder currentValue(Integer currentValue) { this.currentValue = currentValue; return this; }
        
        public IdCounter build() {
            IdCounter counter = new IdCounter();
            counter.setEntity(entity);
            counter.setCurrentValue(currentValue);
            return counter;
        }
    }
}