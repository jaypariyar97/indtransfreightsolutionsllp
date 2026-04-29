package com.indtrans.freight.controller;

import com.indtrans.freight.model.Location;
import com.indtrans.freight.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/locations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class LocationController {
    
    @Autowired
    private LocationRepository locationRepository;
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Location>> getAllLocations() {
        return ResponseEntity.ok(locationRepository.findAll());
    }
    
    @GetMapping("/type/{type}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Location>> getLocationsByType(@PathVariable String type) {
        return ResponseEntity.ok(locationRepository.findByType(type));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Location> createLocation(@RequestBody Location location) {
        try {
            Location saved = locationRepository.save(location);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLocation(@PathVariable String id) {
        try {
            locationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}