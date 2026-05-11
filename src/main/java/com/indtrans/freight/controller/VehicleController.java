package com.indtrans.freight.controller;

import com.indtrans.freight.model.Vehicle;
import com.indtrans.freight.repository.VehicleRepository;
import com.indtrans.freight.util.FileUploadUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class VehicleController {
    
    @Autowired
    private VehicleRepository vehicleRepository;
    
    @GetMapping
    @PreAuthorize("@perm.has('vehicles','view')")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('vehicles','view')")
    public ResponseEntity<Vehicle> getVehicle(@PathVariable String id) {
        return vehicleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('vehicles','add')")
    public ResponseEntity<Vehicle> createVehicle(
            @RequestParam("vehicleNumber") String vehicleNumber,
            @RequestParam("make") String make,
            @RequestParam("model") String model,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "rcExpiry", required = false) String rcExpiry,
            @RequestParam(value = "insuranceExpiry", required = false) String insuranceExpiry,
            @RequestParam(value = "permitExpiry", required = false) String permitExpiry,

            // ✅ NEW EXPIRY FIELDS
            @RequestParam(value = "fitnessExpiry", required = false) String fitnessExpiry,
            @RequestParam(value = "taxExpiry", required = false) String taxExpiry,

            @RequestParam(value = "rcFile", required = false) MultipartFile rcFile,
            @RequestParam(value = "insuranceFile", required = false) MultipartFile insuranceFile,
            @RequestParam(value = "permitFile", required = false) MultipartFile permitFile,

            // ✅ NEW FILES
            @RequestParam(value = "fitnessFile", required = false) MultipartFile fitnessFile,
            @RequestParam(value = "taxFile", required = false) MultipartFile taxFile
    ) {
        
        try {
            if (vehicleRepository.existsByVehicleNumber(vehicleNumber)) {
                return ResponseEntity.badRequest().build();
            }
            
            Vehicle vehicle = new Vehicle();
            vehicle.setVehicleNumber(vehicleNumber);
            vehicle.setMake(make);
            vehicle.setModel(model);
            vehicle.setType(type);

            // Existing expiry
            vehicle.setRcExpiry(rcExpiry != null && !rcExpiry.isEmpty() ? java.time.LocalDate.parse(rcExpiry) : null);
            vehicle.setInsuranceExpiry(insuranceExpiry != null && !insuranceExpiry.isEmpty() ? java.time.LocalDate.parse(insuranceExpiry) : null);
            vehicle.setPermitExpiry(permitExpiry != null && !permitExpiry.isEmpty() ? java.time.LocalDate.parse(permitExpiry) : null);

            // ✅ NEW expiry
            vehicle.setFitnessExpiry(fitnessExpiry != null && !fitnessExpiry.isEmpty() ? java.time.LocalDate.parse(fitnessExpiry) : null);
            vehicle.setTaxExpiry(taxExpiry != null && !taxExpiry.isEmpty() ? java.time.LocalDate.parse(taxExpiry) : null);

            // Existing file uploads
            if (rcFile != null && !rcFile.isEmpty()) {
                String rcPath = FileUploadUtil.saveFile(rcFile, "rc");
                vehicle.setRcDocumentPath(rcPath);
            }
            
            if (insuranceFile != null && !insuranceFile.isEmpty()) {
                String insurancePath = FileUploadUtil.saveFile(insuranceFile, "insurance");
                vehicle.setInsuranceDocumentPath(insurancePath);
            }
            
            if (permitFile != null && !permitFile.isEmpty()) {
                String permitPath = FileUploadUtil.saveFile(permitFile, "permit");
                vehicle.setPermitDocumentPath(permitPath);
            }

            // ✅ NEW file uploads
            if (fitnessFile != null && !fitnessFile.isEmpty()) {
                String fitnessPath = FileUploadUtil.saveFile(fitnessFile, "fitness");
                vehicle.setFitnessDocumentPath(fitnessPath);
            }

            if (taxFile != null && !taxFile.isEmpty()) {
                String taxPath = FileUploadUtil.saveFile(taxFile, "tax");
                vehicle.setTaxDocumentPath(taxPath);
            }
            
            Vehicle saved = vehicleRepository.save(vehicle);
            return ResponseEntity.ok(saved);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('vehicles','edit')")
    public ResponseEntity<Vehicle> updateVehicle(
            @PathVariable String id,
            @RequestParam("vehicleNumber") String vehicleNumber,
            @RequestParam("make") String make,
            @RequestParam("model") String model,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "rcExpiry", required = false) String rcExpiry,
            @RequestParam(value = "insuranceExpiry", required = false) String insuranceExpiry,
            @RequestParam(value = "permitExpiry", required = false) String permitExpiry,

            // ✅ NEW expiry
            @RequestParam(value = "fitnessExpiry", required = false) String fitnessExpiry,
            @RequestParam(value = "taxExpiry", required = false) String taxExpiry,

            @RequestParam(value = "rcFile", required = false) MultipartFile rcFile,
            @RequestParam(value = "insuranceFile", required = false) MultipartFile insuranceFile,
            @RequestParam(value = "permitFile", required = false) MultipartFile permitFile,

            // ✅ NEW files
            @RequestParam(value = "fitnessFile", required = false) MultipartFile fitnessFile,
            @RequestParam(value = "taxFile", required = false) MultipartFile taxFile
    ) {
        
        try {
            if (!vehicleRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            Vehicle vehicle = vehicleRepository.findById(id).get();
            
            vehicle.setVehicleNumber(vehicleNumber);
            vehicle.setMake(make);
            vehicle.setModel(model);
            vehicle.setType(type);

            vehicle.setRcExpiry(rcExpiry != null && !rcExpiry.isEmpty() ? java.time.LocalDate.parse(rcExpiry) : null);
            vehicle.setInsuranceExpiry(insuranceExpiry != null && !insuranceExpiry.isEmpty() ? java.time.LocalDate.parse(insuranceExpiry) : null);
            vehicle.setPermitExpiry(permitExpiry != null && !permitExpiry.isEmpty() ? java.time.LocalDate.parse(permitExpiry) : null);

            // ✅ NEW expiry update
            vehicle.setFitnessExpiry(fitnessExpiry != null && !fitnessExpiry.isEmpty() ? java.time.LocalDate.parse(fitnessExpiry) : null);
            vehicle.setTaxExpiry(taxExpiry != null && !taxExpiry.isEmpty() ? java.time.LocalDate.parse(taxExpiry) : null);

            // Existing file updates
            if (rcFile != null && !rcFile.isEmpty()) {
                FileUploadUtil.deleteFile(vehicle.getRcDocumentPath());
                String rcPath = FileUploadUtil.saveFile(rcFile, "rc");
                vehicle.setRcDocumentPath(rcPath);
            }
            
            if (insuranceFile != null && !insuranceFile.isEmpty()) {
                FileUploadUtil.deleteFile(vehicle.getInsuranceDocumentPath());
                String insurancePath = FileUploadUtil.saveFile(insuranceFile, "insurance");
                vehicle.setInsuranceDocumentPath(insurancePath);
            }
            
            if (permitFile != null && !permitFile.isEmpty()) {
                FileUploadUtil.deleteFile(vehicle.getPermitDocumentPath());
                String permitPath = FileUploadUtil.saveFile(permitFile, "permit");
                vehicle.setPermitDocumentPath(permitPath);
            }

            // ✅ NEW file updates
            if (fitnessFile != null && !fitnessFile.isEmpty()) {
                FileUploadUtil.deleteFile(vehicle.getFitnessDocumentPath());
                String fitnessPath = FileUploadUtil.saveFile(fitnessFile, "fitness");
                vehicle.setFitnessDocumentPath(fitnessPath);
            }

            if (taxFile != null && !taxFile.isEmpty()) {
                FileUploadUtil.deleteFile(vehicle.getTaxDocumentPath());
                String taxPath = FileUploadUtil.saveFile(taxFile, "tax");
                vehicle.setTaxDocumentPath(taxPath);
            }
            
            Vehicle updated = vehicleRepository.save(vehicle);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('vehicles','delete')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable String id) {
        try {
            Vehicle vehicle = vehicleRepository.findById(id).orElse(null);
            if (vehicle != null) {
                FileUploadUtil.deleteFile(vehicle.getRcDocumentPath());
                FileUploadUtil.deleteFile(vehicle.getInsuranceDocumentPath());
                FileUploadUtil.deleteFile(vehicle.getPermitDocumentPath());

                // ✅ NEW deletes
                FileUploadUtil.deleteFile(vehicle.getFitnessDocumentPath());
                FileUploadUtil.deleteFile(vehicle.getTaxDocumentPath());
                
                vehicleRepository.deleteById(id);
            }
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}