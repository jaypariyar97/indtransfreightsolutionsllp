package com.indtrans.freight.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.indtrans.freight.model.Billing;
import com.indtrans.freight.model.CargoItem;
import com.indtrans.freight.model.Gcn;
import com.indtrans.freight.repository.BillingRepository;
import com.indtrans.freight.repository.CargoItemRepository;
import com.indtrans.freight.repository.GcnRepository;
import com.indtrans.freight.service.GcnService;
import com.indtrans.freight.util.SerialNumberGenerator;




@RestController
@RequestMapping("/gcn")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class GcnController {
        @Autowired private GcnService gcnService; 
        @Autowired private SerialNumberGenerator serialNumberGenerator; // ADD THIS
    @Autowired private GcnRepository gcnRepository;
    @Autowired private CargoItemRepository cargoItemRepository;
    @Autowired private BillingRepository billingRepository;
    @Autowired private com.indtrans.freight.repository.VhcRepository vhcRepository;
//    @GetMapping
//    @PreAuthorize("@perm.has('gcn','view')")
//    public ResponseEntity<List<Gcn>> getAllGcn() {
//        return ResponseEntity.ok(gcnRepository.findAll());
//    }
    
    @GetMapping
    @PreAuthorize("@perm.has('gcn','view')")
    public ResponseEntity<?> getAllGcn() {
        try {
            List<Gcn> gcns = gcnRepository.findAll();

            List<Map<String, Object>> responseList = new ArrayList<>();

            for (Gcn gcn : gcns) {

                String vhcNumber = null;
                if (gcn.getVhcId() != null) {
                    vhcNumber = vhcRepository.findById(gcn.getVhcId())
                            .map(v -> v.getVhcNumber())
                            .orElse(null);
                }

                Map<String, Object> response = new HashMap<>();
                response.put("id", gcn.getId());
                response.put("gcnNumber", gcn.getGcnNumber());

                // ✅ THIS FIXES YOUR UI
                response.put("vhcNumber", vhcNumber);

                response.put("vhcId", gcn.getVhcId());
                response.put("customerId", gcn.getCustomerId());
                response.put("vehicleId", gcn.getVehicleId());
                response.put("driverId", gcn.getDriverId());
                response.put("consignorName", gcn.getConsignorName());
                response.put("consigneeName", gcn.getConsigneeName());
                response.put("fromLocation", gcn.getFromLocation());
                response.put("toLocation", gcn.getToLocation());
                response.put("gcnDate", gcn.getGcnDate());
                response.put("billingType", gcn.getBillingType());
                response.put("insuranceConsignor", gcn.getInsuranceConsignor());
                response.put("insuranceConsignee", gcn.getInsuranceConsignee());

                responseList.add(response);
            }

            return ResponseEntity.ok(responseList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
//    @GetMapping("/{id}")
//    @PreAuthorize("@perm.has('gcn','view')")
//    public ResponseEntity<Gcn> getGcn(@PathVariable String id) {
//        return gcnRepository.findById(id)
//                .map(ResponseEntity::ok)
//                .orElse(ResponseEntity.notFound().build());
//    }
    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('gcn','view')")
    public ResponseEntity<?> getGcn(@PathVariable String id) {
        try {
            Gcn gcn = gcnRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("GCN not found"));

            // 🔥 Fetch VHC using vhcId
            String vhcNumber = null;
            if (gcn.getVhcId() != null) {
                vhcNumber = vhcRepository.findById(gcn.getVhcId())
                        .map(v -> v.getVhcNumber())
                        .orElse(null);
            }

            // ✅ FIX: Use HashMap (no limit like Map.of)
            Map<String, Object> response = new HashMap<>();

            response.put("id", gcn.getId());
            response.put("gcnNumber", gcn.getGcnNumber());

            // ✅ IMPORTANT: match frontend (vhcNumber)
            response.put("vhcNumber", vhcNumber);

            response.put("vhcId", gcn.getVhcId());
            response.put("customerId", gcn.getCustomerId());
            response.put("vehicleId", gcn.getVehicleId());
            response.put("driverId", gcn.getDriverId());
            response.put("consignorName", gcn.getConsignorName());
            response.put("consignorAddress", gcn.getConsignorAddress());
            response.put("consigneeName", gcn.getConsigneeName());
            response.put("consigneeAddress", gcn.getConsigneeAddress());
            response.put("fromLocation", gcn.getFromLocation());
            response.put("toLocation", gcn.getToLocation());
            response.put("gcnDate", gcn.getGcnDate());
            response.put("insuranceConsignor", gcn.getInsuranceConsignor());
            response.put("insuranceConsignee", gcn.getInsuranceConsignee());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}/cargo")
    @PreAuthorize("@perm.has('gcn','add')")
    public ResponseEntity<List<CargoItem>> getCargoItems(@PathVariable String id) {
        return ResponseEntity.ok(cargoItemRepository.findByGcnId(id));
    }
    
    @PostMapping
    @PreAuthorize("@perm.has('gcn','add')")
    public ResponseEntity<Gcn> createGcn(
            // REMOVE: @RequestParam("gcnNumber") String gcnNumber,
            @RequestParam("vhcId") String vhcId,
            @RequestParam("customerId") String customerId,
            @RequestParam("vehicleId") String vehicleId,
            @RequestParam("driverId") String driverId,
            @RequestParam("consignorName") String consignorName,
            @RequestParam("consignorAddress") String consignorAddress,
            @RequestParam(value = "consignorGst", required = false) String consignorGst,
            @RequestParam(value = "consignorPincode", required = false) String consignorPincode,
            @RequestParam("consigneeName") String consigneeName,
            @RequestParam("consigneeAddress") String consigneeAddress,
            @RequestParam(value = "consigneeGst", required = false) String consigneeGst,
            @RequestParam(value = "consigneePincode", required = false) String consigneePincode,
            @RequestParam("fromLocation") String fromLocation,
            @RequestParam("toLocation") String toLocation,
            @RequestParam("gcnDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate gcnDate,
            @RequestParam(value = "billingType", required = false, defaultValue = "TO_BE_BILLED") String billingType,
            @RequestParam(value = "insuranceConsignor", required = false, defaultValue = "false") Boolean insuranceConsignor,
            @RequestParam(value = "insuranceConsignee", required = false, defaultValue = "false") Boolean insuranceConsignee,
            @RequestParam(value = "receiptFile", required = false) MultipartFile receiptFile,
            @RequestParam(value = "cargoItems", required = false) String cargoItemsJson) {
        
        try {
            // ✅ GENERATE GCN NUMBER FIRST (before any save)
            String generatedGcnNumber = serialNumberGenerator.generateGcnNumber();
            
            // Check if somehow this number already exists (safety check)
            if (gcnRepository.existsByGcnNumber(generatedGcnNumber)) {
                return ResponseEntity.badRequest().build();
            }
            
            Gcn gcn = new Gcn();
            gcn.setGcnNumber(generatedGcnNumber);  // ✅ USE THE GENERATED NUMBER
            gcn.setVhcId(vhcId);
            gcn.setCustomerId(customerId);
            gcn.setVehicleId(vehicleId);
            gcn.setDriverId(driverId);
            gcn.setConsignorName(consignorName);
            gcn.setConsignorAddress(consignorAddress);
            gcn.setConsignorGst(consignorGst);
            gcn.setConsignorPincode(consignorPincode);
            gcn.setConsigneeName(consigneeName);
            gcn.setConsigneeAddress(consigneeAddress);
            gcn.setConsigneeGst(consigneeGst);
            gcn.setConsigneePincode(consigneePincode);
            gcn.setFromLocation(fromLocation);
            gcn.setToLocation(toLocation);
            gcn.setGcnDate(gcnDate);
            gcn.setBillingType(billingType);
            gcn.setInsuranceConsignor(insuranceConsignor);
            gcn.setInsuranceConsignee(insuranceConsignee);
            gcn.setStatus("ACTIVE");
            
            // Handle receipt upload if provided
            if (receiptFile != null && !receiptFile.isEmpty()) {
                gcn.setReceiptPath("/uploads/receipts/" + receiptFile.getOriginalFilename());
            }
            
            // ✅ Save the GCN with the generated number
            Gcn saved = gcnRepository.save(gcn);
            
            // Parse and save cargo items
            if (cargoItemsJson != null && !cargoItemsJson.isEmpty() && !"[]".equals(cargoItemsJson.trim())) {
                try {
                    ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
                    List<Map<String, Object>> rawItems = mapper.readValue(
                            cargoItemsJson, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> raw : rawItems) {
                        CargoItem ci = new CargoItem();
                        ci.setGcnId(saved.getId());
                        Object desc = raw.get("description");
                        if (desc == null || desc.toString().isBlank()) continue;
                        ci.setDescription(desc.toString());
                        Object pt = raw.get("packingType");
                        if (pt != null) ci.setPackingType(pt.toString());
                        Object qty = raw.get("quantity");
                        if (qty != null && !qty.toString().isBlank())
                            ci.setQuantity(Integer.valueOf(qty.toString().replaceAll("\\..*", "")));
                        Object unit = raw.get("unit");
                        if (unit != null) ci.setUnit(unit.toString());
                        Object wt = raw.get("weight");
                        if (wt != null && !wt.toString().isBlank())
                            ci.setWeight(new BigDecimal(wt.toString()));
                        Object inv = raw.get("invoiceNumber");
                        if (inv != null) ci.setInvoiceNumber(inv.toString());
                        Object invDate = raw.get("invoiceDate");
                        if (invDate != null && !invDate.toString().isBlank())
                            ci.setInvoiceDate(LocalDate.parse(invDate.toString()));
                        Object invAmt = raw.get("invoiceAmount");
                        if (invAmt != null && !invAmt.toString().isBlank())
                            ci.setInvoiceAmount(new BigDecimal(invAmt.toString()));
                        cargoItemRepository.save(ci);
                    }
                } catch (Exception ex) {
                    System.err.println("Failed to parse cargo items: " + ex.getMessage());
                }
            }
            
            // ✅ Auto-create billing entry (your existing method - already uses generateBillNumber())
            createBillingFromGcn(saved);
            
            // ✅ Return the saved GCN (with generated number)
            return ResponseEntity.ok(saved);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/freight")
    @PreAuthorize("@perm.has('gcn','edit')")
    public ResponseEntity<Gcn> updateFreight(
            @PathVariable String id,
            @RequestParam(value = "customerFreight", required = false, defaultValue = "0") BigDecimal customerFreight,
            @RequestParam(value = "advance", required = false, defaultValue = "0") BigDecimal advance,
            @RequestParam(value = "loadingCharge", required = false, defaultValue = "0") BigDecimal loadingCharge,
            @RequestParam(value = "unloadingCharge", required = false, defaultValue = "0") BigDecimal unloadingCharge,
            @RequestParam(value = "detentionCharge", required = false, defaultValue = "0") BigDecimal detentionCharge,
            @RequestParam(value = "othersCharge", required = false, defaultValue = "0") BigDecimal othersCharge,
            @RequestParam(value = "paymentTerms", required = false) String paymentTerms,
            @RequestParam(value = "remarks", required = false) String remarks) {
        
        try {
            Gcn gcn = gcnRepository.findById(id).orElseThrow(() -> new RuntimeException("GCN not found"));
            
            gcn.setCustomerFreight(customerFreight);
            gcn.setAdvance(advance);
            gcn.setLoadingCharge(loadingCharge);
            gcn.setUnloadingCharge(unloadingCharge);
            gcn.setDetentionCharge(detentionCharge);
            gcn.setOthersCharge(othersCharge);
            gcn.setPaymentTerms(paymentTerms);
            gcn.setRemarks(remarks);
            
            Gcn updated = gcnRepository.save(gcn);
            return ResponseEntity.ok(updated);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    @PostMapping("/{id}/receipt")
    @PreAuthorize("@perm.has('gcn','add')")
    public ResponseEntity<?> uploadReceipt(
            @PathVariable String id,
            @RequestParam("receiptFile") MultipartFile file) {
        
        try {
            Gcn gcn = gcnRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("GCN not found"));
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            // Create upload directory if not exists
            String uploadDir = "uploads/receipts/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? 
                originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
            String filename = UUID.randomUUID().toString() + extension;
            
            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);
            
         // Update GCN with receipt path AND original filename for display.
            String receiptPath = "/uploads/receipts/" + filename;
            gcn.setReceiptPath(receiptPath);
            gcn.setReceiptOriginalName(originalFilename);
            gcnRepository.save(gcn);
            
            return ResponseEntity.ok().body(Map.of(
                "message", "Receipt uploaded successfully",
                "path", receiptPath
            ));
            
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to upload file");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to update GCN");
        }
    }
    
    private void createBillingFromGcn(Gcn gcn) {
        try {
            // Check if billing already exists
            if (!billingRepository.findByGcnId(gcn.getId()).isEmpty()) {
                return;
            }
            
//            String billNumber = serialNumberGenerator.generateBillNumber();
            String billNumber = cargoItemRepository.findByGcnId(gcn.getId())
                    .stream()
                    .findFirst()
                    .map(CargoItem::getInvoiceNumber)
                    .filter(inv -> inv != null && !inv.isBlank())
                    .orElse(serialNumberGenerator.generateBillNumber());
            
            Billing billing = new Billing();
            billing.setBillNumber(billNumber);
            billing.setGcnId(gcn.getId());
            billing.setCustomerId(gcn.getCustomerId());
            billing.setCustomerName(gcn.getConsignorName());
            billing.setCustomerAddress(gcn.getConsignorAddress());
            billing.setCustomerGst(gcn.getConsignorGst());
            billing.setBillDate(gcn.getGcnDate());
            billing.setAmount(BigDecimal.ZERO); // Will be updated when freight is added
            billing.setPaidAmount(BigDecimal.ZERO);
            billing.setStatus("PENDING");
            billing.setSourceType("GCN");
            
            billingRepository.save(billing);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('gcn','delete')")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteGcn(@PathVariable String id) {
        try {
            if (!gcnRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            // Cascade-delete dependents (cargo + auto-generated billing rows).
            cargoItemRepository.deleteByGcnId(id);
            billingRepository.findByGcnId(id)
                    .forEach(b -> billingRepository.deleteById(b.getId()));
            gcnRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
}