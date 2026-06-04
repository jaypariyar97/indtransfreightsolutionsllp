import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";
import Hash "mo:base/Hash";
import Blob "mo:base/Blob";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ShipmentStatus = {#pending; #in_transit; #delivered; #cancelled};
type UserRole = {#admin; #dispatcher; #driver; #customer};
type DriverStatus = {#active; #inactive; #suspended};

type Shipment = {
  id: Text;
  origin: Text;
  destination: Text;
  weight: Nat;
  status: ShipmentStatus;
  createdAt: Int;
  updatedAt: Int;
  trackingNumber: Text;
  driverId: ?Text;
  estimatedDelivery: ?Int;
  actualDelivery: ?Int;
};

type Driver = {
  id: Text;
  name: Text;
  email: Text;
  licenseNumber: Text;
  status: DriverStatus;
  createdAt: Int;
};

type User = {
  id: Text;
  username: Text;
  email: Text;
  passwordHash: Text;
  role: UserRole;
  createdAt: Int;
  lastLogin: ?Int;
};

type AuthRequest = {
  username: Text;
  password: Text;
};

type AuthResponse = {
  token: Text;
  userId: Text;
  username: Text;
  role: UserRole;
};

type CreateShipmentRequest = {
  origin: Text;
  destination: Text;
  weight: Nat;
};

type UpdateShipmentRequest = {
  status: ShipmentStatus;
  estimatedDelivery: ?Int;
};

type ApiResponse = {
  success: Bool;
  message: Text;
  data: ?Text;
};

// ============================================================================
// STORAGE
// ============================================================================

var shipments = TrieMap.TrieMap<Text, Shipment>(Text.equal, Text.hash);
var drivers = TrieMap.TrieMap<Text, Driver>(Text.equal, Text.hash);
var users = TrieMap.TrieMap<Text, User>(Text.equal, Text.hash);
var shipmentCounter : Nat = 0;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

func generateId() : Text {
  shipmentCounter += 1;
  "SHIP_" # Nat.toText(shipmentCounter) # "_" # Nat64.toText(Nat64.fromIntWrap(Time.now()))
};

func generateTrackingNumber() : Text {
  "TRK_" # Nat.toText(shipmentCounter) # "_" # Nat32.toText(Nat32.fromIntWrap(Int.abs(Time.now())))
};

func hashPassword(password: Text) : Text {
  // Note: This is a simple implementation. In production, use proper hashing.
  password # "_hashed_motoko"
};

func statusToText(status: ShipmentStatus) : Text {
  switch (status) {
    case (#pending) { "pending" };
    case (#in_transit) { "in_transit" };
    case (#delivered) { "delivered" };
    case (#cancelled) { "cancelled" };
  }
};

func roleToText(role: UserRole) : Text {
  switch (role) {
    case (#admin) { "admin" };
    case (#dispatcher) { "dispatcher" };
    case (#driver) { "driver" };
    case (#customer) { "customer" };
  }
};

func driverStatusToText(status: DriverStatus) : Text {
  switch (status) {
    case (#active) { "active" };
    case (#inactive) { "inactive" };
    case (#suspended) { "suspended" };
  }
};

// ============================================================================
// SHIPMENT FUNCTIONS
// ============================================================================

public query func getAllShipments() : async [Shipment] {
  Buffer.toArray(Buffer.fromIter(shipments.vals()))
};

public query func getShipmentById(id: Text) : async Result.Result<Shipment, Text> {
  match (shipments.get(id)) {
    case (null) { #err("Shipment not found") };
    case (?shipment) { #ok(shipment) };
  }
};

public query func getShipmentsByStatus(status: ShipmentStatus) : async [Shipment] {
  let matching = Buffer.Buffer<Shipment>(0);
  for (shipment in shipments.vals()) {
    if (shipment.status == status) {
      matching.add(shipment);
    };
  };
  Buffer.toArray(matching)
};

public query func getShipmentsByDriver(driverId: Text) : async [Shipment] {
  let matching = Buffer.Buffer<Shipment>(0);
  for (shipment in shipments.vals()) {
    switch (shipment.driverId) {
      case (null) {};
      case (?id) {
        if (id == driverId) {
          matching.add(shipment);
        };
      };
    };
  };
  Buffer.toArray(matching)
};

public func createShipment(request: CreateShipmentRequest) : async Result.Result<Shipment, Text> {
  let id = generateId();
  let trackingNumber = generateTrackingNumber();
  let now = Time.now();
  
  let newShipment : Shipment = {
    id = id;
    origin = request.origin;
    destination = request.destination;
    weight = request.weight;
    status = #pending;
    createdAt = now;
    updatedAt = now;
    trackingNumber = trackingNumber;
    driverId = null;
    estimatedDelivery = null;
    actualDelivery = null;
  };
  
  shipments.put(id, newShipment);
  #ok(newShipment)
};

public func updateShipment(id: Text, request: UpdateShipmentRequest) : async Result.Result<Shipment, Text> {
  match (shipments.get(id)) {
    case (null) { #err("Shipment not found") };
    case (?shipment) {
      let updated : Shipment = {
        id = shipment.id;
        origin = shipment.origin;
        destination = shipment.destination;
        weight = shipment.weight;
        status = request.status;
        createdAt = shipment.createdAt;
        updatedAt = Time.now();
        trackingNumber = shipment.trackingNumber;
        driverId = shipment.driverId;
        estimatedDelivery = request.estimatedDelivery;
        actualDelivery = if (request.status == #delivered) { ?Time.now() } else { shipment.actualDelivery };
      };
      shipments.put(id, updated);
      #ok(updated)
    };
  }
};

public func assignDriver(shipmentId: Text, driverId: Text) : async Result.Result<Shipment, Text> {
  match (shipments.get(shipmentId)) {
    case (null) { #err("Shipment not found") };
    case (?shipment) {
      match (drivers.get(driverId)) {
        case (null) { #err("Driver not found") };
        case (?driver) {
          if (driver.status != #active) {
            return #err("Driver is not active");
          };
          let updated : Shipment = {
            shipment with
            driverId = ?driverId;
            updatedAt = Time.now();
            status = #in_transit;
          };
          shipments.put(shipmentId, updated);
          #ok(updated)
        };
      }
    };
  }
};

public func deleteShipment(id: Text) : async Result.Result<Text, Text> {
  match (shipments.remove(id)) {
    case (null) { #err("Shipment not found") };
    case (?_) { #ok("Shipment deleted successfully") };
  }
};

// ============================================================================
// DRIVER FUNCTIONS
// ============================================================================

public query func getAllDrivers() : async [Driver] {
  Buffer.toArray(Buffer.fromIter(drivers.vals()))
};

public query func getDriverById(id: Text) : async Result.Result<Driver, Text> {
  match (drivers.get(id)) {
    case (null) { #err("Driver not found") };
    case (?driver) { #ok(driver) };
  }
};

public query func getActiveDrivers() : async [Driver] {
  let active = Buffer.Buffer<Driver>(0);
  for (driver in drivers.vals()) {
    if (driver.status == #active) {
      active.add(driver);
    };
  };
  Buffer.toArray(active)
};

public func createDriver(name: Text, email: Text, licenseNumber: Text) : async Result.Result<Driver, Text> {
  if (Text.size(name) == 0 or Text.size(email) == 0 or Text.size(licenseNumber) == 0) {
    return #err("Invalid driver data");
  };
  
  let id = "DRIVER_" # Nat.toText(shipmentCounter);
  let now = Time.now();
  
  let newDriver : Driver = {
    id = id;
    name = name;
    email = email;
    licenseNumber = licenseNumber;
    status = #active;
    createdAt = now;
  };
  
  drivers.put(id, newDriver);
  #ok(newDriver)
};

public func updateDriverStatus(driverId: Text, newStatus: DriverStatus) : async Result.Result<Driver, Text> {
  match (drivers.get(driverId)) {
    case (null) { #err("Driver not found") };
    case (?driver) {
      let updated : Driver = {
        driver with
        status = newStatus;
      };
      drivers.put(driverId, updated);
      #ok(updated)
    };
  }
};

// ============================================================================
// USER AUTHENTICATION
// ============================================================================

public func registerUser(username: Text, email: Text, password: Text, role: UserRole) : async Result.Result<User, Text> {
  if (Text.size(username) < 3 or Text.size(password) < 6) {
    return #err("Username must be 3+ characters, password must be 6+ characters");
  };
  
  let id = "USER_" # Nat.toText(shipmentCounter);
  let now = Time.now();
  
  let newUser : User = {
    id = id;
    username = username;
    email = email;
    passwordHash = hashPassword(password);
    role = role;
    createdAt = now;
    lastLogin = null;
  };
  
  users.put(id, newUser);
  #ok(newUser)
};

public query func authenticateUser(username: Text, password: Text) : async Result.Result<AuthResponse, Text> {
  for (user in users.vals()) {
    if (user.username == username) {
      if (user.passwordHash == hashPassword(password)) {
        return #ok({
          token = Principal.toText(Principal.fromActor(actor "")) # "_" # Nat64.toText(Nat64.fromIntWrap(Time.now()));
          userId = user.id;
          username = user.username;
          role = user.role;
        });
      };
    };
  };
  #err("Invalid credentials")
};

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

public query func getShipmentStats() : async {
  total: Nat;
  pending: Nat;
  inTransit: Nat;
  delivered: Nat;
  cancelled: Nat;
} {
  var total = 0;
  var pending = 0;
  var inTransit = 0;
  var delivered = 0;
  var cancelled = 0;
  
  for (shipment in shipments.vals()) {
    total += 1;
    switch (shipment.status) {
      case (#pending) { pending += 1 };
      case (#in_transit) { inTransit += 1 };
      case (#delivered) { delivered += 1 };
      case (#cancelled) { cancelled += 1 };
    };
  };
  
  {
    total = total;
    pending = pending;
    inTransit = inTransit;
    delivered = delivered;
    cancelled = cancelled;
  }
};

public query func getDriverStats() : async {
  total: Nat;
  active: Nat;
  inactive: Nat;
} {
  var total = 0;
  var active = 0;
  var inactive = 0;
  
  for (driver in drivers.vals()) {
    total += 1;
    switch (driver.status) {
      case (#active) { active += 1 };
      case (#inactive) { inactive += 1 };
      case (#suspended) { inactive += 1 };
    };
  };
  
  {
    total = total;
    active = active;
    inactive = inactive;
  }
};

public query func getSystemStats() : async {
  totalShipments: Nat;
  totalDrivers: Nat;
  totalUsers: Nat;
  avgShipmentsPerDriver: Nat;
} {
  var totalShipments = 0;
  var totalDrivers = 0;
  var totalUsers = 0;
  
  for (_ in shipments.vals()) { totalShipments += 1 };
  for (_ in drivers.vals()) { totalDrivers += 1 };
  for (_ in users.vals()) { totalUsers += 1 };
  
  let avgShipmentsPerDriver = if (totalDrivers > 0) { totalShipments / totalDrivers } else { 0 };
  
  {
    totalShipments = totalShipments;
    totalDrivers = totalDrivers;
    totalUsers = totalUsers;
    avgShipmentsPerDriver = avgShipmentsPerDriver;
  }
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

public query func health() : async {
  status: Text;
  timestamp: Int;
  version: Text;
} {
  {
    status = "healthy";
    timestamp = Time.now();
    version = "1.0.0";
  }
};
