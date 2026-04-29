package com.indtrans.freight.repository;

import com.indtrans.freight.model.Billing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingRepository extends JpaRepository<Billing, String> {
    Optional<Billing> findByBillNumber(String billNumber);
    boolean existsByBillNumber(String billNumber);
    List<Billing> findByGcnId(String gcnId);
    List<Billing> findByVhcId(String vhcId);
}