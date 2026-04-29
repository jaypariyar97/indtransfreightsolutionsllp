package com.indtrans.freight.controller;

import com.indtrans.freight.dto.TrackingEventDTO;
import com.indtrans.freight.model.Gcn;
import com.indtrans.freight.model.GcnTrackingEvent;
import com.indtrans.freight.repository.GcnRepository;
import com.indtrans.freight.repository.GcnTrackingEventRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Admin/employee API for managing the per-GCN tracking timeline.
 * The companion {@link PublicTrackingController} exposes a read-only view to anonymous users.
 */
@RestController
@RequestMapping("/tracking")
public class TrackingController {

    private final GcnRepository gcnRepository;
    private final GcnTrackingEventRepository eventRepository;

    public TrackingController(GcnRepository gcnRepository,
                              GcnTrackingEventRepository eventRepository) {
        this.gcnRepository = gcnRepository;
        this.eventRepository = eventRepository;
    }

    /** Listing of all GCNs (number + key fields) so the admin tracking page can render a picker. */
    @GetMapping("/gcns")
    @PreAuthorize("@perm.has('tracking','view')")
    public ResponseEntity<List<Map<String, Object>>> listGcns() {
        List<Map<String, Object>> rows = gcnRepository.findAll().stream()
                .map(g -> Map.<String, Object>of(
                        "id", g.getId(),
                        "gcnNumber", g.getGcnNumber(),
                        "consignorName", nullSafe(g.getConsignorName()),
                        "consigneeName", nullSafe(g.getConsigneeName()),
                        "fromLocation", nullSafe(g.getFromLocation()),
                        "toLocation", nullSafe(g.getToLocation()),
                        "gcnDate", g.getGcnDate() == null ? "" : g.getGcnDate().toString(),
                        "status", nullSafe(g.getStatus())
                ))
                .toList();
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/{gcnId}/events")
    @PreAuthorize("@perm.has('tracking','view')")
    public ResponseEntity<List<TrackingEventDTO>> events(@PathVariable String gcnId) {
        return ResponseEntity.ok(eventRepository.findByGcnIdOrderByEventAtDesc(gcnId).stream()
                .map(TrackingEventDTO::from).toList());
    }

    @PostMapping("/{gcnId}/events")
    @PreAuthorize("@perm.has('tracking','add')")
    @Transactional
    public ResponseEntity<?> addEvent(@PathVariable String gcnId,
                                      @RequestBody EventPayload body,
                                      @AuthenticationPrincipal UserDetails user) {
        Gcn gcn = gcnRepository.findById(gcnId).orElse(null);
        if (gcn == null) return ResponseEntity.notFound().build();
        if (body == null || body.status == null || body.status.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
        }
        GcnTrackingEvent e = new GcnTrackingEvent();
        e.setGcnId(gcnId);
        e.setStatus(body.status.trim().toUpperCase());
        e.setLocation(trim(body.location));
        e.setDescription(trim(body.description));
        e.setEventAt(body.eventAt != null ? body.eventAt : Instant.now());
        e.setCreatedBy(user != null ? user.getUsername() : "system");
        GcnTrackingEvent saved = eventRepository.save(e);

        // Mirror the latest status onto the GCN itself for at-a-glance views.
        gcn.setStatus(saved.getStatus());
        gcnRepository.save(gcn);

        return ResponseEntity.ok(TrackingEventDTO.from(saved));
    }

    @PutMapping("/events/{eventId}")
    @PreAuthorize("@perm.has('tracking','edit')")
    @Transactional
    public ResponseEntity<?> updateEvent(@PathVariable String eventId, @RequestBody EventPayload body) {
        return eventRepository.findById(eventId).map(e -> {
            if (body.status != null && !body.status.isBlank()) e.setStatus(body.status.trim().toUpperCase());
            if (body.location != null) e.setLocation(trim(body.location));
            if (body.description != null) e.setDescription(trim(body.description));
            if (body.eventAt != null) e.setEventAt(body.eventAt);
            return ResponseEntity.ok(TrackingEventDTO.from(eventRepository.save(e)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/events/{eventId}")
    @PreAuthorize("@perm.has('tracking','delete')")
    @Transactional
    public ResponseEntity<Void> deleteEvent(@PathVariable String eventId) {
        if (!eventRepository.existsById(eventId)) return ResponseEntity.notFound().build();
        eventRepository.deleteById(eventId);
        return ResponseEntity.noContent().build();
    }

    private static String nullSafe(String s) { return s == null ? "" : s; }
    private static String trim(String s) { return s == null ? null : s.trim(); }

    public static class EventPayload {
        public String status;
        public String location;
        public String description;
        public Instant eventAt;
    }
}
