package com.indtrans.freight.repository;

import com.indtrans.freight.model.Gcn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GcnRepository extends JpaRepository<Gcn, String> {
    Optional<Gcn> findByGcnNumber(String gcnNumber);
    boolean existsByGcnNumber(String gcnNumber);
    Optional<Gcn> findByVhcId(String vhcId);
    boolean existsByVhcId(String vhcId);
}