import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";
import Result "mo:base/Result";

// ============================================================================
// IMAGE & GALLERY MANAGEMENT - COMPLETE IMPLEMENTATION
// ============================================================================

type ImageBlob = {
  id: Text;
  name: Text;
  description: ?Text;
  data: Blob;  // Raw image bytes
  contentType: Text;  // image/jpeg, image/png, etc.
  fileSize: Nat;  // In bytes
  uploadedAt: Int;
  uploadedBy: Text;
  isPublic: Bool;
};

type DocumentBlob = {
  id: Text;
  entityId: Text;  // Vehicle/Driver/Billing ID
  entityType: Text;  // VEHICLE, DRIVER, BILLING
  documentType: Text;  // RC, LICENSE, INSURANCE, PERMIT, RECEIPT
  data: Blob;  // Raw document bytes
  contentType: Text;  // application/pdf, image/jpeg, etc.
  fileSize: Nat;  // In bytes
  uploadedAt: Int;
  fileName: Text;  // Original filename
};

var imageBlobMap = TrieMap.TrieMap<Text, ImageBlob>(Text.equal, Text.hash);
var documentBlobMap = TrieMap.TrieMap<Text, DocumentBlob>(Text.equal, Text.hash);
var companyLogo : ?ImageBlob = null;

// ============================================================================
// LOGO MANAGEMENT
// ============================================================================

public func uploadCompanyLogo(logoData: Blob, fileName: Text, contentType: Text) : async Result.Result<{
  id: Text;
  fileSize: Nat;
  uploadedAt: Int;
}, Text> {
  // Validate file type
  let validTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];
  var isValid = false;
  for (vt in validTypes.vals()) {
    if (vt == contentType) { isValid := true };
  };
  if (not isValid) {
    return #err("Invalid logo format. Supported: JPEG, PNG, GIF, SVG");
  };

  let maxSize = 5_000_000;  // 5MB
  if (Blob.byteLength(logoData) > maxSize) {
    return #err("Logo file too large. Maximum 5MB");
  };

  let id = "LOGO_" # Nat.toText(Nat32.fromIntWrap(Int.abs(Time.now() / 1000000000)));
  let now = Time.now();

  let logo : ImageBlob = {
    id = id;
    name = fileName;
    description = ?"Company Logo";
    data = logoData;
    contentType = contentType;
    fileSize = Blob.byteLength(logoData);
    uploadedAt = now;
    uploadedBy = "system";
    isPublic = true;
  };

  companyLogo := ?logo;
  #ok({
    id = id;
    fileSize = Blob.byteLength(logoData);
    uploadedAt = now;
  })
};

public query func getCompanyLogo() : async ?{
  id: Text;
  data: Blob;
  contentType: Text;
  fileName: Text;
} {
  match (companyLogo) {
    case (null) { null };
    case (?logo) { ?{
      id = logo.id;
      data = logo.data;
      contentType = logo.contentType;
      fileName = logo.name;
    } };
  }
};

public query func getCompanyLogoMetadata() : async ?{
  id: Text;
  fileName: Text;
  contentType: Text;
  fileSize: Nat;
  uploadedAt: Int;
} {
  match (companyLogo) {
    case (null) { null };
    case (?logo) { ?{
      id = logo.id;
      fileName = logo.name;
      contentType = logo.contentType;
      fileSize = logo.fileSize;
      uploadedAt = logo.uploadedAt;
    } };
  }
};

public func deleteCompanyLogo() : async Result.Result<Text, Text> {
  match (companyLogo) {
    case (null) { #err("No logo to delete") };
    case (?_) {
      companyLogo := null;
      #ok("Logo deleted successfully")
    };
  }
};

// ============================================================================
// IMAGE GALLERY MANAGEMENT
// ============================================================================

public func uploadGalleryImageBlob(name: Text, description: ?Text, imageData: Blob, contentType: Text, uploadedBy: Text, isPublic: Bool) : async Result.Result<{
  id: Text;
  fileSize: Nat;
  uploadedAt: Int;
}, Text> {
  // Validate file type
  let validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  var isValid = false;
  for (vt in validTypes.vals()) {
    if (vt == contentType) { isValid := true };
  };
  if (not isValid) {
    return #err("Invalid image format. Supported: JPEG, PNG, GIF, WebP");
  };

  let maxSize = 10_000_000;  // 10MB per image
  if (Blob.byteLength(imageData) > maxSize) {
    return #err("Image file too large. Maximum 10MB");
  };

  let id = generateId();
  let now = Time.now();

  let image : ImageBlob = {
    id = id;
    name = name;
    description = description;
    data = imageData;
    contentType = contentType;
    fileSize = Blob.byteLength(imageData);
    uploadedAt = now;
    uploadedBy = uploadedBy;
    isPublic = isPublic;
  };

  imageBlobMap.put(id, image);
  #ok({
    id = id;
    fileSize = Blob.byteLength(imageData);
    uploadedAt = now;
  })
};

public query func getGalleryImageBlob(imageId: Text) : async Result.Result<{
  data: Blob;
  contentType: Text;
}, Text> {
  match (imageBlobMap.get(imageId)) {
    case (null) { #err("Image not found") };
    case (?image) {
      if (not image.isPublic) {
        return #err("Image is private");
      };
      #ok({
        data = image.data;
        contentType = image.contentType;
      })
    };
  }
};

public query func getGalleryImageBlobProtected(imageId: Text) : async Result.Result<{
  data: Blob;
  contentType: Text;
}, Text> {
  match (imageBlobMap.get(imageId)) {
    case (null) { #err("Image not found") };
    case (?image) {
      #ok({
        data = image.data;
        contentType = image.contentType;
      })
    };
  }
};

public query func getAllGalleryImageMetadata() : async [{
  id: Text;
  name: Text;
  description: ?Text;
  contentType: Text;
  fileSize: Nat;
  uploadedAt: Int;
  uploadedBy: Text;
  isPublic: Bool;
}] {
  let results = Buffer.Buffer<{
    id: Text;
    name: Text;
    description: ?Text;
    contentType: Text;
    fileSize: Nat;
    uploadedAt: Int;
    uploadedBy: Text;
    isPublic: Bool;
  }>(0);

  for (image in imageBlobMap.vals()) {
    results.add({
      id = image.id;
      name = image.name;
      description = image.description;
      contentType = image.contentType;
      fileSize = image.fileSize;
      uploadedAt = image.uploadedAt;
      uploadedBy = image.uploadedBy;
      isPublic = image.isPublic;
    });
  };

  Buffer.toArray(results)
};

public query func getPublicGalleryImageMetadata() : async [{
  id: Text;
  name: Text;
  description: ?Text;
  contentType: Text;
  fileSize: Nat;
  uploadedAt: Int;
}] {
  let results = Buffer.Buffer<{
    id: Text;
    name: Text;
    description: ?Text;
    contentType: Text;
    fileSize: Nat;
    uploadedAt: Int;
  }>(0);

  for (image in imageBlobMap.vals()) {
    if (image.isPublic) {
      results.add({
        id = image.id;
        name = image.name;
        description = image.description;
        contentType = image.contentType;
        fileSize = image.fileSize;
        uploadedAt = image.uploadedAt;
      });
    };
  };

  Buffer.toArray(results)
};

public func deleteGalleryImage(imageId: Text) : async Result.Result<Text, Text> {
  match (imageBlobMap.remove(imageId)) {
    case (null) { #err("Image not found") };
    case (?_) { #ok("Gallery image deleted successfully") };
  }
};

public query func getGalleryImageCount() : async Nat {
  var count = 0;
  for (_ in imageBlobMap.vals()) { count += 1 };
  count
};

// ============================================================================
// DOCUMENT MANAGEMENT (Vehicle RC, Insurance, Permit, Driver License, Receipts)
// ============================================================================

public func uploadDocument(entityId: Text, entityType: Text, documentType: Text, fileName: Text, documentData: Blob, contentType: Text) : async Result.Result<{
  id: Text;
  fileSize: Nat;
  uploadedAt: Int;
}, Text> {
  // Validate entity type
  if (entityType != "VEHICLE" and entityType != "DRIVER" and entityType != "BILLING") {
    return #err("Invalid entity type");
  };

  // Validate document type based on entity
  if (entityType == "VEHICLE") {
    if (documentType != "RC" and documentType != "INSURANCE" and documentType != "PERMIT") {
      return #err("Invalid vehicle document type");
    };
  };
  if (entityType == "DRIVER") {
    if (documentType != "LICENSE" and documentType != "AADHAR") {
      return #err("Invalid driver document type");
    };
  };
  if (entityType == "BILLING") {
    if (documentType != "RECEIPT") {
      return #err("Invalid billing document type");
    };
  };

  // Validate file type
  let validTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
  var isValid = false;
  for (vt in validTypes.vals()) {
    if (vt == contentType) { isValid := true };
  };
  if (not isValid) {
    return #err("Invalid document format. Supported: PDF, JPEG, PNG, GIF");
  };

  let maxSize = 50_000_000;  // 50MB
  if (Blob.byteLength(documentData) > maxSize) {
    return #err("Document file too large. Maximum 50MB");
  };

  let id = generateId();
  let now = Time.now();

  let document : DocumentBlob = {
    id = id;
    entityId = entityId;
    entityType = entityType;
    documentType = documentType;
    data = documentData;
    contentType = contentType;
    fileSize = Blob.byteLength(documentData);
    uploadedAt = now;
    fileName = fileName;
  };

  documentBlobMap.put(id, document);
  #ok({
    id = id;
    fileSize = Blob.byteLength(documentData);
    uploadedAt = now;
  })
};

public query func getDocument(documentId: Text) : async Result.Result<{
  data: Blob;
  contentType: Text;
  fileName: Text;
}, Text> {
  match (documentBlobMap.get(documentId)) {
    case (null) { #err("Document not found") };
    case (?doc) { #ok({
      data = doc.data;
      contentType = doc.contentType;
      fileName = doc.fileName;
    }) };
  }
};

public query func getDocumentMetadata(documentId: Text) : async Result.Result<{
  id: Text;
  entityId: Text;
  entityType: Text;
  documentType: Text;
  contentType: Text;
  fileSize: Nat;
  uploadedAt: Int;
  fileName: Text;
}, Text> {
  match (documentBlobMap.get(documentId)) {
    case (null) { #err("Document not found") };
    case (?doc) { #ok({
      id = doc.id;
      entityId = doc.entityId;
      entityType = doc.entityType;
      documentType = doc.documentType;
      contentType = doc.contentType;
      fileSize = doc.fileSize;
      uploadedAt = doc.uploadedAt;
      fileName = doc.fileName;
    }) };
  }
};

public query func getDocumentsByEntity(entityId: Text) : async [{
  id: Text;
  documentType: Text;
  contentType: Text;
  fileSize: Nat;
  uploadedAt: Int;
  fileName: Text;
}] {
  let results = Buffer.Buffer<{
    id: Text;
    documentType: Text;
    contentType: Text;
    fileSize: Nat;
    uploadedAt: Int;
    fileName: Text;
  }>(0);

  for (doc in documentBlobMap.vals()) {
    if (doc.entityId == entityId) {
      results.add({
        id = doc.id;
        documentType = doc.documentType;
        contentType = doc.contentType;
        fileSize = doc.fileSize;
        uploadedAt = doc.uploadedAt;
        fileName = doc.fileName;
      });
    };
  };

  Buffer.toArray(results)
};

public func deleteDocument(documentId: Text) : async Result.Result<Text, Text> {
  match (documentBlobMap.remove(documentId)) {
    case (null) { #err("Document not found") };
    case (?_) { #ok("Document deleted successfully") };
  }
};

public query func getDocumentCount() : async Nat {
  var count = 0;
  for (_ in documentBlobMap.vals()) { count += 1 };
  count
};

public query func getStorageStats() : async {
  totalImageSize: Nat;
  totalDocumentSize: Nat;
  totalImagesCount: Nat;
  totalDocumentsCount: Nat;
  logoSize: Nat;
} {
  var totalImageSize = 0;
  var totalDocumentSize = 0;
  var logoSize = 0;

  for (image in imageBlobMap.vals()) {
    totalImageSize += image.fileSize;
  };

  for (doc in documentBlobMap.vals()) {
    totalDocumentSize += doc.fileSize;
  };

  match (companyLogo) {
    case (null) {};
    case (?logo) { logoSize := logo.fileSize };
  };

  {
    totalImageSize = totalImageSize;
    totalDocumentSize = totalDocumentSize;
    totalImagesCount = do {
      var count = 0;
      for (_ in imageBlobMap.vals()) { count += 1 };
      count
    };
    totalDocumentsCount = do {
      var count = 0;
      for (_ in documentBlobMap.vals()) { count += 1 };
      count
    };
    logoSize = logoSize;
  }
};

public query func getCanisterMemoryUsed() : async {
  bytes: Nat;
  estimatedMB: Float;
} {
  let totalImageSize = do {
    var size = 0;
    for (image in imageBlobMap.vals()) { size += image.fileSize };
    size
  };
  let totalDocumentSize = do {
    var size = 0;
    for (doc in documentBlobMap.vals()) { size += doc.fileSize };
    size
  };
  let logoSize = do {
    match (companyLogo) {
      case (null) { 0 };
      case (?logo) { logo.fileSize };
    }
  };

  let total = totalImageSize + totalDocumentSize + logoSize;
  {
    bytes = total;
    estimatedMB = Float.fromNat(total) / 1_000_000.0;
  }
};

func generateId() : Text {
  "ID_" # Nat.toText(Nat32.fromIntWrap(Int.abs(Time.now() / 1000000000)))
};
