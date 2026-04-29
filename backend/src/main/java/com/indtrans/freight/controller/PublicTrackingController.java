package com.indtrans.freight.controller;

import com.indtrans.freight.dto.PublicTrackingResponse;
import com.indtrans.freight.dto.TrackingEventDTO;
import com.indtrans.freight.model.Gcn;
import com.indtrans.freight.repository.GcnRepository;
import com.indtrans.freight.repository.GcnTrackingEventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Anonymous tracking endpoints. No authentication required — anyone with a
 * GCN number can look up the timeline (Amazon / Flipkart style). Only safe,
 * non-financial fields are returned.
 */
@RestController
@RequestMapping("/public/tracking")
public class PublicTrackingController {

    private final GcnRepository gcnRepository;
    private final GcnTrackingEventRepository eventRepository;

    public PublicTrackingController(GcnRepository gcnRepository,
                                    GcnTrackingEventRepository eventRepository) {
        this.gcnRepository = gcnRepository;
        this.eventRepository = eventRepository;
    }

    @GetMapping("/{gcnNumber}")
    public ResponseEntity<?> track(@PathVariable String gcnNumber) {
        if (gcnNumber == null || gcnNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tracking number is required"));
        }
        Gcn gcn = gcnRepository.findByGcnNumber(gcnNumber.trim()).orElse(null);
        if (gcn == null) {
            return ResponseEntity.status(404).body(Map.of(
                    "error", "No shipment found for that tracking number",
                    "gcnNumber", gcnNumber.trim()
            ));
        }
        List<TrackingEventDTO> events = eventRepository
                .findByGcnIdOrderByEventAtDesc(gcn.getId()).stream()
                .map(TrackingEventDTO::from)
                .toList();
        return ResponseEntity.ok(PublicTrackingResponse.from(gcn, events));
    }
}
