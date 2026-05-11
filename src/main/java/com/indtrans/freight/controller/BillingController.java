package com.indtrans.freight.controller;

import com.indtrans.freight.model.Billing;
import com.indtrans.freight.repository.BillingRepository;
import com.indtrans.freight.util.FileUploadUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/billing")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class BillingController {
    
    @Autowired
    private BillingRepository billingRepository;
    
    @GetMapping
    @PreAuthorize("@perm.has('billing','view')")
    public ResponseEntity<List<Billing>> getAllBilling() {
        return ResponseEntity.ok(billingRepository.findAll());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('billing','view')")
    public ResponseEntity<Billing> getBilling(@PathVariable String id) {
        return billingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("@perm.has('billing','edit')")
    public ResponseEntity<Billing> updateStatus(
            @PathVariable String id,
            @RequestParam String status) {
        
        try {
            Billing billing = billingRepository.findById(id).orElseThrow();
            billing.setStatus(status);
            
            if ("PAID".equals(status)) {
                billing.setPaidAmount(billing.getAmount());
            }
            
            Billing updated = billingRepository.save(billing);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/amount")
    @PreAuthorize("@perm.has('billing','edit')")
    public ResponseEntity<Billing> updateAmount(
            @PathVariable String id,
            @RequestParam BigDecimal amount) {
        
        try {
            Billing billing = billingRepository.findById(id).orElseThrow();
            billing.setAmount(amount);
            
            Billing updated = billingRepository.save(billing);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('billing','delete')")
    public ResponseEntity<Void> deleteBilling(@PathVariable String id) {
        try {
            billingRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('billing','edit')")
    public ResponseEntity<Billing> updateBilling(
            @PathVariable String id,
            @RequestBody Billing billingDetails) {
        
        try {
            Billing billing = billingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Billing not found"));
            
            // Update fields
            billing.setBillNumber(billingDetails.getBillNumber());
            billing.setBillDate(billingDetails.getBillDate());
            billing.setCustomerName(billingDetails.getCustomerName());
            billing.setCustomerAddress(billingDetails.getCustomerAddress());
            billing.setCustomerGst(billingDetails.getCustomerGst());
            billing.setAmount(billingDetails.getAmount());
            billing.setPaidAmount(billingDetails.getPaidAmount());
            billing.setStatus(billingDetails.getStatus());
            billing.setRemarks(billingDetails.getRemarks());
            
            Billing updated = billingRepository.save(billing);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Upload a payment receipt (PDF/JPG/PNG) for a billing record.
     * Attaching a receipt auto-marks the bill as PAID and sets paidAmount.
     */
    @PostMapping(value = "/{id}/receipt", consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('billing','add')")
    public ResponseEntity<Billing> uploadReceipt(
            @PathVariable String id,
            @RequestParam("receipt") MultipartFile receipt) {
        try {
            Billing billing = billingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Billing not found"));

            if (billing.getReceiptPath() != null && !billing.getReceiptPath().isEmpty()) {
                FileUploadUtil.deleteFile(billing.getReceiptPath());
            }

            String path = FileUploadUtil.saveToFolder(receipt, "receipts");
            billing.setReceiptPath(path);

            billing.setStatus("PAID");
            if (billing.getAmount() != null) {
                billing.setPaidAmount(billing.getAmount());
            }

            Billing updated = billingRepository.save(billing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Remove the stored receipt (does not change billing status).
     */
    @DeleteMapping("/{id}/receipt")
    @PreAuthorize("@perm.has('billing','delete')")
    public ResponseEntity<Billing> deleteReceipt(@PathVariable String id) {
        try {
            Billing billing = billingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Billing not found"));

            if (billing.getReceiptPath() != null) {
                FileUploadUtil.deleteFile(billing.getReceiptPath());
                billing.setReceiptPath(null);
                billingRepository.save(billing);
            }
            return ResponseEntity.ok(billing);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}