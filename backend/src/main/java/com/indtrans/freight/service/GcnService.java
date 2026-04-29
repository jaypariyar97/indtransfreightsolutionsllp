package com.indtrans.freight.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indtrans.freight.model.Gcn;
import com.indtrans.freight.repository.GcnRepository;
import com.indtrans.freight.util.SerialNumberGenerator;

import jakarta.transaction.Transactional;

@Service
public class GcnService {
    
    @Autowired
    private GcnRepository gcnRepository;
    
    @Autowired
    private SerialNumberGenerator serialNumberGenerator; // ADD THIS
    
    @Transactional
    public Gcn createGcn(/* your parameters */) {
        
        // Generate GCN number
        String gcnNumber = serialNumberGenerator.generateGcnNumber(); // ADD THIS
        
        Gcn gcn = new Gcn();
        gcn.setGcnNumber(gcnNumber); // SET THE GENERATED NUMBER
        // ... set other fields
        
        return gcnRepository.save(gcn);
    }
}