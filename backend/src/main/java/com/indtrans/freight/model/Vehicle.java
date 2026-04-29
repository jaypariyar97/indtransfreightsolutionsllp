package com.indtrans.freight.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "vehicles")
public class Vehicle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "VARCHAR(36)", length = 36)
    private String id;
    
    // Registration Number (e.g., MH02AB1234)
    @Column(unique = true, nullable = false)
    private String vehicleNumber;
    
    @Column(nullable = false)
    private String make; // e.g., Tata, Eicher
    
    @Column(nullable = false)
    private String model; // e.g., 407, Ace
    
    private String type; // e.g., Truck, Tempo, Bike
    
    private Integer capacityKg; // Load capacity in kg
    
    private String status; // e.g., Available, In-Transit, Maintenance
    
    private String driverName;
    private String driverPhone;
    
    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    private Instant updatedAt;
    
    private LocalDate fitnessExpiry;
    private LocalDate taxExpiry;
    
    @Column(name = "rc_expiry")
    private LocalDate rcExpiry;

    @Column(name = "insurance_expiry")
    private LocalDate insuranceExpiry;

    @Column(name = "permit_expiry")
    private LocalDate permitExpiry;

    @Column(name = "rc_document_path")
    private String rcDocumentPath;

    @Column(name = "insurance_document_path")
    private String insuranceDocumentPath;

    @Column(name = "permit_document_path")
    private String permitDocumentPath;
    
    @Column(name = "fitness_document_path")
    private String fitnessDocumentPath;

    @Column(name = "tax_document_path")
    private String taxDocumentPath;

    // === MANUAL GETTERS & SETTERS (NO LOMBOK) ===
    public LocalDate getRcExpiry() { return rcExpiry; }
    public void setRcExpiry(LocalDate rcExpiry) { this.rcExpiry = rcExpiry; }

    public LocalDate getInsuranceExpiry() { return insuranceExpiry; }
    public void setInsuranceExpiry(LocalDate insuranceExpiry) { this.insuranceExpiry = insuranceExpiry; }

    public LocalDate getPermitExpiry() { return permitExpiry; }
    public void setPermitExpiry(LocalDate permitExpiry) { this.permitExpiry = permitExpiry; }

    public String getRcDocumentPath() { return rcDocumentPath; }
    public void setRcDocumentPath(String rcDocumentPath) { this.rcDocumentPath = rcDocumentPath; }

    public String getInsuranceDocumentPath() { return insuranceDocumentPath; }
    public void setInsuranceDocumentPath(String insuranceDocumentPath) { this.insuranceDocumentPath = insuranceDocumentPath; }

    public String getPermitDocumentPath() { return permitDocumentPath; }
    public void setPermitDocumentPath(String permitDocumentPath) { this.permitDocumentPath = permitDocumentPath; }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    
    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }
    
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public Integer getCapacityKg() { return capacityKg; }
    public void setCapacityKg(Integer capacityKg) { this.capacityKg = capacityKg; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    
    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
    
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    
    public String getFitnessDocumentPath() {return fitnessDocumentPath;}
    public void setFitnessDocumentPath(String fitnessDocumentPath) {this.fitnessDocumentPath = fitnessDocumentPath;}

    public String getTaxDocumentPath() {return taxDocumentPath;}
    public void setTaxDocumentPath(String taxDocumentPath) {this.taxDocumentPath = taxDocumentPath;}
	public LocalDate getFitnessExpiry() {
		return fitnessExpiry;
	}
	public void setFitnessExpiry(LocalDate fitnessExpiry) {
		this.fitnessExpiry = fitnessExpiry;
	}
	public LocalDate getTaxExpiry() {
		return taxExpiry;
	}
	public void setTaxExpiry(LocalDate taxExpiry) {
		this.taxExpiry = taxExpiry;
	}
}