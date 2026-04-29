package com.indtrans.freight.controller;

import com.indtrans.freight.model.Customer;
import com.indtrans.freight.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class CustomerController {
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @GetMapping
    @PreAuthorize("@perm.has('customers','view')")
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('customers','view')")
    public ResponseEntity<Customer> getCustomer(@PathVariable String id) {
        return customerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    @PreAuthorize("@perm.has('customers','add')")
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer) {
        if (customer.getEmail() != null && customerRepository.existsByEmail(customer.getEmail())) {
            return ResponseEntity.badRequest().body(null);
        }
        Customer saved = customerRepository.save(customer);
        return ResponseEntity.ok(saved);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('customers','edit')")
    public ResponseEntity<Customer> updateCustomer(@PathVariable String id, @RequestBody Customer customer) {
        return customerRepository.findById(id)
                .map(existing -> {
                    mergeCustomer(existing, customer);
                    Customer updated = customerRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('customers','delete')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String id) {
        customerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    private void mergeCustomer(Customer target, Customer source) {
        if (source.getName() != null) target.setName(source.getName());
        if (source.getEmail() != null) target.setEmail(source.getEmail());
        if (source.getPhone() != null) target.setPhone(source.getPhone());
        if (source.getGstNumber() != null) target.setGstNumber(source.getGstNumber());
        if (source.getAccountNumber() != null) target.setAccountNumber(source.getAccountNumber());
        if (source.getAddress() != null) target.setAddress(source.getAddress());
        if (source.getPlantAddress() != null) target.setPlantAddress(source.getPlantAddress());
        if (source.getCity() != null) target.setCity(source.getCity());
        if (source.getState() != null) target.setState(source.getState());
        if (source.getPincode() != null) target.setPincode(source.getPincode());
    }
}