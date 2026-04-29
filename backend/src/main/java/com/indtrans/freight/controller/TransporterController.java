package com.indtrans.freight.controller;

import com.indtrans.freight.model.Transporter;
import com.indtrans.freight.repository.TransporterRepository;
import com.indtrans.freight.util.FileUploadUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/transporters")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class TransporterController {

    @Autowired
    private TransporterRepository transporterRepository;

    @GetMapping
    @PreAuthorize("@perm.has('transporters','view')")
    public ResponseEntity<List<Transporter>> getAllTransporters() {
        return ResponseEntity.ok(transporterRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('transporters','view')")
    public ResponseEntity<Transporter> getTransporter(@PathVariable String id) {
        return transporterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('transporters','add')")
    public ResponseEntity<Transporter> createTransporter(
            @RequestParam("companyName") String companyName,
            @RequestParam(value = "contactNumber", required = false) String contactNumber,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "bankName", required = false) String bankName,
            @RequestParam(value = "ifscCode", required = false) String ifscCode,
            @RequestParam(value = "accountNumber", required = false) String accountNumber,
            @RequestParam(value = "branchName", required = false) String branchName,
            @RequestParam(value = "chequeFile", required = false) MultipartFile chequeFile) {

        try {
            if (email != null && transporterRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().build();
            }

            Transporter transporter = new Transporter();
            transporter.setCompanyName(companyName);
            transporter.setContactNumber(contactNumber);
            transporter.setEmail(email);
            transporter.setAddress(address);
            transporter.setBankName(bankName);
            transporter.setIfscCode(ifscCode);
            transporter.setAccountNumber(accountNumber);
            transporter.setBranchName(branchName);

            if (chequeFile != null && !chequeFile.isEmpty()) {
                transporter.setChequeFileUrl(FileUploadUtil.saveToFolder(chequeFile, "cheques"));
                transporter.setChequeFileName(chequeFile.getOriginalFilename());
            }

            Transporter saved = transporterRepository.save(transporter);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("@perm.has('transporters','edit')")
    public ResponseEntity<Transporter> updateTransporter(
            @PathVariable String id,
            @RequestParam("companyName") String companyName,
            @RequestParam(value = "contactNumber", required = false) String contactNumber,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "bankName", required = false) String bankName,
            @RequestParam(value = "ifscCode", required = false) String ifscCode,
            @RequestParam(value = "accountNumber", required = false) String accountNumber,
            @RequestParam(value = "branchName", required = false) String branchName,
            @RequestParam(value = "chequeFile", required = false) MultipartFile chequeFile) {

        try {
            Transporter transporter = transporterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Transporter not found"));

            transporter.setCompanyName(companyName);
            transporter.setContactNumber(contactNumber);
            transporter.setEmail(email);
            transporter.setAddress(address);
            transporter.setBankName(bankName);
            transporter.setIfscCode(ifscCode);
            transporter.setAccountNumber(accountNumber);
            transporter.setBranchName(branchName);

            if (chequeFile != null && !chequeFile.isEmpty()) {
                transporter.setChequeFileUrl(FileUploadUtil.saveToFolder(chequeFile, "cheques"));
                transporter.setChequeFileName(chequeFile.getOriginalFilename());
            }

            Transporter updated = transporterRepository.save(transporter);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('transporters','delete')")
    public ResponseEntity<Void> deleteTransporter(@PathVariable String id) {
        transporterRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
