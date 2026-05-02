package com.indtrans.freight.controller;

import com.indtrans.freight.model.Billing;
import com.indtrans.freight.model.Gcn;
import com.indtrans.freight.repository.BillingRepository;
import com.indtrans.freight.repository.GcnRepository;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class FileController {

    private static final Path UPLOAD_ROOT = Paths.get("uploads").toAbsolutePath().normalize();

    private final GcnRepository gcnRepository;
    private final BillingRepository billingRepository;

    public FileController(GcnRepository gcnRepository, BillingRepository billingRepository) {
        this.gcnRepository = gcnRepository;
        this.billingRepository = billingRepository;
    }

    @GetMapping("/view")
    public ResponseEntity<Resource> viewFile(
            @RequestParam String path,
            @RequestParam(required = false) String downloadName) {
        return serveFile(path, "inline", downloadName);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam String path,
            @RequestParam(required = false) String downloadName) {
        return serveFile(path, "attachment", downloadName);
    }

    private ResponseEntity<Resource> serveFile(String requestedPath, String dispositionType, String requestedDownloadName) {
        try {
            String normalizedPublicPath = normalizePublicPath(requestedPath);
            Path filePath = resolveUploadPath(normalizedPublicPath);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable() || Files.isDirectory(filePath)) {
                return ResponseEntity.notFound().build();
            }

            MediaType contentType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);
            String filename = resolveFriendlyFilename(normalizedPublicPath, filePath, requestedDownloadName);
            ContentDisposition contentDisposition = "inline".equalsIgnoreCase(dispositionType)
                    ? ContentDisposition.inline().filename(filename, StandardCharsets.UTF_8).build()
                    : ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build();

            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                    .body(resource);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Path resolveUploadPath(String normalizedPublicPath) {
        if (normalizedPublicPath == null || normalizedPublicPath.isBlank()) {
            throw new SecurityException("Missing file path");
        }

        String normalized = normalizedPublicPath;
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.startsWith("uploads/")) {
            normalized = normalized.substring("uploads/".length());
        }

        Path resolved = UPLOAD_ROOT.resolve(normalized).normalize();
        if (!resolved.startsWith(UPLOAD_ROOT)) {
            throw new SecurityException("Path traversal attempt blocked");
        }

        return resolved;
    }

    private String normalizePublicPath(String requestedPath) {
        if (requestedPath == null || requestedPath.isBlank()) {
            throw new SecurityException("Missing file path");
        }

        String normalized = requestedPath.trim().replace('\\', '/');
        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }
        if (!normalized.startsWith("/uploads/")) {
            normalized = "/uploads" + normalized;
        }
        return normalized.replace("//", "/");
    }

    private String resolveFriendlyFilename(String publicPath, Path filePath, String requestedDownloadName) {
        String extension = extensionOf(filePath.getFileName().toString());
        if (requestedDownloadName != null && !requestedDownloadName.isBlank()) {
            return ensureExtension(sanitizeFilename(requestedDownloadName), extension);
        }

        Optional<Gcn> gcnReceipt = gcnRepository.findByReceiptPath(publicPath);
        if (gcnReceipt.isPresent()) {
            return sanitizeFilename(nonBlank(gcnReceipt.get().getGcnNumber(), "gcn-receipt")) + extension;
        }

        Optional<Billing> billingReceipt = billingRepository.findByReceiptPath(publicPath);
        if (billingReceipt.isPresent()) {
            return sanitizeFilename(nonBlank(billingReceipt.get().getBillNumber(), "billing-receipt")) + extension;
        }

        return sanitizeFilename(filePath.getFileName().toString());
    }

    private String extensionOf(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex) : "";
    }

    private String ensureExtension(String filename, String extension) {
        if (extension.isBlank() || filename.toLowerCase().endsWith(extension.toLowerCase())) {
            return filename;
        }
        return filename + extension;
    }

    private String sanitizeFilename(String filename) {
        String cleaned = filename.replaceAll("[\\\\/:*?\"<>|\\r\\n]+", "-").trim();
        return cleaned.isBlank() ? "download" : cleaned;
    }

    private String nonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
