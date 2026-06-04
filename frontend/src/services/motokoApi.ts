import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/freight_backend';

let agent: HttpAgent;
let actor: any;

// Initialize connection to Motoko backend
export const initializeMotokoConnection = async () => {
  const isLocalNetwork = process.env.REACT_APP_NETWORK === 'local';
  
  agent = new HttpAgent({
    host: isLocalNetwork 
      ? 'http://localhost:4943'
      : 'https://icp0.io',
  });

  // Fetch root key for local development
  if (isLocalNetwork) {
    await agent.fetchRootKey();
  }

  actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: process.env.REACT_APP_CANISTER_ID || '',
  });

  return actor;
};

// Shipment API calls
export const shipmentApi = {
  getAll: async () => {
    try {
      return await actor.getAllShipments();
    } catch (error) {
      console.error('Error fetching shipments:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const result = await actor.getShipmentById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error fetching shipment:', error);
      throw error;
    }
  },

  getByStatus: async (status: string) => {
    try {
      const statusObj = { [status]: null };
      return await actor.getShipmentsByStatus(statusObj);
    } catch (error) {
      console.error('Error fetching shipments by status:', error);
      throw error;
    }
  },

  getByDriver: async (driverId: string) => {
    try {
      return await actor.getShipmentsByDriver(driverId);
    } catch (error) {
      console.error('Error fetching driver shipments:', error);
      throw error;
    }
  },

  create: async (data: {
    origin: string;
    destination: string;
    weight: number;
  }) => {
    try {
      const result = await actor.createShipment(data);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      throw error;
    }
  },

  update: async (id: string, data: {
    status: string;
    estimatedDelivery?: number;
  }) => {
    try {
      const statusObj = { [data.status]: null };
      const updateData = {
        status: statusObj,
        estimatedDelivery: data.estimatedDelivery ? [data.estimatedDelivery] : [],
      };
      const result = await actor.updateShipment(id, updateData);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating shipment:', error);
      throw error;
    }
  },

  assignDriver: async (shipmentId: string, driverId: string) => {
    try {
      const result = await actor.assignDriver(shipmentId, driverId);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const result = await actor.deleteShipment(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error deleting shipment:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      return await actor.getShipmentStats();
    } catch (error) {
      console.error('Error fetching shipment stats:', error);
      throw error;
    }
  },
};

// Driver API calls
export const driverApi = {
  getAll: async () => {
    try {
      return await actor.getAllDrivers();
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const result = await actor.getDriverById(id);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error fetching driver:', error);
      throw error;
    }
  },

  getActive: async () => {
    try {
      return await actor.getActiveDrivers();
    } catch (error) {
      console.error('Error fetching active drivers:', error);
      throw error;
    }
  },

  create: async (data: {
    name: string;
    email: string;
    licenseNumber: string;
  }) => {
    try {
      const result = await actor.createDriver(data.name, data.email, data.licenseNumber);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  },

  updateStatus: async (driverId: string, newStatus: string) => {
    try {
      const statusObj = { [newStatus]: null };
      const result = await actor.updateDriverStatus(driverId, statusObj);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      return await actor.getDriverStats();
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      throw error;
    }
  },
};

// Auth API calls
export const authApi = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) => {
    try {
      const roleObj = { [data.role]: null };
      const result = await actor.registerUser(
        data.username,
        data.email,
        data.password,
        roleObj
      );
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  authenticate: async (username: string, password: string) => {
    try {
      const result = await actor.authenticateUser(username, password);
      if ('ok' in result) {
        return result.ok;
      } else {
        throw new Error(result.err);
      }
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  },

  health: async () => {
    try {
      return await actor.health();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  },
};

export default {
  initializeMotokoConnection,
  shipmentApi,
  driverApi,
  authApi,
};
