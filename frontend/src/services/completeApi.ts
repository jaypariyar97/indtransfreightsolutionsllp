import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/freight_backend';

let agent: HttpAgent;
let actor: any;

export const initializeMotokoConnection = async () => {
  const isLocalNetwork = process.env.REACT_APP_NETWORK === 'local';
  
  agent = new HttpAgent({
    host: isLocalNetwork 
      ? 'http://localhost:4943'
      : 'https://icp0.io',
  });

  if (isLocalNetwork) {
    await agent.fetchRootKey();
  }

  actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: process.env.REACT_APP_CANISTER_ID || '',
  });

  return actor;
};

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const authService = {
  authenticate: async (username: string, password: string) => {
    try {
      const result = await actor.authenticateEmployee(username, password);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  registerEmployee: async (username: string, email: string, password: string, fullName: string, role: string) => {
    try {
      const roleObj = { [role]: null };
      const result = await actor.registerEmployee(username, email, password, fullName, roleObj);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  changePassword: async (employeeId: string, currentPassword: string, newPassword: string) => {
    try {
      const result = await actor.changePassword(employeeId, currentPassword, newPassword);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
};

// ============================================================================
// EMPLOYEE/USER SERVICE
// ============================================================================

export const employeeService = {
  getAllEmployees: async () => {
    try {
      return await actor.getAllEmployees();
    } catch (error) {
      console.error('Get all employees error:', error);
      throw error;
    }
  },

  getEmployeeById: async (id: string) => {
    try {
      const result = await actor.getEmployeeById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Get employee error:', error);
      throw error;
    }
  },

  updateEmployee: async (id: string, fullName: string, phoneNumber: string | null, isActive: boolean) => {
    try {
      const result = await actor.updateEmployee(id, fullName, phoneNumber ? [phoneNumber] : [], isActive);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Update employee error:', error);
      throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    try {
      const result = await actor.deleteEmployee(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Delete employee error:', error);
      throw error;
    }
  },
};

// ============================================================================
// CUSTOMER SERVICE
// ============================================================================

export const customerService = {
  getAllCustomers: async () => {
    try {
      return await actor.getAllCustomers();
    } catch (error) {
      console.error('Get all customers error:', error);
      throw error;
    }
  },

  getCustomerById: async (id: string) => {
    try {
      const result = await actor.getCustomerById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Get customer error:', error);
      throw error;
    }
  },

  createCustomer: async (name: string, address: string, city: string, state: string, gstNumber?: string) => {
    try {
      const result = await actor.createCustomer(name, address, city, state, gstNumber ? [gstNumber] : [], null);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Create customer error:', error);
      throw error;
    }
  },

  updateCustomer: async (id: string, name: string, address: string, city: string, state: string) => {
    try {
      const result = await actor.updateCustomer(id, name, address, city, state, null);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Update customer error:', error);
      throw error;
    }
  },

  deleteCustomer: async (id: string) => {
    try {
      const result = await actor.deleteCustomer(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      throw error;
    }
  },
};

// ============================================================================
// DRIVER SERVICE
// ============================================================================

export const driverService = {
  getAllDrivers: async () => {
    try {
      return await actor.getAllDrivers();
    } catch (error) {
      console.error('Get all drivers error:', error);
      throw error;
    }
  },

  getActiveDrivers: async () => {
    try {
      return await actor.getActiveDrivers();
    } catch (error) {
      console.error('Get active drivers error:', error);
      throw error;
    }
  },

  getDriverById: async (id: string) => {
    try {
      const result = await actor.getDriverById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Get driver error:', error);
      throw error;
    }
  },

  createDriver: async (name: string, phoneNumber: string, licenseNumber: string, address: string) => {
    try {
      const result = await actor.createDriver(name, phoneNumber, licenseNumber, address);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Create driver error:', error);
      throw error;
    }
  },

  updateDriver: async (id: string, name: string, phoneNumber: string, address: string, status: string) => {
    try {
      const statusObj = { [status]: null };
      const result = await actor.updateDriver(id, name, phoneNumber, address, statusObj);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Update driver error:', error);
      throw error;
    }
  },

  deleteDriver: async (id: string) => {
    try {
      const result = await actor.deleteDriver(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Delete driver error:', error);
      throw error;
    }
  },
};

// ============================================================================
// VEHICLE SERVICE
// ============================================================================

export const vehicleService = {
  getAllVehicles: async () => {
    try {
      return await actor.getAllVehicles();
    } catch (error) {
      console.error('Get all vehicles error:', error);
      throw error;
    }
  },

  getVehicleById: async (id: string) => {
    try {
      const result = await actor.getVehicleById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Get vehicle error:', error);
      throw error;
    }
  },

  createVehicle: async (regNumber: string, type: string, make: string, model: string, year: number, capacity: number, transporterId?: string) => {
    try {
      const result = await actor.createVehicle(regNumber, type, make, model, year, capacity, transporterId ? [transporterId] : []);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Create vehicle error:', error);
      throw error;
    }
  },

  updateVehicle: async (id: string, status: string) => {
    try {
      const statusObj = { [status]: null };
      const result = await actor.updateVehicle(id, statusObj, null);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Update vehicle error:', error);
      throw error;
    }
  },

  deleteVehicle: async (id: string) => {
    try {
      const result = await actor.deleteVehicle(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Delete vehicle error:', error);
      throw error;
    }
  },
};

// ============================================================================
// GCN (GOODS CONSIGNMENT NOTE) SERVICE
// ============================================================================

export const gcnService = {
  getAllGcns: async () => {
    try {
      return await actor.getAllGcns();
    } catch (error) {
      console.error('Get all GCNs error:', error);
      throw error;
    }
  },

  getGcnById: async (id: string) => {
    try {
      const result = await actor.getGcnById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Get GCN error:', error);
      throw error;
    }
  },

  getGcnByNumber: async (gcnNumber: string) => {
    try {
      const result = await actor.getGcnByNumber(gcnNumber);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Get GCN by number error:', error);
      throw error;
    }
  },

  getGcnsByCustomer: async (customerId: string) => {
    try {
      return await actor.getGcnsByCustomer(customerId);
    } catch (error) {
      console.error('Get GCNs by customer error:', error);
      throw error;
    }
  },

  getGcnsByStatus: async (status: string) => {
    try {
      const statusObj = { [status]: null };
      return await actor.getGcnsByStatus(statusObj);
    } catch (error) {
      console.error('Get GCNs by status error:', error);
      throw error;
    }
  },

  createGcn: async (customerId: string, transporterId: string, originId: string, destinationId: string, pickupDate: number, totalWeight: number, totalValue: number) => {
    try {
      const result = await actor.createGcn(customerId, transporterId, originId, destinationId, pickupDate, totalWeight, totalValue);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Create GCN error:', error);
      throw error;
    }
  },

  assignDriver: async (gcnId: string, driverId: string, vehicleId: string) => {
    try {
      const result = await actor.assignGcnDriver(gcnId, driverId, vehicleId);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Assign driver error:', error);
      throw error;
    }
  },

  updateStatus: async (gcnId: string, status: string) => {
    try {
      const statusObj = { [status]: null };
      const result = await actor.updateGcnStatus(gcnId, statusObj);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Update GCN status error:', error);
      throw error;
    }
  },

  addCargoItem: async (description: string, quantity: number, weight: number, dimensions: string, hazardous: boolean, gcnId: string) => {
    try {
      const result = await actor.addCargoItem(description, quantity, weight, dimensions, hazardous, [gcnId]);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Add cargo item error:', error);
      throw error;
    }
  },
};

// ============================================================================
// TRACKING SERVICE
// ============================================================================

export const trackingService = {
  trackGcn: async (gcnNumber: string) => {
    try {
      const result = await actor.trackGcn(gcnNumber);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Track GCN error:', error);
      throw error;
    }
  },

  addTrackingEvent: async (gcnId: string, eventType: string, location?: string, description?: string) => {
    try {
      const result = await actor.addTrackingEvent(gcnId, eventType, location ? [location] : [], description ? [description] : [], null);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Add tracking event error:', error);
      throw error;
    }
  },

  getTrackingEvents: async (gcnId: string) => {
    try {
      return await actor.getTrackingEventsByGcn(gcnId);
    } catch (error) {
      console.error('Get tracking events error:', error);
      throw error;
    }
  },
};

// ============================================================================
// BILLING SERVICE
// ============================================================================

export const billingService = {
  getAllBillings: async () => {
    try {
      return await actor.getAllBillings();
    } catch (error) {
      console.error('Get all billings error:', error);
      throw error;
    }
  },

  getBillingById: async (id: string) => {
    try {
      const result = await actor.getBillingById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Get billing error:', error);
      throw error;
    }
  },

  getBillingsByCustomer: async (customerId: string) => {
    try {
      return await actor.getBillingsByCustomer(customerId);
    } catch (error) {
      console.error('Get billings by customer error:', error);
      throw error;
    }
  },

  getBillingsByStatus: async (status: string) => {
    try {
      const statusObj = { [status]: null };
      return await actor.getBillingsByStatus(statusObj);
    } catch (error) {
      console.error('Get billings by status error:', error);
      throw error;
    }
  },

  createBilling: async (invoiceId: string, gcnId: string, customerId: string, amount: number) => {
    try {
      const result = await actor.createBilling(invoiceId, gcnId, customerId, amount);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Create billing error:', error);
      throw error;
    }
  },

  markAsPaid: async (billingId: string, paidAmount: number, receiptPath?: string) => {
    try {
      const result = await actor.markBillingAsPaid(billingId, paidAmount, receiptPath ? [receiptPath] : []);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Mark billing as paid error:', error);
      throw error;
    }
  },
};

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export const dashboardService = {
  getStats: async () => {
    try {
      return await actor.getDashboardStats();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },

  getSystemStats: async () => {
    try {
      return await actor.getSystemStats();
    } catch (error) {
      console.error('Get system stats error:', error);
      throw error;
    }
  },
};

export default {
  initializeMotokoConnection,
  authService,
  employeeService,
  customerService,
  driverService,
  vehicleService,
  gcnService,
  trackingService,
  billingService,
  dashboardService,
};
