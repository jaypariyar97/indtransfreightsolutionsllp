package com.indtrans.freight.repository;

import com.indtrans.freight.model.Transporter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TransporterRepository extends JpaRepository<Transporter, String> {
    Optional<Transporter> findByEmail(String email);
    boolean existsByEmail(String email);
}