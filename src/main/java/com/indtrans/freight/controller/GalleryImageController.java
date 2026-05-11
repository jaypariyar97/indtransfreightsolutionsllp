package com.indtrans.freight.controller;

import com.indtrans.freight.model.GalleryImage;
import com.indtrans.freight.repository.GalleryImageRepository;
import com.indtrans.freight.util.FileUploadUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/gallery")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class GalleryImageController {

    private static final Path GALLERY_ROOT = Paths.get("uploads", "gallery").toAbsolutePath().normalize();

    @Autowired
    private GalleryImageRepository galleryImageRepository;

    @GetMapping
    public ResponseEntity<List<GalleryImage>> getAllImages() {
        return ResponseEntity.ok(galleryImageRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc());
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> getGalleryFile(@PathVariable String filename) {
        try {
            Path filePath = GALLERY_ROOT.resolve(filename).normalize();
            if (!filePath.startsWith(GALLERY_ROOT) || !Files.exists(filePath) || !Files.isReadable(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            MediaType contentType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);

            return ResponseEntity.ok()
                    .contentType(contentType)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/admin")
    @PreAuthorize("@perm.has('gallery','view')")
    public ResponseEntity<List<GalleryImage>> getAllImagesAdmin() {
        return ResponseEntity.ok(galleryImageRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("@perm.has('gallery','add')")
    public ResponseEntity<GalleryImage> uploadImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category) {
        try {
            GalleryImage galleryImage = new GalleryImage();
            galleryImage.setTitle(title);
            galleryImage.setDescription(description);
            galleryImage.setCategory(category);
            galleryImage.setIsActive(true);
            galleryImage.setImagePath(FileUploadUtil.saveToFolder(file, "gallery"));

            long count = galleryImageRepository.count();
            galleryImage.setDisplayOrder((int) count);

            GalleryImage saved = galleryImageRepository.save(galleryImage);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('gallery','edit')")
    public ResponseEntity<GalleryImage> updateImage(
            @PathVariable String id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", required = false) String category) {
        try {
            GalleryImage galleryImage = galleryImageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image not found"));

            if (title != null) galleryImage.setTitle(title);
            if (description != null) galleryImage.setDescription(description);
            if (category != null) galleryImage.setCategory(category);

            GalleryImage updated = galleryImageRepository.save(galleryImage);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.has('gallery','delete')")
    public ResponseEntity<Void> deleteImage(@PathVariable String id) {
        try {
            GalleryImage galleryImage = galleryImageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image not found"));

            galleryImage.setIsActive(false);
            galleryImageRepository.save(galleryImage);

            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("@perm.has('gallery','edit')")
    public ResponseEntity<GalleryImage> restoreImage(@PathVariable String id) {
        try {
            GalleryImage galleryImage = galleryImageRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image not found"));

            galleryImage.setIsActive(true);
            GalleryImage restored = galleryImageRepository.save(galleryImage);

            return ResponseEntity.ok(restored);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
