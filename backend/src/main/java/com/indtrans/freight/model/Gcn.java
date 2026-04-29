package com.indtrans.freight.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "gcns")
public class Gcn {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "VARCHAR(36)", length = 36)
    private String id;
    
    @Column(name = "gcn_number", unique = true, nullable = false)
    private String gcnNumber;
    
    @Column(name = "vhc_id")
    private String vhcId;
    
    @Column(name = "customer_id")
    private String customerId;
    
    @Column(name = "vehicle_id")
    private String vehicleId;
    
    @Column(name = "driver_id")
    private String driverId;
    
    // Consignor Details
    @Column(name = "consignor_name")
    private String consignorName;
    
    @Column(name = "consignor_address", columnDefinition = "TEXT")
    private String consignorAddress;
    
    @Column(name = "consignor_gst")
    private String consignorGst;
    
    @Column(name = "consignor_pincode")
    private String consignorPincode;
    
    // Consignee Details
    @Column(name = "consignee_name")
    private String consigneeName;
    
    @Column(name = "consignee_address", columnDefinition = "TEXT")
    private String consigneeAddress;
    
    @Column(name = "consignee_gst")
    private String consigneeGst;
    
    @Column(name = "consignee_pincode")
    private String consigneePincode;
    
    // Location Details
    @Column(name = "from_location")
    private String fromLocation;
    
    @Column(name = "to_location")
    private String toLocation;
    
    @Column(name = "gcn_date")
    private LocalDate gcnDate;
    
    // Billing & Insurance
    @Column(name = "billing_type")
    private String billingType; // TO_PAY, PAID, TO_BE_BILLED
    
    @Column(name = "insurance_consignor")
    private Boolean insuranceConsignor;
    
    @Column(name = "insurance_consignee")
    private Boolean insuranceConsignee;
    
    // Receipt & Freight
    @Column(name = "receipt_path")
    private String receiptPath;
    
    @Column(name ="receipt_original_name")
    	    private String receiptOriginalName;
    
    @Column(name = "customer_freight", precision = 10, scale = 2)
    private BigDecimal customerFreight;
    
    @Column(name = "advance", precision = 10, scale = 2)
    private BigDecimal advance;
    
    @Column(name = "loading_charge", precision = 10, scale = 2)
    private BigDecimal loadingCharge;
    
    @Column(name = "unloading_charge", precision = 10, scale = 2)
    private BigDecimal unloadingCharge;
    
    @Column(name = "detention_charge", precision = 10, scale = 2)
    private BigDecimal detentionCharge;
    
    @Column(name = "others_charge", precision = 10, scale = 2)
    private BigDecimal othersCharge;
    
    @Column(name = "payment_terms")
    private String paymentTerms;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    private String status; // ACTIVE, COMPLETED, etc.
    
    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
    
    @UpdateTimestamp
    private Instant updatedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getGcnNumber() { return gcnNumber; }
    public void setGcnNumber(String gcnNumber) { this.gcnNumber = gcnNumber; }
    public String getVhcId() { return vhcId; }
    public void setVhcId(String vhcId) { this.vhcId = vhcId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }
    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }
    public String getConsignorName() { return consignorName; }
    public void setConsignorName(String consignorName) { this.consignorName = consignorName; }
    public String getConsignorAddress() { return consignorAddress; }
    public void setConsignorAddress(String consignorAddress) { this.consignorAddress = consignorAddress; }
    public String getConsignorGst() { return consignorGst; }
    public void setConsignorGst(String consignorGst) { this.consignorGst = consignorGst; }
    public String getConsignorPincode() { return consignorPincode; }
    public void setConsignorPincode(String consignorPincode) { this.consignorPincode = consignorPincode; }
    public String getConsigneeName() { return consigneeName; }
    public void setConsigneeName(String consigneeName) { this.consigneeName = consigneeName; }
    public String getConsigneeAddress() { return consigneeAddress; }
    public void setConsigneeAddress(String consigneeAddress) { this.consigneeAddress = consigneeAddress; }
    public String getConsigneeGst() { return consigneeGst; }
    public void setConsigneeGst(String consigneeGst) { this.consigneeGst = consigneeGst; }
    public String getConsigneePincode() { return consigneePincode; }
    public void setConsigneePincode(String consigneePincode) { this.consigneePincode = consigneePincode; }
    public String getFromLocation() { return fromLocation; }
    public void setFromLocation(String fromLocation) { this.fromLocation = fromLocation; }
    public String getToLocation() { return toLocation; }
    public void setToLocation(String toLocation) { this.toLocation = toLocation; }
    public LocalDate getGcnDate() { return gcnDate; }
    public void setGcnDate(LocalDate gcnDate) { this.gcnDate = gcnDate; }
    public String getBillingType() { return billingType; }
    public void setBillingType(String billingType) { this.billingType = billingType; }
    public Boolean getInsuranceConsignor() { return insuranceConsignor; }
    public void setInsuranceConsignor(Boolean insuranceConsignor) { this.insuranceConsignor = insuranceConsignor; }
    public Boolean getInsuranceConsignee() { return insuranceConsignee; }
    public void setInsuranceConsignee(Boolean insuranceConsignee) { this.insuranceConsignee = insuranceConsignee; }
    public String getReceiptPath() { return receiptPath; }
    public void setReceiptPath(String receiptPath) { this.receiptPath = receiptPath; }
    public void setReceiptOriginalName(String receiptOriginalName) { this.receiptOriginalName = receiptOriginalName; }
    public BigDecimal getCustomerFreight() { return customerFreight; }
    public void setCustomerFreight(BigDecimal customerFreight) { this.customerFreight = customerFreight; }
    public BigDecimal getAdvance() { return advance; }
    public void setAdvance(BigDecimal advance) { this.advance = advance; }
    public BigDecimal getLoadingCharge() { return loadingCharge; }
    public void setLoadingCharge(BigDecimal loadingCharge) { this.loadingCharge = loadingCharge; }
    public BigDecimal getUnloadingCharge() { return unloadingCharge; }
    public void setUnloadingCharge(BigDecimal unloadingCharge) { this.unloadingCharge = unloadingCharge; }
    public BigDecimal getDetentionCharge() { return detentionCharge; }
    public void setDetentionCharge(BigDecimal detentionCharge) { this.detentionCharge = detentionCharge; }
    public BigDecimal getOthersCharge() { return othersCharge; }
    public void setOthersCharge(BigDecimal othersCharge) { this.othersCharge = othersCharge; }
    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}