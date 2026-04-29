package com.indtrans.freight.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "vhc")
public class Vhc {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "VARCHAR(36)", length = 36)
    private String id;
    
    @Column(name = "vhc_number", unique = true, nullable = false)
    private String vhcNumber;
    
    @Column(name = "customer_id")
    private String customerId;
    
    @Column(name = "vehicle_id")
    private String vehicleId;
    
    @Column(name = "driver_id")
    private String driverId;
    
    @Column(name = "from_location")
    private String fromLocation;
    
    @Column(name = "to_location")
    private String toLocation;
    
    @Column(name = "vhc_date")
    private LocalDate vhcDate;
    
    @Column(name = "transport_cost", precision = 10, scale = 2)
    private BigDecimal transportCost;
    
    @Column(name = "advance", precision = 10, scale = 2)
    private BigDecimal advance;
    
    @Column(name = "loading", precision = 10, scale = 2)
    private BigDecimal loading;
    
    @Column(name = "unloading", precision = 10, scale = 2)
    private BigDecimal unloading;
    
    @Column(name = "detention", precision = 10, scale = 2)
    private BigDecimal detention;
    
    @Column(name = "others", precision = 10, scale = 2)
    private BigDecimal others;
    
    @Column(name = "balance", precision = 10, scale = 2)
    private BigDecimal balance;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    private String status;
    
    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    private Instant updatedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getVhcNumber() { return vhcNumber; }
    public void setVhcNumber(String vhcNumber) { this.vhcNumber = vhcNumber; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }
    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }
    public String getFromLocation() { return fromLocation; }
    public void setFromLocation(String fromLocation) { this.fromLocation = fromLocation; }
    public String getToLocation() { return toLocation; }
    public void setToLocation(String toLocation) { this.toLocation = toLocation; }
    public LocalDate getVhcDate() { return vhcDate; }
    public void setVhcDate(LocalDate vhcDate) { this.vhcDate = vhcDate; }
    public BigDecimal getTransportCost() { return transportCost; }
    public void setTransportCost(BigDecimal transportCost) { this.transportCost = transportCost; }
    public BigDecimal getAdvance() { return advance; }
    public void setAdvance(BigDecimal advance) { this.advance = advance; }
    public BigDecimal getLoading() { return loading; }
    public void setLoading(BigDecimal loading) { this.loading = loading; }
    public BigDecimal getUnloading() { return unloading; }
    public void setUnloading(BigDecimal unloading) { this.unloading = unloading; }
    public BigDecimal getDetention() { return detention; }
    public void setDetention(BigDecimal detention) { this.detention = detention; }
    public BigDecimal getOthers() { return others; }
    public void setOthers(BigDecimal others) { this.others = others; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}