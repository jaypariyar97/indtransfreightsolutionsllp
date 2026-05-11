package com.indtrans.freight.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

public class FileUploadUtil {

    private static final String BASE_UPLOAD_DIR = "uploads/";
    private static final String VEHICLES_DIR = BASE_UPLOAD_DIR + "vehicles/";
    private static final Path UPLOAD_ROOT = Paths.get(BASE_UPLOAD_DIR).toAbsolutePath().normalize();

    /**
     * Save a file under uploads/vehicles/<subDir>/ (backwards compatible).
     */
    public static String saveFile(MultipartFile file, String subDir) throws IOException {
        return saveToBase(file, VEHICLES_DIR + subDir + "/", "/uploads/vehicles/" + subDir + "/");
    }

    /**
     * Save a file under an arbitrary directory relative to uploads/ root.
     * Example: saveToFolder(file, "receipts") -> uploads/receipts/<uuid>.pdf
     * Returns the public relative path (starts with /uploads/...).
     */
    public static String saveToFolder(MultipartFile file, String folder) throws IOException {
        String diskDir = BASE_UPLOAD_DIR + folder + "/";
        String publicPrefix = "/uploads/" + folder + "/";
        return saveToBase(file, diskDir, publicPrefix);
    }

    private static String saveToBase(MultipartFile file, String diskDir, String publicPrefix) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        Path path = Paths.get(diskDir);
        Files.createDirectories(path);

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        Path filePath = path.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return publicPrefix + filename;
    }

    public static void deleteFile(String filePath) {
        if (filePath != null && !filePath.isEmpty()) {
            try {
                String relative = filePath.trim().replace('\\', '/');
                if (relative.startsWith("/")) {
                    relative = relative.substring(1);
                }
                if (relative.startsWith("uploads/")) {
                    relative = relative.substring("uploads/".length());
                }

                Path path = UPLOAD_ROOT.resolve(relative).normalize();
                if (!path.startsWith(UPLOAD_ROOT)) {
                    throw new IOException("Refusing to delete outside uploads root");
                }

                Files.deleteIfExists(path);
            } catch (IOException e) {
                System.err.println("Failed to delete file: " + filePath);
            }
        }
    }
}
