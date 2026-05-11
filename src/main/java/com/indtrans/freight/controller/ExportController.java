package com.indtrans.freight.controller;

import com.indtrans.freight.model.Billing;
import com.indtrans.freight.model.Customer;
import com.indtrans.freight.model.Vehicle;
import com.indtrans.freight.repository.BillingRepository;
import com.indtrans.freight.repository.CustomerRepository;
import com.indtrans.freight.repository.VehicleRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/export")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5000", "http://localhost:5173"})
public class ExportController {

    private static final MediaType CSV_CONTENT_TYPE =
            new MediaType("text", "csv", StandardCharsets.UTF_8);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final BillingRepository billingRepository;

    public ExportController(CustomerRepository customerRepository,
                            VehicleRepository vehicleRepository,
                            BillingRepository billingRepository) {
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.billingRepository = billingRepository;
    }

    @GetMapping({"/customers/csv", "/customers/excel"})
    @PreAuthorize("@perm.has('customers','view')")
    public ResponseEntity<byte[]> exportCustomers() {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {
                "Company Name", "GST Number", "Contact Number", "Account Number",
                "Address", "Plant Address", "City", "State", "Pincode"
        });

        for (Customer customer : customerRepository.findAll()) {
            rows.add(new String[] {
                    formatValue(customer.getName()),
                    formatValue(customer.getGstNumber()),
                    formatValue(customer.getPhone()),
                    formatValue(customer.getAccountNumber()),
                    formatValue(customer.getAddress()),
                    formatValue(customer.getPlantAddress()),
                    formatValue(customer.getCity()),
                    formatValue(customer.getState()),
                    formatValue(customer.getPincode())
            });
        }

        return csvResponse(rows, "customers.csv");
    }

    @GetMapping({"/vehicles/csv", "/vehicles/excel"})
    @PreAuthorize("@perm.has('vehicles','view')")
    public ResponseEntity<byte[]> exportVehicles() {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {
                "Vehicle Number", "Make", "Model", "Type", "Capacity (Kg)", "Status",
                "Driver Name", "Driver Phone", "RC Expiry", "Insurance Expiry",
                "Permit Expiry", "Fitness Expiry", "Tax Expiry"
        });

        for (Vehicle vehicle : vehicleRepository.findAll()) {
            rows.add(new String[] {
                    formatValue(vehicle.getVehicleNumber()),
                    formatValue(vehicle.getMake()),
                    formatValue(vehicle.getModel()),
                    formatValue(vehicle.getType()),
                    formatValue(vehicle.getCapacityKg()),
                    formatValue(vehicle.getStatus()),
                    formatValue(vehicle.getDriverName()),
                    formatValue(vehicle.getDriverPhone()),
                    formatValue(vehicle.getRcExpiry()),
                    formatValue(vehicle.getInsuranceExpiry()),
                    formatValue(vehicle.getPermitExpiry()),
                    formatValue(vehicle.getFitnessExpiry()),
                    formatValue(vehicle.getTaxExpiry())
            });
        }

        return csvResponse(rows, "vehicles.csv");
    }

    @GetMapping({"/billing/csv", "/billing/excel"})
    @PreAuthorize("@perm.has('billing','view')")
    public ResponseEntity<byte[]> exportBilling() {
        List<String[]> rows = new ArrayList<>();
        rows.add(new String[] {
                "Bill Number", "Bill Date", "Customer Name", "Customer GST", "Customer Address",
                "Source Type", "GCN ID", "VHC ID", "Amount", "Paid Amount", "Status", "Remarks"
        });

        for (Billing billing : billingRepository.findAll()) {
            rows.add(new String[] {
                    formatValue(billing.getBillNumber()),
                    formatValue(billing.getBillDate()),
                    formatValue(billing.getCustomerName()),
                    formatValue(billing.getCustomerGst()),
                    formatValue(billing.getCustomerAddress()),
                    formatValue(billing.getSourceType()),
                    formatValue(billing.getGcnId()),
                    formatValue(billing.getVhcId()),
                    formatValue(billing.getAmount()),
                    formatValue(billing.getPaidAmount()),
                    formatValue(billing.getStatus()),
                    formatValue(billing.getRemarks())
            });
        }

        return csvResponse(rows, "billing.csv");
    }

    private ResponseEntity<byte[]> csvResponse(List<String[]> rows, String fileName) {
        StringBuilder csv = new StringBuilder("\uFEFF");

        for (String[] row : rows) {
            for (int i = 0; i < row.length; i++) {
                if (i > 0) {
                    csv.append(',');
                }
                csv.append(escapeCsv(row[i]));
            }
            csv.append("\r\n");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(CSV_CONTENT_TYPE)
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String formatValue(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.toPlainString();
        }
        if (value instanceof LocalDate date) {
            return DATE_FORMAT.format(date);
        }
        return String.valueOf(value);
    }

    private String escapeCsv(String value) {
        String safeValue = value == null ? "" : value;
        boolean needsQuotes = safeValue.contains(",")
                || safeValue.contains("\"")
                || safeValue.contains("\r")
                || safeValue.contains("\n");

        if (!needsQuotes) {
            return safeValue;
        }

        return "\"" + safeValue.replace("\"", "\"\"") + "\"";
    }
}
