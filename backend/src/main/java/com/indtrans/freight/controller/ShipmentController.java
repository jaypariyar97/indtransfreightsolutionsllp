package com.indtrans.freight.controller;

import com.indtrans.freight.model.Shipment;
import com.indtrans.freight.repository.ShipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shipments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ShipmentController {
    
    @Autowired
    private ShipmentRepository shipmentRepository;
    
    @GetMapping
    @PreAuthorize("@perm.has('shipments','view')")
    public ResponseEntity<List<Shipment>> getAllShipments() {
        return ResponseEntity.ok(shipmentRepository.findAll());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Shipment> getShipment(@PathVariable String id) {
        return shipmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Shipment> createShipment(@RequestBody Shipment shipment) {
        if (shipment.getShipmentNumber() != null && shipmentRepository.existsByShipmentNumber(shipment.getShipmentNumber())) {
            return ResponseEntity.badRequest().build();
        }
        Shipment saved = shipmentRepository.save(shipment);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('shipments','edit')")
    public ResponseEntity<Shipment> updateShipment(@PathVariable String id, @RequestBody Shipment shipment) {
        if (!shipmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        shipment.setId(id);
        Shipment updated = shipmentRepository.save(shipment);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('shipments','delete')")
    public ResponseEntity<Void> deleteShipment(@PathVariable String id) {
        shipmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}