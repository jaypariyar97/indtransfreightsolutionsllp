package com.indtrans.freight.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.indtrans.freight.model.Billing;
import com.indtrans.freight.model.CargoItem;
import com.indtrans.freight.model.Gcn;
import com.indtrans.freight.model.Vehicle;
import com.indtrans.freight.model.Vhc;
import com.indtrans.freight.repository.BillingRepository;
import com.indtrans.freight.repository.CargoItemRepository;
import com.indtrans.freight.repository.GcnRepository;
import com.indtrans.freight.repository.VehicleRepository;
import com.indtrans.freight.repository.VhcRepository;
import com.indtrans.freight.service.GcnPrintTemplateService;
import com.indtrans.freight.service.GcnService;
import com.indtrans.freight.util.FileUploadUtil;
import com.indtrans.freight.util.SerialNumberGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/gcn")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class GcnController {

    @Autowired
    private GcnService gcnService;

    @Autowired
    private SerialNumberGenerator serialNumberGenerator;

    @Autowired
    private GcnRepository gcnRepository;

    @Autowired
    private CargoItemRepository cargoItemRepository;

    @Autowired
    private BillingRepository billingRepository;

    @Autowired
    private VhcRepository vhcRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private GcnPrintTemplateService gcnPrintTemplateService;

    @GetMapping
    @PreAuthorize("@perm.has('gcn','view')")
    public ResponseEntity<?> getAllGcn() {
        try {
            List<Gcn> gcns = gcnRepository.findAll();
            List<Map<String, Object>> responseList = new ArrayList<>();

            for (Gcn gcn : gcns) {
                responseList.add(buildGcnResponse(gcn));
            }

            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('gcn','view')")
    public ResponseEntity<?> getGcn(@PathVariable String id) {
        try {
            Gcn gcn = gcnRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("GCN not found"));

            return ResponseEntity.ok(buildGcnResponse(gcn));
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

    @GetMapping(value = "/{id}/printable", produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("@perm.has('gcn','view')")
    public ResponseEntity<String> getPrintableGcn(
            @PathVariable String id,
            @RequestParam(value = "autoprint", defaultValue = "true") boolean autoPrint) {
        try {
            Gcn gcn = gcnRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("GCN not found"));

            List<CargoItem> cargoItems = cargoItemRepository.findByGcnId(id);
            String vehicleNumber = resolveVehicleNumber(gcn);
            String html = gcnPrintTemplateService.buildPrintableHtml(gcn, cargoItems, vehicleNumber, autoPrint);

            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(html);
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    @PreAuthorize("@perm.has('gcn','add')")
    public ResponseEntity<Gcn> createGcn(
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
            String generatedGcnNumber = serialNumberGenerator.generateGcnNumber();
            if (gcnRepository.existsByGcnNumber(generatedGcnNumber)) {
                return ResponseEntity.badRequest().build();
            }

            Gcn gcn = new Gcn();
            gcn.setGcnNumber(generatedGcnNumber);
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

            if (receiptFile != null && !receiptFile.isEmpty()) {
                gcn.setReceiptPath(FileUploadUtil.saveToFolder(receiptFile, "receipts"));
                gcn.setReceiptOriginalName(receiptFile.getOriginalFilename());
            }

            Gcn saved = gcnRepository.save(gcn);

            if (cargoItemsJson != null && !cargoItemsJson.isEmpty() && !"[]".equals(cargoItemsJson.trim())) {
                try {
                    ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
                    List<Map<String, Object>> rawItems = mapper.readValue(
                            cargoItemsJson,
                            new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});

                    for (Map<String, Object> raw : rawItems) {
                        CargoItem cargoItem = new CargoItem();
                        cargoItem.setGcnId(saved.getId());

                        Object description = raw.get("description");
                        if (description == null || description.toString().isBlank()) {
                            continue;
                        }

                        cargoItem.setDescription(description.toString());
                        Object packingType = raw.get("packingType");
                        if (packingType != null) {
                            cargoItem.setPackingType(packingType.toString());
                        }

                        Object quantity = raw.get("quantity");
                        if (quantity != null && !quantity.toString().isBlank()) {
                            cargoItem.setQuantity(Integer.valueOf(quantity.toString().replaceAll("\\..*", "")));
                        }

                        Object unit = raw.get("unit");
                        if (unit != null) {
                            cargoItem.setUnit(unit.toString());
                        }

                        Object weight = raw.get("weight");
                        if (weight != null && !weight.toString().isBlank()) {
                            cargoItem.setWeight(new BigDecimal(weight.toString()));
                        }

                        Object invoiceNumber = raw.get("invoiceNumber");
                        if (invoiceNumber != null) {
                            cargoItem.setInvoiceNumber(invoiceNumber.toString());
                        }

                        Object invoiceDate = raw.get("invoiceDate");
                        if (invoiceDate != null && !invoiceDate.toString().isBlank()) {
                            cargoItem.setInvoiceDate(LocalDate.parse(invoiceDate.toString()));
                        }

                        Object invoiceAmount = raw.get("invoiceAmount");
                        if (invoiceAmount != null && !invoiceAmount.toString().isBlank()) {
                            cargoItem.setInvoiceAmount(new BigDecimal(invoiceAmount.toString()));
                        }

                        cargoItemRepository.save(cargoItem);
                    }
                } catch (Exception ex) {
                    System.err.println("Failed to parse cargo items: " + ex.getMessage());
                }
            }

            createBillingFromGcn(saved);
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
            @RequestParam(value = "billingType", required = false) String billingType,
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
            if (billingType != null && !billingType.isBlank()) {
                gcn.setBillingType(billingType);
            }
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

            if (gcn.getReceiptPath() != null && !gcn.getReceiptPath().isBlank()) {
                FileUploadUtil.deleteFile(gcn.getReceiptPath());
            }

            String receiptPath = FileUploadUtil.saveToFolder(file, "receipts");
            gcn.setReceiptPath(receiptPath);
            gcn.setReceiptOriginalName(file.getOriginalFilename());
            gcnRepository.save(gcn);

            return ResponseEntity.ok().body(Map.of(
                    "message", "Receipt uploaded successfully",
                    "path", receiptPath
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to update GCN");
        }
    }

    private void createBillingFromGcn(Gcn gcn) {
        try {
            if (!billingRepository.findByGcnId(gcn.getId()).isEmpty()) {
                return;
            }

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
            billing.setAmount(BigDecimal.ZERO);
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

            cargoItemRepository.deleteByGcnId(id);
            billingRepository.findByGcnId(id)
                    .forEach(billing -> billingRepository.deleteById(billing.getId()));
            gcnRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private Map<String, Object> buildGcnResponse(Gcn gcn) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", gcn.getId());
        response.put("gcnNumber", gcn.getGcnNumber());
        response.put("vhcNumber", resolveVhcNumber(gcn));
        response.put("vehicleNumber", resolveVehicleNumber(gcn));
        response.put("vhcId", gcn.getVhcId());
        response.put("customerId", gcn.getCustomerId());
        response.put("vehicleId", gcn.getVehicleId());
        response.put("driverId", gcn.getDriverId());
        response.put("consignorName", gcn.getConsignorName());
        response.put("consignorAddress", gcn.getConsignorAddress());
        response.put("consignorGst", gcn.getConsignorGst());
        response.put("consignorPincode", gcn.getConsignorPincode());
        response.put("consigneeName", gcn.getConsigneeName());
        response.put("consigneeAddress", gcn.getConsigneeAddress());
        response.put("consigneeGst", gcn.getConsigneeGst());
        response.put("consigneePincode", gcn.getConsigneePincode());
        response.put("fromLocation", gcn.getFromLocation());
        response.put("toLocation", gcn.getToLocation());
        response.put("gcnDate", gcn.getGcnDate());
        response.put("billingType", gcn.getBillingType());
        response.put("insuranceConsignor", gcn.getInsuranceConsignor());
        response.put("insuranceConsignee", gcn.getInsuranceConsignee());
        response.put("customerFreight", gcn.getCustomerFreight());
        response.put("advance", gcn.getAdvance());
        response.put("loadingCharge", gcn.getLoadingCharge());
        response.put("unloadingCharge", gcn.getUnloadingCharge());
        response.put("detentionCharge", gcn.getDetentionCharge());
        response.put("othersCharge", gcn.getOthersCharge());
        response.put("paymentTerms", gcn.getPaymentTerms());
        response.put("remarks", gcn.getRemarks());
        response.put("status", gcn.getStatus());
        response.put("receiptPath", gcn.getReceiptPath());
        response.put("receiptOriginalName", gcn.getReceiptOriginalName());
        return response;
    }

    private String resolveVhcNumber(Gcn gcn) {
        if (gcn.getVhcId() == null) {
            return null;
        }
        return vhcRepository.findById(gcn.getVhcId())
                .map(Vhc::getVhcNumber)
                .orElse(null);
    }

    private String resolveVehicleNumber(Gcn gcn) {
        if (gcn.getVehicleId() == null) {
            return null;
        }
        return vehicleRepository.findById(gcn.getVehicleId())
                .map(Vehicle::getVehicleNumber)
                .orElse(null);
    }
}
