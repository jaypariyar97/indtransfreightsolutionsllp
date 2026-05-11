package com.indtrans.freight.repository;

import com.indtrans.freight.model.GcnTrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GcnTrackingEventRepository extends JpaRepository<GcnTrackingEvent, String> {
    List<GcnTrackingEvent> findByGcnIdOrderByEventAtDesc(String gcnId);
    long deleteByGcnId(String gcnId);
}
