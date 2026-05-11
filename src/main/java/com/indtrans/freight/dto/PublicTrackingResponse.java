package com.indtrans.freight.dto;

import com.indtrans.freight.model.Gcn;

import java.time.LocalDate;
import java.util.List;

/**
 * Trimmed-down GCN view returned to anonymous trackers. Sensitive financial
 * details (customer freight, advance, bank info) are deliberately omitted.
 */
public class PublicTrackingResponse {
    public String gcnNumber;
    public LocalDate gcnDate;
    public String fromLocation;
    public String toLocation;
    public String consignorName;
    public String consigneeName;
    public String consigneeCity;     // pincode-derived hint (kept simple)
    public String currentStatus;     // most-recent event status
    public String currentLocation;   // most-recent event location
    public String headlineStatus;    // human-readable label
    public List<TrackingEventDTO> events;

    public static PublicTrackingResponse from(Gcn gcn, List<TrackingEventDTO> events) {
        PublicTrackingResponse r = new PublicTrackingResponse();
        r.gcnNumber = gcn.getGcnNumber();
        r.gcnDate = gcn.getGcnDate();
        r.fromLocation = gcn.getFromLocation();
        r.toLocation = gcn.getToLocation();
        r.consignorName = gcn.getConsignorName();
        r.consigneeName = gcn.getConsigneeName();
        r.consigneeCity = gcn.getConsigneePincode();
        r.events = events;
        if (events != null && !events.isEmpty()) {
            TrackingEventDTO latest = events.get(0); // already sorted desc
            r.currentStatus = latest.status;
            r.currentLocation = latest.location;
            r.headlineStatus = humanize(latest.status);
        } else {
            r.currentStatus = "BOOKED";
            r.headlineStatus = "Shipment booked";
        }
        return r;
    }

    private static String humanize(String code) {
        if (code == null) return "Pending";
        return switch (code.toUpperCase()) {
            case "BOOKED" -> "Shipment booked";
            case "PICKED_UP" -> "Picked up from origin";
            case "IN_TRANSIT" -> "In transit";
            case "REACHED_HUB" -> "Reached transit hub";
            case "OUT_FOR_DELIVERY" -> "Out for delivery";
            case "DELIVERED" -> "Delivered";
            case "EXCEPTION" -> "Delivery exception";
            case "RETURNED" -> "Returned to sender";
            default -> code.replace('_', ' ');
        };
    }
}
