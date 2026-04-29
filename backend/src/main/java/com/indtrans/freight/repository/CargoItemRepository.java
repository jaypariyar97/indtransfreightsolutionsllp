package com.indtrans.freight.repository;

import com.indtrans.freight.model.CargoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CargoItemRepository extends JpaRepository<CargoItem, String> {
    List<CargoItem> findByGcnId(String gcnId);
    void deleteByGcnId(String gcnId);
}