package com.indtrans.freight.repository;

import com.indtrans.freight.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, String> {
    List<Location> findByType(String type);
    List<Location> findByNameContainingIgnoreCaseOrAddressContainingIgnoreCase(String name, String address);
}