package com.indtrans.freight.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * One step on the public GCN tracking timeline. Admins post events as the
 * shipment progresses (Booked → Picked Up → In Transit → Out for Delivery →
 * Delivered) and customers view them via the public landing-page tracker.
 */
@Entity
@Table(name = "gcn_tracking_events", indexes = {
        @Index(name = "idx_gte_gcn_id", columnList = "gcn_id"),
        @Index(name = "idx_gte_event_at", columnList = "event_at")
})
public class GcnTrackingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "VARCHAR(36)", length = 36)
    private String id;

    @Column(name = "gcn_id", nullable = false, length = 36)
    private String gcnId;

    /** Free-text status code. Suggested values: BOOKED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION. */
    @Column(name = "status", nullable = false, length = 40)
    private String status;

    @Column(name = "location", length = 200)
    private String location;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** When the real-world event happened (admin-supplied). */
    @Column(name = "event_at", nullable = false)
    private Instant eventAt;

    /** Email of the admin who posted this event. */
    @Column(name = "created_by", length = 200)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGcnId() { return gcnId; }
    public void setGcnId(String gcnId) { this.gcnId = gcnId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getEventAt() { return eventAt; }
    public void setEventAt(Instant eventAt) { this.eventAt = eventAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
}
