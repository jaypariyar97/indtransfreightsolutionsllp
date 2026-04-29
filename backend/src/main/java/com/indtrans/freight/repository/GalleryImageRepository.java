package com.indtrans.freight.repository;

import com.indtrans.freight.model.GalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GalleryImageRepository extends JpaRepository<GalleryImage, String> {
    // Fixed: Use And instead of comma, and proper method naming
    List<GalleryImage> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
    List<GalleryImage> findByCategory(String category);
}