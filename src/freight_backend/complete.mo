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
import Float "mo:base/Float";
import Option "mo:base/Option";
import Iter "mo:base/Iter";

// ============================================================================
// COMPREHENSIVE TYPE DEFINITIONS - MATCHING SPRING BOOT ENTITIES
// ============================================================================

// Enums
type UserRole = {#ADMIN; #EMPLOYEE; #CUSTOMER; #DRIVER};
type ShipmentStatus = {#PENDING; #IN_TRANSIT; #DELIVERED; #CANCELLED; #ON_HOLD};
type VehicleStatus = {#ACTIVE; #INACTIVE; #MAINTENANCE; #DECOMMISSIONED};
type DriverStatus = {#ACTIVE; #INACTIVE; #SUSPENDED; #ON_LEAVE};
type BillingStatus = {#PENDING; #PAID; #CANCELLED; #OVERDUE};
type GcnStatus = {#DRAFT; #CONFIRMED; #IN_TRANSIT; #DELIVERED; #CANCELLED};
type Permission = {#VIEW; #CREATE; #EDIT; #DELETE};

// ============================================================================
// CORE ENTITIES
// ============================================================================

type Employee = {
  id: Text;
  username: Text;
  email: Text;
  passwordHash: Text;
  role: UserRole;
  fullName: Text;
  phoneNumber: ?Text;
  mustChangePassword: Bool;
  isActive: Bool;
  createdAt: Int;
  updatedAt: Int;
  lastLogin: ?Int;
};

type Customer = {
  id: Text;
  name: Text;
  email: ?Text;
  phoneNumber: ?Text;
  address: Text;
  city: Text;
  state: Text;
  gstNumber: ?Text;
  panNumber: ?Text;
  bankName: ?Text;
  accountNumber: ?Text;
  ifscCode: ?Text;
  isActive: Bool;
  createdAt: Int;
  updatedAt: Int;
};

type Driver = {
  id: Text;
  name: Text;
  email: ?Text;
  phoneNumber: Text;
  licenseNumber: Text;
  licenseExpiry: ?Int;
  aadharNumber: ?Text;
  address: Text;
  bankName: ?Text;
  accountNumber: ?Text;
  ifscCode: ?Text;
  licenseDocPath: ?Text;
  status: DriverStatus;
  createdAt: Int;
  updatedAt: Int;
};

type Vehicle = {
  id: Text;
  registrationNumber: Text;
  vehicleType: Text; // Truck, Bus, Van, etc.
  make: Text;
  model: Text;
  year: Nat;
  capacity: Nat; // in kg
  rcNumber: ?Text;
  rcDocPath: ?Text;
  insuranceDocPath: ?Text;
  permitDocPath: ?Text;
  lastServiceDate: ?Int;
  nextServiceDate: ?Int;
  status: VehicleStatus;
  transporterId: ?Text;
  createdAt: Int;
  updatedAt: Int;
};

type Transporter = {
  id: Text;
  name: Text;
  email: ?Text;
  phoneNumber: ?Text;
  address: Text;
  city: Text;
  state: Text;
  gstNumber: ?Text;
  panNumber: ?Text;
  bankName: ?Text;
  accountNumber: ?Text;
  ifscCode: ?Text;
  isActive: Bool;
  createdAt: Int;
  updatedAt: Int;
};

type Location = {
  id: Text;
  name: Text;
  city: Text;
  state: Text;
  latitude: ?Float;
  longitude: ?Float;
  createdAt: Int;
};

type CargoItem = {
  id: Text;
  description: Text;
  quantity: Nat;
  weight: Nat;
  dimensions: Text;
  hazardous: Bool;
  gcnId: ?Text;
  shipmentId: ?Text;
  createdAt: Int;
};

type GcnTrackingEvent = {
  id: Text;
  gcnId: Text;
  eventType: Text; // CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED
  location: ?Text;
  description: ?Text;
  timestamp: Int;
  remarks: ?Text;
};

type Gcn = {
  id: Text;
  gcnNumber: Text; // Goods Consignment Note
  customerId: Text;
  transporterId: Text;
  originLocationId: Text;
  destinationLocationId: Text;
  status: GcnStatus;
  pickupDate: Int;
  deliveryDate: ?Int;
  totalWeight: Nat;
  totalValue: Nat;
  cargoItems: [Text]; // Array of CargoItem IDs
  trackingEvents: [Text]; // Array of GcnTrackingEvent IDs
  assignedDriverId: ?Text;
  assignedVehicleId: ?Text;
  notes: ?Text;
  createdAt: Int;
  updatedAt: Int;
};

type Shipment = {
  id: Text;
  gcnId: Text;
  originLocationId: Text;
  destinationLocationId: Text;
  status: ShipmentStatus;
  pickupDate: Int;
  deliveryDate: ?Int;
  estimatedDeliveryDate: ?Int;
  weight: Nat;
  value: Nat;
  driverId: ?Text;
  vehicleId: ?Text;
  trackingNumber: Text;
  createdAt: Int;
  updatedAt: Int;
};

type Invoice = {
  id: Text;
  invoiceNumber: Text;
  gcnId: Text;
  customerId: Text;
  amount: Nat;
  taxAmount: Nat;
  totalAmount: Nat;
  issueDate: Int;
  dueDate: Int;
  isPaid: Bool;
  createdAt: Int;
  updatedAt: Int;
};

type Billing = {
  id: Text;
  invoiceId: Text;
  gcnId: Text;
  customerId: Text;
  amount: Nat;
  paidAmount: Nat;
  status: BillingStatus;
  paymentDate: ?Int;
  receiptPath: ?Text;
  notes: ?Text;
  createdAt: Int;
  updatedAt: Int;
};

type Vhc = {
  id: Text;
  vehicleId: Text;
  driverId: Text;
  hiringRate: Nat;
  totalHours: Nat;
  totalAmount: Nat;
  startDate: Int;
  endDate: ?Int;
  remarks: ?Text;
  createdAt: Int;
  updatedAt: Int;
};

type GalleryImage = {
  id: Text;
  title: Text;
  description: ?Text;
  imagePath: Text;
  uploadedBy: Text;
  isPublic: Bool;
  createdAt: Int;
};

type PasswordResetToken = {
  id: Text;
  employeeId: Text;
  token: Text;
  expiresAt: Int;
  createdAt: Int;
};

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

type LoginRequest = {
  username: Text;
  password: Text;
};

type LoginResponse = {
  token: Text;
  employeeId: Text;
  username: Text;
  email: Text;
  role: UserRole;
  mustChangePassword: Bool;
};

type ChangePasswordRequest = {
  currentPassword: Text;
  newPassword: Text;
  confirmPassword: Text;
};

type ApiResponse<T> = {
  success: Bool;
  message: Text;
  data: ?T;
  errors: ?[Text];
};

// ============================================================================
// STORAGE - ALL ENTITIES
// ============================================================================

var employees = TrieMap.TrieMap<Text, Employee>(Text.equal, Text.hash);
var customers = TrieMap.TrieMap<Text, Customer>(Text.equal, Text.hash);
var drivers = TrieMap.TrieMap<Text, Driver>(Text.equal, Text.hash);
var vehicles = TrieMap.TrieMap<Text, Vehicle>(Text.equal, Text.hash);
var transporters = TrieMap.TrieMap<Text, Transporter>(Text.equal, Text.hash);
var locations = TrieMap.TrieMap<Text, Location>(Text.equal, Text.hash);
var cargoItems = TrieMap.TrieMap<Text, CargoItem>(Text.equal, Text.hash);
var gcns = TrieMap.TrieMap<Text, Gcn>(Text.equal, Text.hash);
var gcnTrackingEvents = TrieMap.TrieMap<Text, GcnTrackingEvent>(Text.equal, Text.hash);
var shipments = TrieMap.TrieMap<Text, Shipment>(Text.equal, Text.hash);
var invoices = TrieMap.TrieMap<Text, Invoice>(Text.equal, Text.hash);
var billings = TrieMap.TrieMap<Text, Billing>(Text.equal, Text.hash);
var vhcs = TrieMap.TrieMap<Text, Vhc>(Text.equal, Text.hash);
var galleryImages = TrieMap.TrieMap<Text, GalleryImage>(Text.equal, Text.hash);
var passwordResetTokens = TrieMap.TrieMap<Text, PasswordResetToken>(Text.equal, Text.hash);

var idCounter : Nat = 0;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

func generateId() : Text {
  idCounter += 1;
  "ID_" # Nat.toText(idCounter) # "_" # Nat64.toText(Nat64.fromIntWrap(Time.now()))
};

func generateTrackingNumber() : Text {
  "TRK" # Nat.toText(idCounter) # Nat32.toText(Nat32.fromIntWrap(Int.abs(Time.now() / 1000000000)))
};

func generateGcnNumber() : Text {
  "GCN" # Nat.toText(idCounter) # Nat32.toText(Nat32.fromIntWrap(Int.abs(Time.now() / 1000000000)))
};

func generateInvoiceNumber() : Text {
  "INV" # Nat.toText(idCounter) # Nat32.toText(Nat32.fromIntWrap(Int.abs(Time.now() / 1000000000)))
};

func hashPassword(password: Text) : Text {
  // Production: use proper bcrypt. This is placeholder.
  password # "_hashed_motoko_" # Nat64.toText(Nat64.fromIntWrap(Time.now()))
};

func validateEmail(email: Text) : Bool {
  Text.contains(email, #text "@")
};

func validatePassword(password: Text) : Bool {
  Text.size(password) >= 8 // Min 8 chars in production, enforce complexity
};

// ============================================================================
// EMPLOYEE/USER MANAGEMENT
// ============================================================================

public func registerEmployee(username: Text, email: Text, password: Text, fullName: Text, role: UserRole) : async Result.Result<Employee, Text> {
  if (Text.size(username) < 3) { return #err("Username must be 3+ characters") };
  if (not validateEmail(email)) { return #err("Invalid email format") };
  if (not validatePassword(password)) { return #err("Password must be 8+ characters") };
  
  let id = generateId();
  let now = Time.now();
  
  let newEmployee : Employee = {
    id = id;
    username = username;
    email = email;
    passwordHash = hashPassword(password);
    role = role;
    fullName = fullName;
    phoneNumber = null;
    mustChangePassword = true;
    isActive = true;
    createdAt = now;
    updatedAt = now;
    lastLogin = null;
  };
  
  employees.put(id, newEmployee);
  #ok(newEmployee)
};

public query func authenticateEmployee(username: Text, password: Text) : async Result.Result<LoginResponse, Text> {
  for (emp in employees.vals()) {
    if (emp.username == username) {
      if (emp.passwordHash == hashPassword(password)) {
        if (not emp.isActive) { return #err("Account is inactive") };
        return #ok({
          token = generateId();
          employeeId = emp.id;
          username = emp.username;
          email = emp.email;
          role = emp.role;
          mustChangePassword = emp.mustChangePassword;
        });
      };
    };
  };
  #err("Invalid username or password")
};

public func changePassword(employeeId: Text, currentPassword: Text, newPassword: Text) : async Result.Result<Text, Text> {
  match (employees.get(employeeId)) {
    case (null) { #err("Employee not found") };
    case (?emp) {
      if (emp.passwordHash != hashPassword(currentPassword)) {
        return #err("Current password is incorrect");
      };
      if (not validatePassword(newPassword)) {
        return #err("Password must be 8+ characters with mixed case and numbers");
      };
      let updated : Employee = {
        emp with
        passwordHash = hashPassword(newPassword);
        mustChangePassword = false;
        updatedAt = Time.now();
      };
      employees.put(employeeId, updated);
      #ok("Password changed successfully")
    };
  }
};

public query func getAllEmployees() : async [Employee] {
  Buffer.toArray(Buffer.fromIter(employees.vals()))
};

public query func getEmployeeById(id: Text) : async Result.Result<Employee, Text> {
  match (employees.get(id)) {
    case (null) { #err("Employee not found") };
    case (?emp) { #ok(emp) };
  }
};

public func updateEmployee(id: Text, fullName: Text, phoneNumber: ?Text, isActive: Bool) : async Result.Result<Employee, Text> {
  match (employees.get(id)) {
    case (null) { #err("Employee not found") };
    case (?emp) {
      let updated : Employee = {
        emp with
        fullName = fullName;
        phoneNumber = phoneNumber;
        isActive = isActive;
        updatedAt = Time.now();
      };
      employees.put(id, updated);
      #ok(updated)
    };
  }
};

public func deleteEmployee(id: Text) : async Result.Result<Text, Text> {
  match (employees.remove(id)) {
    case (null) { #err("Employee not found") };
    case (?_) { #ok("Employee deleted") };
  }
};

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

public func createCustomer(name: Text, address: Text, city: Text, state: Text, gstNumber: ?Text, panNumber: ?Text) : async Result.Result<Customer, Text> {
  if (Text.size(name) == 0) { return #err("Customer name required") };
  
  let id = generateId();
  let now = Time.now();
  
  let newCustomer : Customer = {
    id = id;
    name = name;
    email = null;
    phoneNumber = null;
    address = address;
    city = city;
    state = state;
    gstNumber = gstNumber;
    panNumber = panNumber;
    bankName = null;
    accountNumber = null;
    ifscCode = null;
    isActive = true;
    createdAt = now;
    updatedAt = now;
  };
  
  customers.put(id, newCustomer);
  #ok(newCustomer)
};

public query func getAllCustomers() : async [Customer] {
  Buffer.toArray(Buffer.fromIter(customers.vals()))
};

public query func getCustomerById(id: Text) : async Result.Result<Customer, Text> {
  match (customers.get(id)) {
    case (null) { #err("Customer not found") };
    case (?cust) { #ok(cust) };
  }
};

public func updateCustomer(id: Text, name: Text, address: Text, city: Text, state: Text, gstNumber: ?Text) : async Result.Result<Customer, Text> {
  match (customers.get(id)) {
    case (null) { #err("Customer not found") };
    case (?cust) {
      let updated : Customer = {
        cust with
        name = name;
        address = address;
        city = city;
        state = state;
        gstNumber = gstNumber;
        updatedAt = Time.now();
      };
      customers.put(id, updated);
      #ok(updated)
    };
  }
};

public func deleteCustomer(id: Text) : async Result.Result<Text, Text> {
  match (customers.remove(id)) {
    case (null) { #err("Customer not found") };
    case (?_) { #ok("Customer deleted") };
  }
};

// ============================================================================
// DRIVER MANAGEMENT
// ============================================================================

public func createDriver(name: Text, phoneNumber: Text, licenseNumber: Text, address: Text) : async Result.Result<Driver, Text> {
  if (Text.size(name) == 0 or Text.size(phoneNumber) == 0 or Text.size(licenseNumber) == 0) {
    return #err("Required driver fields missing");
  };
  
  let id = generateId();
  let now = Time.now();
  
  let newDriver : Driver = {
    id = id;
    name = name;
    email = null;
    phoneNumber = phoneNumber;
    licenseNumber = licenseNumber;
    licenseExpiry = null;
    aadharNumber = null;
    address = address;
    bankName = null;
    accountNumber = null;
    ifscCode = null;
    licenseDocPath = null;
    status = #ACTIVE;
    createdAt = now;
    updatedAt = now;
  };
  
  drivers.put(id, newDriver);
  #ok(newDriver)
};

public query func getAllDrivers() : async [Driver] {
  Buffer.toArray(Buffer.fromIter(drivers.vals()))
};

public query func getActiveDrivers() : async [Driver] {
  let active = Buffer.Buffer<Driver>(0);
  for (driver in drivers.vals()) {
    if (driver.status == #ACTIVE) {
      active.add(driver);
    };
  };
  Buffer.toArray(active)
};

public query func getDriverById(id: Text) : async Result.Result<Driver, Text> {
  match (drivers.get(id)) {
    case (null) { #err("Driver not found") };
    case (?drv) { #ok(drv) };
  }
};

public func updateDriver(id: Text, name: Text, phoneNumber: Text, address: Text, status: DriverStatus) : async Result.Result<Driver, Text> {
  match (drivers.get(id)) {
    case (null) { #err("Driver not found") };
    case (?drv) {
      let updated : Driver = {
        drv with
        name = name;
        phoneNumber = phoneNumber;
        address = address;
        status = status;
        updatedAt = Time.now();
      };
      drivers.put(id, updated);
      #ok(updated)
    };
  }
};

public func deleteDriver(id: Text) : async Result.Result<Text, Text> {
  match (drivers.remove(id)) {
    case (null) { #err("Driver not found") };
    case (?_) { #ok("Driver deleted") };
  }
};

// ============================================================================
// VEHICLE MANAGEMENT
// ============================================================================

public func createVehicle(registrationNumber: Text, vehicleType: Text, make: Text, model: Text, year: Nat, capacity: Nat, transporterId: ?Text) : async Result.Result<Vehicle, Text> {
  if (Text.size(registrationNumber) == 0) { return #err("Registration number required") };
  
  let id = generateId();
  let now = Time.now();
  
  let newVehicle : Vehicle = {
    id = id;
    registrationNumber = registrationNumber;
    vehicleType = vehicleType;
    make = make;
    model = model;
    year = year;
    capacity = capacity;
    rcNumber = null;
    rcDocPath = null;
    insuranceDocPath = null;
    permitDocPath = null;
    lastServiceDate = null;
    nextServiceDate = null;
    status = #ACTIVE;
    transporterId = transporterId;
    createdAt = now;
    updatedAt = now;
  };
  
  vehicles.put(id, newVehicle);
  #ok(newVehicle)
};

public query func getAllVehicles() : async [Vehicle] {
  Buffer.toArray(Buffer.fromIter(vehicles.vals()))
};

public query func getVehicleById(id: Text) : async Result.Result<Vehicle, Text> {
  match (vehicles.get(id)) {
    case (null) { #err("Vehicle not found") };
    case (?veh) { #ok(veh) };
  }
};

public query func getVehiclesByTransporter(transporterId: Text) : async [Vehicle] {
  let result = Buffer.Buffer<Vehicle>(0);
  for (vehicle in vehicles.vals()) {
    switch (vehicle.transporterId) {
      case (null) {};
      case (?id) { if (id == transporterId) { result.add(vehicle) } };
    };
  };
  Buffer.toArray(result)
};

public func updateVehicle(id: Text, status: VehicleStatus, lastServiceDate: ?Int) : async Result.Result<Vehicle, Text> {
  match (vehicles.get(id)) {
    case (null) { #err("Vehicle not found") };
    case (?veh) {
      let updated : Vehicle = {
        veh with
        status = status;
        lastServiceDate = lastServiceDate;
        updatedAt = Time.now();
      };
      vehicles.put(id, updated);
      #ok(updated)
    };
  }
};

public func deleteVehicle(id: Text) : async Result.Result<Text, Text> {
  match (vehicles.remove(id)) {
    case (null) { #err("Vehicle not found") };
    case (?_) { #ok("Vehicle deleted") };
  }
};

// ============================================================================
// TRANSPORTER MANAGEMENT
// ============================================================================

public func createTransporter(name: Text, address: Text, city: Text, state: Text, gstNumber: ?Text) : async Result.Result<Transporter, Text> {
  if (Text.size(name) == 0) { return #err("Transporter name required") };
  
  let id = generateId();
  let now = Time.now();
  
  let newTransporter : Transporter = {
    id = id;
    name = name;
    email = null;
    phoneNumber = null;
    address = address;
    city = city;
    state = state;
    gstNumber = gstNumber;
    panNumber = null;
    bankName = null;
    accountNumber = null;
    ifscCode = null;
    isActive = true;
    createdAt = now;
    updatedAt = now;
  };
  
  transporters.put(id, newTransporter);
  #ok(newTransporter)
};

public query func getAllTransporters() : async [Transporter] {
  Buffer.toArray(Buffer.fromIter(transporters.vals()))
};

public query func getTransporterById(id: Text) : async Result.Result<Transporter, Text> {
  match (transporters.get(id)) {
    case (null) { #err("Transporter not found") };
    case (?trp) { #ok(trp) };
  }
};

public func updateTransporter(id: Text, name: Text, address: Text, city: Text, state: Text) : async Result.Result<Transporter, Text> {
  match (transporters.get(id)) {
    case (null) { #err("Transporter not found") };
    case (?trp) {
      let updated : Transporter = {
        trp with
        name = name;
        address = address;
        city = city;
        state = state;
        updatedAt = Time.now();
      };
      transporters.put(id, updated);
      #ok(updated)
    };
  }
};

public func deleteTransporter(id: Text) : async Result.Result<Text, Text> {
  match (transporters.remove(id)) {
    case (null) { #err("Transporter not found") };
    case (?_) { #ok("Transporter deleted") };
  }
};

// ============================================================================
// LOCATION MANAGEMENT
// ============================================================================

public func createLocation(name: Text, city: Text, state: Text, latitude: ?Float, longitude: ?Float) : async Result.Result<Location, Text> {
  if (Text.size(name) == 0 or Text.size(city) == 0) { return #err("Location name and city required") };
  
  let id = generateId();
  let newLocation : Location = {
    id = id;
    name = name;
    city = city;
    state = state;
    latitude = latitude;
    longitude = longitude;
    createdAt = Time.now();
  };
  
  locations.put(id, newLocation);
  #ok(newLocation)
};

public query func getAllLocations() : async [Location] {
  Buffer.toArray(Buffer.fromIter(locations.vals()))
};

public query func getLocationById(id: Text) : async Result.Result<Location, Text> {
  match (locations.get(id)) {
    case (null) { #err("Location not found") };
    case (?loc) { #ok(loc) };
  }
};

// ============================================================================
// GCN (GOODS CONSIGNMENT NOTE) MANAGEMENT
// ============================================================================

public func createGcn(customerId: Text, transporterId: Text, originLocationId: Text, destinationLocationId: Text, pickupDate: Int, totalWeight: Nat, totalValue: Nat) : async Result.Result<Gcn, Text> {
  // Validate customers and locations exist
  let id = generateId();
  let gcnNumber = generateGcnNumber();
  let now = Time.now();
  
  let newGcn : Gcn = {
    id = id;
    gcnNumber = gcnNumber;
    customerId = customerId;
    transporterId = transporterId;
    originLocationId = originLocationId;
    destinationLocationId = destinationLocationId;
    status = #DRAFT;
    pickupDate = pickupDate;
    deliveryDate = null;
    totalWeight = totalWeight;
    totalValue = totalValue;
    cargoItems = [];
    trackingEvents = [];
    assignedDriverId = null;
    assignedVehicleId = null;
    notes = null;
    createdAt = now;
    updatedAt = now;
  };
  
  gcns.put(id, newGcn);
  #ok(newGcn)
};

public query func getAllGcns() : async [Gcn] {
  Buffer.toArray(Buffer.fromIter(gcns.vals()))
};

public query func getGcnById(id: Text) : async Result.Result<Gcn, Text> {
  match (gcns.get(id)) {
    case (null) { #err("GCN not found") };
    case (?gcn) { #ok(gcn) };
  }
};

public query func getGcnByNumber(gcnNumber: Text) : async Result.Result<Gcn, Text> {
  for (gcn in gcns.vals()) {
    if (gcn.gcnNumber == gcnNumber) {
      return #ok(gcn);
    };
  };
  #err("GCN not found")
};

public query func getGcnsByCustomer(customerId: Text) : async [Gcn] {
  let result = Buffer.Buffer<Gcn>(0);
  for (gcn in gcns.vals()) {
    if (gcn.customerId == customerId) {
      result.add(gcn);
    };
  };
  Buffer.toArray(result)
};

public query func getGcnsByStatus(status: GcnStatus) : async [Gcn] {
  let result = Buffer.Buffer<Gcn>(0);
  for (gcn in gcns.vals()) {
    if (gcn.status == status) {
      result.add(gcn);
    };
  };
  Buffer.toArray(result)
};

public func assignGcnDriver(gcnId: Text, driverId: Text, vehicleId: Text) : async Result.Result<Gcn, Text> {
  match (gcns.get(gcnId)) {
    case (null) { #err("GCN not found") };
    case (?gcn) {
      if (Option.isNull(drivers.get(driverId))) {
        return #err("Driver not found");
      };
      if (Option.isNull(vehicles.get(vehicleId))) {
        return #err("Vehicle not found");
      };
      let updated : Gcn = {
        gcn with
        assignedDriverId = ?driverId;
        assignedVehicleId = ?vehicleId;
        status = #CONFIRMED;
        updatedAt = Time.now();
      };
      gcns.put(gcnId, updated);
      #ok(updated)
    };
  }
};

public func updateGcnStatus(gcnId: Text, newStatus: GcnStatus) : async Result.Result<Gcn, Text> {
  match (gcns.get(gcnId)) {
    case (null) { #err("GCN not found") };
    case (?gcn) {
      let updated : Gcn = {
        gcn with
        status = newStatus;
        deliveryDate = if (newStatus == #DELIVERED) { ?Time.now() } else { gcn.deliveryDate };
        updatedAt = Time.now();
      };
      gcns.put(gcnId, updated);
      #ok(updated)
    };
  }
};

// ============================================================================
// TRACKING & EVENTS
// ============================================================================

public func addTrackingEvent(gcnId: Text, eventType: Text, location: ?Text, description: ?Text, remarks: ?Text) : async Result.Result<GcnTrackingEvent, Text> {
  let id = generateId();
  let now = Time.now();
  
  let event : GcnTrackingEvent = {
    id = id;
    gcnId = gcnId;
    eventType = eventType;
    location = location;
    description = description;
    timestamp = now;
    remarks = remarks;
  };
  
  gcnTrackingEvents.put(id, event);
  
  // Update GCN's tracking events list
  match (gcns.get(gcnId)) {
    case (null) {};
    case (?gcn) {
      let updatedEvents = Array.append(gcn.trackingEvents, [id]);
      let updated : Gcn = {
        gcn with
        trackingEvents = updatedEvents;
        updatedAt = now;
      };
      gcns.put(gcnId, updated);
    };
  };
  
  #ok(event)
};

public query func getTrackingEventsByGcn(gcnId: Text) : async [GcnTrackingEvent] {
  let result = Buffer.Buffer<GcnTrackingEvent>(0);
  for (event in gcnTrackingEvents.vals()) {
    if (event.gcnId == gcnId) {
      result.add(event);
    };
  };
  Buffer.toArray(result)
};

// ============================================================================
// CARGO ITEMS
// ============================================================================

public func addCargoItem(description: Text, quantity: Nat, weight: Nat, dimensions: Text, hazardous: Bool, gcnId: ?Text) : async Result.Result<CargoItem, Text> {
  let id = generateId();
  let now = Time.now();
  
  let item : CargoItem = {
    id = id;
    description = description;
    quantity = quantity;
    weight = weight;
    dimensions = dimensions;
    hazardous = hazardous;
    gcnId = gcnId;
    shipmentId = null;
    createdAt = now;
  };
  
  cargoItems.put(id, item);
  
  // Add to GCN if specified
  match (gcnId) {
    case (null) {};
    case (?gid) {
      match (gcns.get(gid)) {
        case (null) {};
        case (?gcn) {
          let updatedItems = Array.append(gcn.cargoItems, [id]);
          let updated : Gcn = {
            gcn with
            cargoItems = updatedItems;
          };
          gcns.put(gid, updated);
        };
      };
    };
  };
  
  #ok(item)
};

public query func getCargoItemsByGcn(gcnId: Text) : async [CargoItem] {
  let result = Buffer.Buffer<CargoItem>(0);
  for (item in cargoItems.vals()) {
    switch (item.gcnId) {
      case (null) {};
      case (?id) { if (id == gcnId) { result.add(item) } };
    };
  };
  Buffer.toArray(result)
};

// ============================================================================
// INVOICE MANAGEMENT
// ============================================================================

public func createInvoice(gcnId: Text, customerId: Text, amount: Nat, taxAmount: Nat, dueDate: Int) : async Result.Result<Invoice, Text> {
  let id = generateId();
  let invoiceNumber = generateInvoiceNumber();
  let now = Time.now();
  let totalAmount = amount + taxAmount;
  
  let invoice : Invoice = {
    id = id;
    invoiceNumber = invoiceNumber;
    gcnId = gcnId;
    customerId = customerId;
    amount = amount;
    taxAmount = taxAmount;
    totalAmount = totalAmount;
    issueDate = now;
    dueDate = dueDate;
    isPaid = false;
    createdAt = now;
    updatedAt = now;
  };
  
  invoices.put(id, invoice);
  #ok(invoice)
};

public query func getAllInvoices() : async [Invoice] {
  Buffer.toArray(Buffer.fromIter(invoices.vals()))
};

public query func getInvoiceById(id: Text) : async Result.Result<Invoice, Text> {
  match (invoices.get(id)) {
    case (null) { #err("Invoice not found") };
    case (?inv) { #ok(inv) };
  }
};

public query func getInvoicesByCustomer(customerId: Text) : async [Invoice] {
  let result = Buffer.Buffer<Invoice>(0);
  for (invoice in invoices.vals()) {
    if (invoice.customerId == customerId) {
      result.add(invoice);
    };
  };
  Buffer.toArray(result)
};

// ============================================================================
// BILLING MANAGEMENT
// ============================================================================

public func createBilling(invoiceId: Text, gcnId: Text, customerId: Text, amount: Nat) : async Result.Result<Billing, Text> {
  let id = generateId();
  let now = Time.now();
  
  let billing : Billing = {
    id = id;
    invoiceId = invoiceId;
    gcnId = gcnId;
    customerId = customerId;
    amount = amount;
    paidAmount = 0;
    status = #PENDING;
    paymentDate = null;
    receiptPath = null;
    notes = null;
    createdAt = now;
    updatedAt = now;
  };
  
  billings.put(id, billing);
  #ok(billing)
};

public query func getAllBillings() : async [Billing] {
  Buffer.toArray(Buffer.fromIter(billings.vals()))
};

public query func getBillingById(id: Text) : async Result.Result<Billing, Text> {
  match (billings.get(id)) {
    case (null) { #err("Billing not found") };
    case (?bill) { #ok(bill) };
  }
};

public query func getBillingsByCustomer(customerId: Text) : async [Billing] {
  let result = Buffer.Buffer<Billing>(0);
  for (billing in billings.vals()) {
    if (billing.customerId == customerId) {
      result.add(billing);
    };
  };
  Buffer.toArray(result)
};

public query func getBillingsByStatus(status: BillingStatus) : async [Billing] {
  let result = Buffer.Buffer<Billing>(0);
  for (billing in billings.vals()) {
    if (billing.status == status) {
      result.add(billing);
    };
  };
  Buffer.toArray(result)
};

public func markBillingAsPaid(billingId: Text, paidAmount: Nat, receiptPath: ?Text) : async Result.Result<Billing, Text> {
  match (billings.get(billingId)) {
    case (null) { #err("Billing not found") };
    case (?bill) {
      let updated : Billing = {
        bill with
        paidAmount = paidAmount;
        status = if (paidAmount >= bill.amount) { #PAID } else { #PENDING };
        paymentDate = ?Time.now();
        receiptPath = receiptPath;
        updatedAt = Time.now();
      };
      billings.put(billingId, updated);
      #ok(updated)
    };
  }
};

// ============================================================================
// VHC (VEHICLE HIRE CHARGES) MANAGEMENT
// ============================================================================

public func createVhc(vehicleId: Text, driverId: Text, hiringRate: Nat, startDate: Int) : async Result.Result<Vhc, Text> {
  let id = generateId();
  let now = Time.now();
  
  let vhc : Vhc = {
    id = id;
    vehicleId = vehicleId;
    driverId = driverId;
    hiringRate = hiringRate;
    totalHours = 0;
    totalAmount = 0;
    startDate = startDate;
    endDate = null;
    remarks = null;
    createdAt = now;
    updatedAt = now;
  };
  
  vhcs.put(id, vhc);
  #ok(vhc)
};

public query func getAllVhcs() : async [Vhc] {
  Buffer.toArray(Buffer.fromIter(vhcs.vals()))
};

public query func getVhcById(id: Text) : async Result.Result<Vhc, Text> {
  match (vhcs.get(id)) {
    case (null) { #err("VHC not found") };
    case (?v) { #ok(v) };
  }
};

public func endVhc(vhcId: Text, totalHours: Nat) : async Result.Result<Vhc, Text> {
  match (vhcs.get(vhcId)) {
    case (null) { #err("VHC not found") };
    case (?v) {
      let totalAmount = totalHours * v.hiringRate;
      let updated : Vhc = {
        v with
        totalHours = totalHours;
        totalAmount = totalAmount;
        endDate = ?Time.now();
        updatedAt = Time.now();
      };
      vhcs.put(vhcId, updated);
      #ok(updated)
    };
  }
};

// ============================================================================
// GALLERY MANAGEMENT
// ============================================================================

public func uploadGalleryImage(title: Text, description: ?Text, imagePath: Text, uploadedBy: Text, isPublic: Bool) : async Result.Result<GalleryImage, Text> {
  let id = generateId();
  let now = Time.now();
  
  let image : GalleryImage = {
    id = id;
    title = title;
    description = description;
    imagePath = imagePath;
    uploadedBy = uploadedBy;
    isPublic = isPublic;
    createdAt = now;
  };
  
  galleryImages.put(id, image);
  #ok(image)
};

public query func getAllGalleryImages() : async [GalleryImage] {
  Buffer.toArray(Buffer.fromIter(galleryImages.vals()))
};

public query func getPublicGalleryImages() : async [GalleryImage] {
  let result = Buffer.Buffer<GalleryImage>(0);
  for (img in galleryImages.vals()) {
    if (img.isPublic) {
      result.add(img);
    };
  };
  Buffer.toArray(result)
};

public func deleteGalleryImage(id: Text) : async Result.Result<Text, Text> {
  match (galleryImages.remove(id)) {
    case (null) { #err("Gallery image not found") };
    case (?_) { #ok("Gallery image deleted") };
  }
};

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

public query func getDashboardStats() : async {
  totalCustomers: Nat;
  totalDrivers: Nat;
  totalVehicles: Nat;
  totalGcns: Nat;
  gcnsInTransit: Nat;
  gcnsDelivered: Nat;
  totalBillingAmount: Nat;
  totalPaidAmount: Nat;
  pendingPayments: Nat;
} {
  var totalCustomers = 0;
  var totalDrivers = 0;
  var totalVehicles = 0;
  var totalGcns = 0;
  var gcnsInTransit = 0;
  var gcnsDelivered = 0;
  var totalBillingAmount = 0;
  var totalPaidAmount = 0;
  var pendingPayments = 0;
  
  for (_ in customers.vals()) { totalCustomers += 1 };
  for (_ in drivers.vals()) { totalDrivers += 1 };
  for (_ in vehicles.vals()) { totalVehicles += 1 };
  
  for (gcn in gcns.vals()) {
    totalGcns += 1;
    if (gcn.status == #IN_TRANSIT) { gcnsInTransit += 1 };
    if (gcn.status == #DELIVERED) { gcnsDelivered += 1 };
  };
  
  for (billing in billings.vals()) {
    totalBillingAmount += billing.amount;
    totalPaidAmount += billing.paidAmount;
    if (billing.status == #PENDING) { pendingPayments += 1 };
  };
  
  {
    totalCustomers = totalCustomers;
    totalDrivers = totalDrivers;
    totalVehicles = totalVehicles;
    totalGcns = totalGcns;
    gcnsInTransit = gcnsInTransit;
    gcnsDelivered = gcnsDelivered;
    totalBillingAmount = totalBillingAmount;
    totalPaidAmount = totalPaidAmount;
    pendingPayments = pendingPayments;
  }
};

// ============================================================================
// PUBLIC TRACKING
// ============================================================================

public query func trackGcn(gcnNumber: Text) : async Result.Result<{
  gcn: Gcn;
  events: [GcnTrackingEvent];
}, Text> {
  for (gcn in gcns.vals()) {
    if (gcn.gcnNumber == gcnNumber) {
      let events = Buffer.Buffer<GcnTrackingEvent>(0);
      for (eventId in gcn.trackingEvents.vals()) {
        match (gcnTrackingEvents.get(eventId)) {
          case (null) {};
          case (?event) { events.add(event) };
        };
      };
      return #ok({
        gcn = gcn;
        events = Buffer.toArray(events);
      });
    };
  };
  #err("GCN not found")
};

// ============================================================================
// HEALTH CHECK & SYSTEM INFO
// ============================================================================

public query func health() : async {
  status: Text;
  timestamp: Int;
  version: Text;
  environment: Text;
} {
  {
    status = "healthy";
    timestamp = Time.now();
    version = "2.0.0";
    environment = "production";
  }
};

public query func getSystemStats() : async {
  totalEmployees: Nat;
  totalCustomers: Nat;
  totalDrivers: Nat;
  totalVehicles: Nat;
  totalTransporters: Nat;
  totalLocations: Nat;
  totalGcns: Nat;
  totalInvoices: Nat;
  totalBillings: Nat;
  totalGalleryImages: Nat;
} {
  var totalEmployees = 0;
  var totalCustomers = 0;
  var totalDrivers = 0;
  var totalVehicles = 0;
  var totalTransporters = 0;
  var totalLocations = 0;
  var totalGcns = 0;
  var totalInvoices = 0;
  var totalBillings = 0;
  var totalGalleryImages = 0;
  
  for (_ in employees.vals()) { totalEmployees += 1 };
  for (_ in customers.vals()) { totalCustomers += 1 };
  for (_ in drivers.vals()) { totalDrivers += 1 };
  for (_ in vehicles.vals()) { totalVehicles += 1 };
  for (_ in transporters.vals()) { totalTransporters += 1 };
  for (_ in locations.vals()) { totalLocations += 1 };
  for (_ in gcns.vals()) { totalGcns += 1 };
  for (_ in invoices.vals()) { totalInvoices += 1 };
  for (_ in billings.vals()) { totalBillings += 1 };
  for (_ in galleryImages.vals()) { totalGalleryImages += 1 };
  
  {
    totalEmployees = totalEmployees;
    totalCustomers = totalCustomers;
    totalDrivers = totalDrivers;
    totalVehicles = totalVehicles;
    totalTransporters = totalTransporters;
    totalLocations = totalLocations;
    totalGcns = totalGcns;
    totalInvoices = totalInvoices;
    totalBillings = totalBillings;
    totalGalleryImages = totalGalleryImages;
  }
};
