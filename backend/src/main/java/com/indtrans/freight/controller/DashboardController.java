package com.indtrans.freight.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.indtrans.freight.repository.BillingRepository;
import com.indtrans.freight.repository.CustomerRepository;
import com.indtrans.freight.repository.DriverRepository;
import com.indtrans.freight.repository.GcnRepository;
import com.indtrans.freight.repository.TransporterRepository;
import com.indtrans.freight.repository.VehicleRepository;
import com.indtrans.freight.repository.VhcRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class DashboardController {
    
    @Autowired private CustomerRepository customerRepository;
    @Autowired private TransporterRepository transporterRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private DriverRepository driverRepository;
    @Autowired private VhcRepository vhcRepository;
    @Autowired private GcnRepository gcnRepository;
    @Autowired private BillingRepository billingRepository;
    
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Count all modules
        stats.put("totalCustomers", customerRepository.count());
        stats.put("totalTransporters", transporterRepository.count());
        stats.put("totalVehicles", vehicleRepository.count());
        stats.put("totalDrivers", driverRepository.count());
        stats.put("totalVHC", vhcRepository.count());
        stats.put("totalGCN", gcnRepository.count());
        stats.put("totalBilling", billingRepository.count());
        
        // Available vehicles
        stats.put("availableVehicles", vehicleRepository.findAll().stream()
            .filter(v -> "Available".equalsIgnoreCase(v.getStatus())).count());
        
        // Active shipments (IN_TRANSIT)
        stats.put("activeShipments", gcnRepository.findAll().stream()
            .filter(g -> "IN_TRANSIT".equals(g.getStatus())).count());
        
        // Completed shipments (DELIVERED)
        stats.put("completedShipments", gcnRepository.findAll().stream()
            .filter(g -> "DELIVERED".equals(g.getStatus())).count());
        
        // Pending invoices/billing
        stats.put("pendingInvoices", billingRepository.findAll().stream()
            .filter(b -> "PENDING".equals(b.getStatus())).count());
        
        // Total billing amount
        BigDecimal totalAmount = billingRepository.findAll().stream()
            .map(b -> b.getAmount() != null ? b.getAmount() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalBillingAmount", totalAmount);
        
        // Pending payments count
        stats.put("pendingPayments", billingRepository.findAll().stream()
            .filter(b -> "PENDING".equals(b.getStatus())).count());
        
        return ResponseEntity.ok(stats);
    }
}