package com.indtrans.freight.dto;

import com.indtrans.freight.model.GcnTrackingEvent;

import java.time.Instant;

public class TrackingEventDTO {
    public String id;
    public String status;
    public String location;
    public String description;
    public Instant eventAt;
    public String createdBy;
    public Instant createdAt;

    public static TrackingEventDTO from(GcnTrackingEvent e) {
        TrackingEventDTO dto = new TrackingEventDTO();
        dto.id = e.getId();
        dto.status = e.getStatus();
        dto.location = e.getLocation();
        dto.description = e.getDescription();
        dto.eventAt = e.getEventAt();
        dto.createdBy = e.getCreatedBy();
        dto.createdAt = e.getCreatedAt();
        return dto;
    }
}
