import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Database,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { notify } from '../services/notify';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/dashboard/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const downloadServerExport = async (
    endpoint: string,
    fileName: string,
    successMessage: string,
    errorMessage: string
  ) => {
    try {
      const blob = await api.get<Blob>(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName;
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notify(successMessage);
    } catch (error) {
      console.error('Failed to download export:', error);
      notify(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-sm text-gray-600 mt-1">
                Indtrans Freight Solutions LLP · Transport Management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8 border border-orange-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to the TMS Dashboard</h2>
                <p className="text-gray-700">
                  Manage your fleet, drivers, customers and billing from one place.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Module Overview <span className="text-sm font-normal text-gray-500">· Click to navigate</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              onClick={() => navigate('/admin/customers')}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats?.totalCustomers || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Customers</h4>
            </div>

            <div
              onClick={() => navigate('/admin/transporters')}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Warehouse className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats?.totalTransporters || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Transporters</h4>
            </div>

            <div
              onClick={() => navigate('/admin/vehicles')}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats?.totalVehicles || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Vehicles</h4>
            </div>

            <div
              onClick={() => navigate('/admin/drivers')}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats?.totalDrivers || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Drivers</h4>
            </div>

            <div
              onClick={() => navigate('/admin/vhc')}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats?.totalVHC || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Hire Challans</h4>
            </div>

            <div
              onClick={() => navigate('/admin/gcn')}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats?.totalGCN || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Consignment Notes</h4>
            </div>

            <div
              onClick={() => navigate('/admin/billing')}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-3xl font-bold text-gray-900">{stats?.totalBilling || 0}</span>
              </div>
              <h4 className="font-semibold text-gray-900">Billing Entries</h4>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-600" />
                Database Export
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hasPermission('customers', 'view') && (
                <button
                  onClick={() =>
                    downloadServerExport(
                      '/export/customers/csv',
                      'customers.csv',
                      'Customers exported successfully',
                      'Export failed'
                    )
                  }
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Export Customers CSV
                </button>
              )}

              {hasPermission('vehicles', 'view') && (
                <button
                  onClick={() =>
                    downloadServerExport(
                      '/export/vehicles/csv',
                      'vehicles.csv',
                      'Vehicles exported successfully',
                      'Failed to export vehicles'
                    )
                  }
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Export Vehicles CSV
                </button>
              )}

              {hasPermission('billing', 'view') && (
                <button
                  onClick={() =>
                    downloadServerExport(
                      '/export/billing/csv',
                      'billing.csv',
                      'Billing exported successfully',
                      'Failed to export billing'
                    )
                  }
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Export Billing CSV
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              CSV exports are generated server-side for large datasets. Files download automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Billing Amount</h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                Rs {(stats?.totalBillingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500">Across all billing entries</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Pending Payments</h3>
              <p className="text-4xl font-bold text-orange-600 mb-1">{stats?.pendingPayments || 0}</p>
              <p className="text-sm text-gray-500">Entries awaiting payment</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
