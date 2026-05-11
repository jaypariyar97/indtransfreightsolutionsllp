package com.indtrans.freight.repository;

import com.indtrans.freight.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, String> {
    Optional<Shipment> findByShipmentNumber(String shipmentNumber);
    boolean existsByShipmentNumber(String shipmentNumber);
}