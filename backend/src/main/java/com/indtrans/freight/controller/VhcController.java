package com.indtrans.freight.controller;

import com.indtrans.freight.model.Vhc;
import com.indtrans.freight.repository.VhcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/vhc")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class VhcController {
    
    @Autowired
    private VhcRepository vhcRepository;
    @Autowired
    private com.indtrans.freight.util.SerialNumberGenerator serialNumberGenerator;
    
    @GetMapping
    @PreAuthorize("@perm.has('vhc','view')")
    public ResponseEntity<List<Vhc>> getAllVhc() {
        return ResponseEntity.ok(vhcRepository.findAll());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('vhc','view')")
    public ResponseEntity<Vhc> getVhc(@PathVariable String id) {
        return vhcRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('vhc','add')")
    public ResponseEntity<Vhc> createVhc(
            @RequestParam(value = "vhcNumber", required = false) String vhcNumber,
            @RequestParam("customerId") String customerId,
            @RequestParam("vehicleId") String vehicleId,
            @RequestParam("driverId") String driverId,
            @RequestParam("fromLocation") String fromLocation,
            @RequestParam("toLocation") String toLocation,
            @RequestParam("vhcDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vhcDate,
            @RequestParam(value = "transportCost", required = false, defaultValue = "0") BigDecimal transportCost,
            @RequestParam(value = "advance", required = false, defaultValue = "0") BigDecimal advance,
            @RequestParam(value = "loading", required = false, defaultValue = "0") BigDecimal loading,
            @RequestParam(value = "unloading", required = false, defaultValue = "0") BigDecimal unloading,
            @RequestParam(value = "detention", required = false, defaultValue = "0") BigDecimal detention,
            @RequestParam(value = "others", required = false, defaultValue = "0") BigDecimal others,
            @RequestParam(value = "remarks", required = false) String remarks) {
        
        try {
            // Auto-generate VHC number if not provided
            
        	if (vhcNumber == null || vhcNumber.isEmpty()) {
                vhcNumber = serialNumberGenerator.generateVhcNumber();
            }
            // Check if VHC number already exists
            if (vhcRepository.existsByVhcNumber(vhcNumber)) {
                return ResponseEntity.badRequest().build();
            }
            
            // Create VHC object
            Vhc vhc = new Vhc();
            vhc.setVhcNumber(vhcNumber);
            vhc.setCustomerId(customerId);
            vhc.setVehicleId(vehicleId);
            vhc.setDriverId(driverId);
            vhc.setFromLocation(fromLocation);
            vhc.setToLocation(toLocation);
            vhc.setVhcDate(vhcDate);
            vhc.setTransportCost(transportCost);
            vhc.setAdvance(advance);
            vhc.setLoading(loading);
            vhc.setUnloading(unloading);
            vhc.setDetention(detention);
            vhc.setOthers(others);
            
            // Calculate balance
            BigDecimal total = transportCost
                    .add(loading)
                    .add(unloading)
                    .add(detention)
                    .add(others);
            BigDecimal balance = total.subtract(advance);
            vhc.setBalance(balance);
            
            vhc.setRemarks(remarks);
            vhc.setStatus("PENDING");
            
            Vhc saved = vhcRepository.save(vhc);
            return ResponseEntity.ok(saved);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('vhc','edit')")
    public ResponseEntity<Vhc> updateVhc(
            @PathVariable String id,
            @RequestParam(value = "vhcNumber", required = false) String vhcNumber,
            @RequestParam("customerId") String customerId,
            @RequestParam("vehicleId") String vehicleId,
            @RequestParam("driverId") String driverId,
            @RequestParam("fromLocation") String fromLocation,
            @RequestParam("toLocation") String toLocation,
            @RequestParam("vhcDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vhcDate,
            @RequestParam(value = "transportCost", required = false, defaultValue = "0") BigDecimal transportCost,
            @RequestParam(value = "advance", required = false, defaultValue = "0") BigDecimal advance,
            @RequestParam(value = "loading", required = false, defaultValue = "0") BigDecimal loading,
            @RequestParam(value = "unloading", required = false, defaultValue = "0") BigDecimal unloading,
            @RequestParam(value = "detention", required = false, defaultValue = "0") BigDecimal detention,
            @RequestParam(value = "others", required = false, defaultValue = "0") BigDecimal others,
            @RequestParam(value = "remarks", required = false) String remarks) {
        
        try {
            if (!vhcRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            // Get existing VHC
            Vhc vhc = vhcRepository.findById(id).get();
            
            // Update fields
            if (vhcNumber != null && !vhcNumber.isEmpty()) {
                vhc.setVhcNumber(vhcNumber);
            }
            vhc.setCustomerId(customerId);
            vhc.setVehicleId(vehicleId);
            vhc.setDriverId(driverId);
            vhc.setFromLocation(fromLocation);
            vhc.setToLocation(toLocation);
            vhc.setVhcDate(vhcDate);
            vhc.setTransportCost(transportCost);
            vhc.setAdvance(advance);
            vhc.setLoading(loading);
            vhc.setUnloading(unloading);
            vhc.setDetention(detention);
            vhc.setOthers(others);
            
            // Calculate balance
            BigDecimal total = transportCost
                    .add(loading)
                    .add(unloading)
                    .add(detention)
                    .add(others);
            BigDecimal balance = total.subtract(advance);
            vhc.setBalance(balance);
            
            vhc.setRemarks(remarks);
            
            Vhc updated = vhcRepository.save(vhc);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('vhc','delete')")
    public ResponseEntity<Void> deleteVhc(@PathVariable String id) {
        try {
            vhcRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}