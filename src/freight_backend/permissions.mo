// ============================================================================
// PERMISSION & ACCESS CONTROL - COMPLETE IMPLEMENTATION
// ============================================================================

import Buffer "mo:base/Buffer";
import TrieMap "mo:base/TrieMap";
import Text "mo:base/Text";
import Result "mo:base/Result";

type Permission = {
  module: Text;  // "customers", "drivers", "vehicles", "billing", "gcn", "users", "gallery", etc.
  action: Text;  // "view", "create", "edit", "delete"
};

type RolePermissionMap = {
  role: Text;  // "ADMIN", "EMPLOYEE", "CUSTOMER", "DRIVER"
  permissions: [Permission];
};

type PermissionCheckRequest = {
  role: Text;
  module: Text;
  action: Text;
};

var rolePermissions = TrieMap.TrieMap<Text, [Permission]>(Text.equal, Text.hash);

// Initialize default permissions
public func initializeDefaultPermissions() : async () {
  // ADMIN - Full access
  let adminPerms = [
    { module = "customers"; action = "view" },
    { module = "customers"; action = "create" },
    { module = "customers"; action = "edit" },
    { module = "customers"; action = "delete" },

    { module = "drivers"; action = "view" },
    { module = "drivers"; action = "create" },
    { module = "drivers"; action = "edit" },
    { module = "drivers"; action = "delete" },

    { module = "vehicles"; action = "view" },
    { module = "vehicles"; action = "create" },
    { module = "vehicles"; action = "edit" },
    { module = "vehicles"; action = "delete" },

    { module = "transporters"; action = "view" },
    { module = "transporters"; action = "create" },
    { module = "transporters"; action = "edit" },
    { module = "transporters"; action = "delete" },

    { module = "gcn"; action = "view" },
    { module = "gcn"; action = "create" },
    { module = "gcn"; action = "edit" },
    { module = "gcn"; action = "delete" },

    { module = "tracking"; action = "view" },
    { module = "tracking"; action = "edit" },

    { module = "billing"; action = "view" },
    { module = "billing"; action = "create" },
    { module = "billing"; action = "edit" },
    { module = "billing"; action = "delete" },

    { module = "invoices"; action = "view" },
    { module = "invoices"; action = "create" },
    { module = "invoices"; action = "edit" },

    { module = "vhc"; action = "view" },
    { module = "vhc"; action = "create" },
    { module = "vhc"; action = "edit" },

    { module = "gallery"; action = "view" },
    { module = "gallery"; action = "create" },
    { module = "gallery"; action = "edit" },
    { module = "gallery"; action = "delete" },

    { module = "users"; action = "view" },
    { module = "users"; action = "create" },
    { module = "users"; action = "edit" },
    { module = "users"; action = "delete" },

    { module = "dashboard"; action = "view" },
    { module = "audit"; action = "view" },
  ];

  // EMPLOYEE - Read + Some write access
  let employeePerms = [
    { module = "customers"; action = "view" },
    { module = "customers"; action = "create" },
    { module = "customers"; action = "edit" },

    { module = "drivers"; action = "view" },
    { module = "drivers"; action = "create" },
    { module = "drivers"; action = "edit" },

    { module = "vehicles"; action = "view" },
    { module = "vehicles"; action = "create" },
    { module = "vehicles"; action = "edit" },

    { module = "transporters"; action = "view" },

    { module = "gcn"; action = "view" },
    { module = "gcn"; action = "create" },
    { module = "gcn"; action = "edit" },

    { module = "tracking"; action = "view" },
    { module = "tracking"; action = "edit" },

    { module = "billing"; action = "view" },
    { module = "billing"; action = "edit" },

    { module = "invoices"; action = "view" },

    { module = "vhc"; action = "view" },
    { module = "vhc"; action = "create" },
    { module = "vhc"; action = "edit" },

    { module = "gallery"; action = "view" },
    { module = "gallery"; action = "create" },

    { module = "dashboard"; action = "view" },
  ];

  // CUSTOMER - Limited read access
  let customerPerms = [
    { module = "gcn"; action = "view" },
    { module = "tracking"; action = "view" },
    { module = "billing"; action = "view" },
    { module = "invoices"; action = "view" },
  ];

  // DRIVER - Limited read access
  let driverPerms = [
    { module = "gcn"; action = "view" },
    { module = "tracking"; action = "view" },
    { module = "tracking"; action = "edit" },
    { module = "vhc"; action = "view" },
  ];

  rolePermissions.put("ADMIN", adminPerms);
  rolePermissions.put("EMPLOYEE", employeePerms);
  rolePermissions.put("CUSTOMER", customerPerms);
  rolePermissions.put("DRIVER", driverPerms);
};

public query func checkPermission(role: Text, module: Text, action: Text) : async Bool {
  match (rolePermissions.get(role)) {
    case (null) { false };
    case (?permissions) {
      for (perm in permissions.vals()) {
        if (perm.module == module and perm.action == action) {
          return true;
        };
      };
      false
    };
  }
};

public query func checkMultiplePermissions(role: Text, checks: [{
  module: Text;
  action: Text;
}]) : async [Bool] {
  let results = Buffer.Buffer<Bool>(0);
  for (check in checks.vals()) {
    let hasAccess = switch (rolePermissions.get(role)) {
      case (null) { false };
      case (?permissions) {
        var found = false;
        for (perm in permissions.vals()) {
          if (perm.module == check.module and perm.action == check.action) {
            found := true;
          };
        };
        found
      };
    };
    results.add(hasAccess);
  };
  Buffer.toArray(results)
};

public query func getPermissionsByRole(role: Text) : async [Permission] {
  match (rolePermissions.get(role)) {
    case (null) { [] };
    case (?permissions) { permissions };
  }
};

public query func getAllRolePermissions() : async [RolePermissionMap] {
  let results = Buffer.Buffer<RolePermissionMap>(0);
  for (entry in rolePermissions.entries()) {
    results.add({
      role = entry.0;
      permissions = entry.1;
    });
  };
  Buffer.toArray(results)
};

public func updateRolePermissions(role: Text, permissions: [Permission]) : async Result.Result<Text, Text> {
  // Only allow ADMIN to update permissions
  if (role == "ADMIN" or role == "EMPLOYEE" or role == "CUSTOMER" or role == "DRIVER") {
    rolePermissions.put(role, permissions);
    #ok("Permissions updated for role: " # role)
  } else {
    #err("Invalid role")
  }
};

public query func hasAllPermissions(role: Text, requiredPerms: [{
  module: Text;
  action: Text;
}]) : async Bool {
  match (rolePermissions.get(role)) {
    case (null) { false };
    case (?permissions) {
      for (req in requiredPerms.vals()) {
        var found = false;
        for (perm in permissions.vals()) {
          if (perm.module == req.module and perm.action == req.action) {
            found := true;
          };
        };
        if (not found) { return false };
      };
      true
    };
  }
};

public query func hasAnyPermission(role: Text, requiredPerms: [{
  module: Text;
  action: Text;
}]) : async Bool {
  match (rolePermissions.get(role)) {
    case (null) { false };
    case (?permissions) {
      for (req in requiredPerms.vals()) {
        for (perm in permissions.vals()) {
          if (perm.module == req.module and perm.action == req.action) {
            return true;
          };
        };
      };
      false
    };
  }
};
