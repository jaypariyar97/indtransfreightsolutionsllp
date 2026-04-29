package com.indtrans.freight.repository;

import com.indtrans.freight.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, String> {
    Optional<Driver> findByLicenceNumber(String licenceNumber);
    boolean existsByLicenceNumber(String licenceNumber);
}