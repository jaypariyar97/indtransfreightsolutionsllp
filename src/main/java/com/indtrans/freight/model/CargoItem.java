package com.indtrans.freight.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "gcn_cargo_items")
public class CargoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "VARCHAR(36)", length = 36)
    private String id;

    // Link to the parent GCN
    @Column(name = "gcn_id", nullable = false)
    private String gcnId;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "packing_type", length = 100)
    private String packingType;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "weight", precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "invoice_amount", precision = 10, scale = 2)
    private BigDecimal invoiceAmount;

    // --- Getters and Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGcnId() { return gcnId; }
    public void setGcnId(String gcnId) { this.gcnId = gcnId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPackingType() { return packingType; }
    public void setPackingType(String packingType) { this.packingType = packingType; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }

    public BigDecimal getInvoiceAmount() { return invoiceAmount; }
    public void setInvoiceAmount(BigDecimal invoiceAmount) { this.invoiceAmount = invoiceAmount; }
}