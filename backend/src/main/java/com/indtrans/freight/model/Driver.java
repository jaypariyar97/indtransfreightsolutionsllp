package com.indtrans.freight.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;

@Entity
@Table(name = "drivers")
public class Driver {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "VARCHAR(36)", length = 36)
    private String id;
    
    @Column(name = "full_name", nullable = false)
    private String fullName;
    
    @Column(name = "licence_number")
    private String licenceNumber;
    
    @Column(name = "contact_number")
    private String contactNumber;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    private Instant updatedAt;
    
    @Column(name = "licence_document_path")
    private String licenceDocumentPath;

    // Getters and Setters
    
    public String getLicenceDocumentPath() { return licenceDocumentPath; }
    public void setLicenceDocumentPath(String licenceDocumentPath) { this.licenceDocumentPath = licenceDocumentPath; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getLicenceNumber() { return licenceNumber; }
    public void setLicenceNumber(String licenceNumber) { this.licenceNumber = licenceNumber; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}