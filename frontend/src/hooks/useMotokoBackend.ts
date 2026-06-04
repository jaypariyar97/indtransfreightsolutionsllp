import { useEffect, useState } from 'react';
import { shipmentApi, driverApi, authApi, initializeMotokoConnection } from '../services/motokoApi';

interface UseBackendReturn {
  shipments: any[];
  drivers: any[];
  loading: boolean;
  error: string | null;
  createShipment: (data: any) => Promise<void>;
  updateShipment: (id: string, data: any) => Promise<void>;
  deleteShipment: (id: string) => Promise<void>;
  assignDriver: (shipmentId: string, driverId: string) => Promise<void>;
  createDriver: (data: any) => Promise<void>;
  getShipmentStats: () => Promise<any>;
  getDriverStats: () => Promise<any>;
  authenticateUser: (username: string, password: string) => Promise<any>;
  refetch: () => Promise<void>;
}

export const useMotokoBackend = (): UseBackendReturn => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Motoko connection on mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await initializeMotokoConnection();
        await fetchShipments();
        await fetchDrivers();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize connection');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const fetchShipments = async () => {
    try {
      const data = await shipmentApi.getAll();
      setShipments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shipments');
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await driverApi.getAll();
      setDrivers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drivers');
    }
  };

  const createShipment = async (data: any) => {
    try {
      await shipmentApi.create(data);
      await fetchShipments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment');
      throw err;
    }
  };

  const updateShipment = async (id: string, data: any) => {
    try {
      await shipmentApi.update(id, data);
      await fetchShipments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipment');
      throw err;
    }
  };

  const deleteShipment = async (id: string) => {
    try {
      await shipmentApi.delete(id);
      await fetchShipments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shipment');
      throw err;
    }
  };

  const assignDriver = async (shipmentId: string, driverId: string) => {
    try {
      await shipmentApi.assignDriver(shipmentId, driverId);
      await fetchShipments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign driver');
      throw err;
    }
  };

  const createDriver = async (data: any) => {
    try {
      await driverApi.create(data);
      await fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create driver');
      throw err;
    }
  };

  const getShipmentStats = async () => {
    try {
      return await shipmentApi.getStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    }
  };

  const getDriverStats = async () => {
    try {
      return await driverApi.getStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    }
  };

  const authenticateUser = async (username: string, password: string) => {
    try {
      const result = await authApi.authenticate(username, password);
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userId', result.userId);
      localStorage.setItem('userRole', result.role);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      throw err;
    }
  };

  const refetch = async () => {
    await fetchShipments();
    await fetchDrivers();
  };

  return {
    shipments,
    drivers,
    loading,
    error,
    createShipment,
    updateShipment,
    deleteShipment,
    assignDriver,
    createDriver,
    getShipmentStats,
    getDriverStats,
    authenticateUser,
    refetch,
  };
};
