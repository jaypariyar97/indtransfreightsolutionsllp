package com.indtrans.freight.controller;

import com.indtrans.freight.model.Driver;
import com.indtrans.freight.repository.DriverRepository;
import com.indtrans.freight.util.FileUploadUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/drivers")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class DriverController {
    
    @Autowired
    private DriverRepository driverRepository;
    
    @GetMapping
    @PreAuthorize("@perm.has('drivers','view')")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverRepository.findAll());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('drivers','view')")
    public ResponseEntity<Driver> getDriver(@PathVariable String id) {
        return driverRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('drivers','add')")
    public ResponseEntity<Driver> createDriver(
            @RequestParam("fullName") String fullName,
            @RequestParam("licenceNumber") String licenceNumber,
            @RequestParam("contactNumber") String contactNumber,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "licenceFile", required = false) MultipartFile licenceFile) {
        
        try {
            // Check if licence number already exists
            if (driverRepository.existsByLicenceNumber(licenceNumber)) {
                return ResponseEntity.badRequest().build();
            }
            
            // Create driver object
            Driver driver = new Driver();
            driver.setFullName(fullName);
            driver.setLicenceNumber(licenceNumber);
            driver.setContactNumber(contactNumber);
            driver.setAddress(address);
            
            // Handle licence file upload
            if (licenceFile != null && !licenceFile.isEmpty()) {
                String licencePath = FileUploadUtil.saveFile(licenceFile, "licence");
                driver.setLicenceDocumentPath(licencePath);
            }
            
            Driver saved = driverRepository.save(driver);
            return ResponseEntity.ok(saved);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('drivers','edit')")
    public ResponseEntity<Driver> updateDriver(
            @PathVariable String id,
            @RequestParam("fullName") String fullName,
            @RequestParam("licenceNumber") String licenceNumber,
            @RequestParam("contactNumber") String contactNumber,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "licenceFile", required = false) MultipartFile licenceFile) {
        
        try {
            if (!driverRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            // Get existing driver
            Driver driver = driverRepository.findById(id).get();
            
            // Update fields
            driver.setFullName(fullName);
            driver.setLicenceNumber(licenceNumber);
            driver.setContactNumber(contactNumber);
            driver.setAddress(address);
            
            // Handle licence file upload (delete old if new uploaded)
            if (licenceFile != null && !licenceFile.isEmpty()) {
                FileUploadUtil.deleteFile(driver.getLicenceDocumentPath());
                String licencePath = FileUploadUtil.saveFile(licenceFile, "licence");
                driver.setLicenceDocumentPath(licencePath);
            }
            
            Driver updated = driverRepository.save(driver);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('drivers','delete')")
    public ResponseEntity<Void> deleteDriver(@PathVariable String id) {
        try {
            Driver driver = driverRepository.findById(id).orElse(null);
            if (driver != null) {
                // Delete associated licence file
                FileUploadUtil.deleteFile(driver.getLicenceDocumentPath());
                driverRepository.deleteById(id);
            }
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}