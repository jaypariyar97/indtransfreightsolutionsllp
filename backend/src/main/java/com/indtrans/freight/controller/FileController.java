package com.indtrans.freight.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
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

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class FileController {

    private static final Path UPLOAD_ROOT = Paths.get("uploads").toAbsolutePath().normalize();

    @GetMapping("/view")
    public ResponseEntity<Resource> viewFile(@RequestParam String path) {
        return serveFile(path, "inline");
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(@RequestParam String path) {
        return serveFile(path, "attachment");
    }

    private ResponseEntity<Resource> serveFile(String requestedPath, String dispositionType) {
        try {
            Path filePath = resolveUploadPath(requestedPath);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable() || Files.isDirectory(filePath)) {
                return ResponseEntity.notFound().build();
            }

            MediaType contentType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);
            String filename = filePath.getFileName().toString();

            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Path resolveUploadPath(String requestedPath) {
        if (requestedPath == null || requestedPath.isBlank()) {
            throw new SecurityException("Missing file path");
        }

        String normalized = requestedPath.trim().replace('\\', '/');
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
}
