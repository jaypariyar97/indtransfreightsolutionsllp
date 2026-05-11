package com.indtrans.freight.controller;

import com.indtrans.freight.model.Invoice;
import com.indtrans.freight.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/invoices")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class InvoiceController {
    
    @Autowired
    private InvoiceRepository invoiceRepository;
    
    @GetMapping
    @PreAuthorize("@perm.has('billing','view')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceRepository.findAll());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('billing','view')")
    public ResponseEntity<Invoice> getInvoice(@PathVariable String id) {
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("@perm.has('billing','add')")
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice) {
        if (invoice.getInvoiceNumber() != null && invoiceRepository.existsByInvoiceNumber(invoice.getInvoiceNumber())) {
            return ResponseEntity.badRequest().build();
        }
        Invoice saved = invoiceRepository.save(invoice);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('billing','edit')")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable String id, @RequestBody Invoice invoice) {
        if (!invoiceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        invoice.setId(id);
        Invoice updated = invoiceRepository.save(invoice);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('billing','delete')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable String id) {
        invoiceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}