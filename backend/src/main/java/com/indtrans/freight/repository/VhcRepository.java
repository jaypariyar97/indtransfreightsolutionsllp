package com.indtrans.freight.repository;

import com.indtrans.freight.model.Vhc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VhcRepository extends JpaRepository<Vhc, String> {
    Optional<Vhc> findByVhcNumber(String vhcNumber);
    boolean existsByVhcNumber(String vhcNumber);
}