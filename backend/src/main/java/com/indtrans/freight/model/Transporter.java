package com.indtrans.freight.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;

@Entity
@Table(name = "transporters")
public class Transporter {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "VARCHAR(36)", length = 36)
    private String id;
    
    @Column(name = "company_name", nullable = false)
    private String companyName;
    
    @Column(name = "contact_number")
    private String contactNumber;
    
    @Column(unique = true)
    private String email;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(name = "bank_name")
    private String bankName;
    
    @Column(name = "ifsc_code")
    private String ifscCode;
    
    @Column(name = "cheque_file_url")
    private String chequeFileUrl;
    
    @Column(name = "cheque_FileName")
    private String chequeFileName;
    
    @Column(name = "account_number")
    private String accountNumber;
    
    public String getChequeFileUrl() {
		return chequeFileUrl;
	}
	public void setChequeFileUrl(String chequeFileUrl) {
		this.chequeFileUrl = chequeFileUrl;
	}
	public String getChequeFileName() {
		return chequeFileName;
	}
	public void setChequeFileName(String chequeFileName) {
		this.chequeFileName = chequeFileName;
	}
	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
	@Column(name = "branch_name")
    private String branchName;
    
    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    private Instant updatedAt;

    // === MANUAL GETTERS & SETTERS (NO LOMBOK) ===
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}