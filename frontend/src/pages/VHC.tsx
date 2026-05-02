import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, X, Truck, Users, Building2, MapPin, Calendar, DollarSign, Eye, Printer } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface VHC {
  id: string;
  vhcNumber: string;
  customerId: string;
  vehicleId: string;
  driverId: string;
  fromLocation: string;
  toLocation: string;
  vhcDate: string;
  transportCost: number;
  advance: number;
  loading: number;
  unloading: number;
  detention: number;
  others: number;
  balance: number;
  remarks?: string;
  status?: string;
  createdAt?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  type?: string;
}

interface Driver {
  id: string;
  fullName: string;
  contactNumber?: string;
}

const vhcSchema = yup.object({
  vhcNumber: yup.string().optional(), // Optional - auto-generated
  customerId: yup.string().required('Customer is required'),
  vehicleId: yup.string().required('Vehicle is required'),
  driverId: yup.string().required('Driver is required'),
  fromLocation: yup.string().required('From Location is required'),
  toLocation: yup.string().required('To Location is required'),
  vhcDate: yup.string().required('Date is required'),
  transportCost: yup.number().min(0, 'Must be positive'),
  advance: yup.number().min(0, 'Must be positive'),
  loading: yup.number().min(0, 'Must be positive'),
  unloading: yup.number().min(0, 'Must be positive'),
  detention: yup.number().min(0, 'Must be positive'),
  others: yup.number().min(0, 'Must be positive'),
  remarks: yup.string().optional(),
});

type VHCForm = yup.InferType<typeof vhcSchema>;

export default function VHC() {
  const [vhcs, setVhcs] = useState<VHC[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingVHC, setViewingVHC] = useState<VHC | null>(null);
  const [editingVHC, setEditingVHC] = useState<VHC | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState(1);
  const [vhcsWithGCN, setVhcsWithGCN] = useState<Set<string>>(new Set());
  const isAdmin = useIsAdmin();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(vhcSchema),
  });

  useEffect(() => {
    fetchData();
    checkGCNStatus();
  }, []);

  const fetchData = async () => {
    try {
      const [vhcData, customerData, vehicleData, driverData] = await Promise.all([
        api.get<VHC[]>('/vhc'),
        api.get<Customer[]>('/customers'),
        api.get<Vehicle[]>('/vehicles'),
        api.get<Driver[]>('/drivers'),
      ]);
      setVhcs(vhcData);
      setCustomers(customerData);
      setVehicles(vehicleData);
      setDrivers(driverData);
    } catch (error) {
      console.error('Failed to fetch ', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGCNStatus = async () => {
    try {
      const gcns = await api.get<any[]>('/gcn');
      const vhcIdsWithGCN = new Set(gcns.map(gcn => gcn.vhcId));
      setVhcsWithGCN(vhcIdsWithGCN);
    } catch (error) {
      console.error('Failed to fetch GCN status:', error);
    }
  };

  const openForm = (vhc?: VHC) => {
    setEditingVHC(vhc || null);
    if (vhc) {
      reset({
        vhcNumber: vhc.vhcNumber,
        customerId: vhc.customerId,
        vehicleId: vhc.vehicleId,
        driverId: vhc.driverId,
        fromLocation: vhc.fromLocation,
        toLocation: vhc.toLocation,
        vhcDate: vhc.vhcDate,
        transportCost: vhc.transportCost || 0,
        advance: vhc.advance || 0,
        loading: vhc.loading || 0,
        unloading: vhc.unloading || 0,
        detention: vhc.detention || 0,
        others: vhc.others || 0,
      });
    } else {
      // Server generates VHC number on save (e.g. VHC-2026-000045).
      reset({
        vhcNumber: '',
        vhcDate: new Date().toISOString().split('T')[0],
        transportCost: 0,
        advance: 0,
        loading: 0,
        unloading: 0,
        detention: 0,
        others: 0,
      });
    }
    setStep(1);
    setShowForm(true);
    setViewingVHC(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVHC(null);
    reset();
    setStep(1);
  };

  const handleViewVHC = (vhc: VHC) => {
    setViewingVHC(vhc);
    setShowForm(false);
  };

  const handlePrint = () => {
    if (!viewingVHC) {
      window.print();
      return;
    }

    const originalTitle = document.title;
    const nextTitle = `Vehicle Hire Challan - ${viewingVHC.vhcNumber}`;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    document.title = nextTitle;
    window.addEventListener('afterprint', restoreTitle);
    window.print();

    window.setTimeout(() => {
      if (document.title === nextTitle) {
        restoreTitle();
      }
    }, 1000);
  };

  const handleProceedToGCN = () => {
    // Navigate to GCN preparation page
    window.location.href = '/admin/gcn';
  };

  const calculateBalance = () => {
    const transport = parseFloat(watch('transportCost')?.toString() || '0');
    const loading = parseFloat(watch('loading')?.toString() || '0');
    const unloading = parseFloat(watch('unloading')?.toString() || '0');
    const detention = parseFloat(watch('detention')?.toString() || '0');
    const others = parseFloat(watch('others')?.toString() || '0');
    const advance = parseFloat(watch('advance')?.toString() || '0');
    
    const total = transport + loading + unloading + detention + others;
    return total - advance;
  };

  const onSubmit = async (formData: VHCForm) => {
    try {
      console.log('Form data received:', formData); // Debug log
      
      const data = new FormData();
      data.append('vhcNumber', formData.vhcNumber || '');
      data.append('customerId', formData.customerId);
      data.append('vehicleId', formData.vehicleId);
      data.append('driverId', formData.driverId);
      data.append('fromLocation', formData.fromLocation);
      data.append('toLocation', formData.toLocation);
      data.append('vhcDate', formData.vhcDate);
      data.append('transportCost', formData.transportCost?.toString() || '0');
      data.append('advance', formData.advance?.toString() || '0');
      data.append('loading', formData.loading?.toString() || '0');
      data.append('unloading', formData.unloading?.toString() || '0');
      data.append('detention', formData.detention?.toString() || '0');
      data.append('others', formData.others?.toString() || '0');
      if (formData.remarks) data.append('remarks', formData.remarks);
      
      console.log('Sending to API...'); // Debug log
      
      if (editingVHC) {
        await api.put(`/vhc/${editingVHC.id}`, data);
      } else {
        await api.post('/vhc', data);
      }
      
      console.log('Save successful'); // Debug log
      closeForm();
      fetchData();
      checkGCNStatus(); // Refresh GCN status
    } catch (error) {
      console.error('Save error:', error);
      notify('Failed to save VHC.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this VHC?')) return;
    try {
      await api.delete(`/vhc/${id}`);
      fetchData();
      checkGCNStatus(); // Refresh GCN status
    } catch (error) {
      notify('Failed to delete VHC.');
    }
  };

  // const filteredVHCs = vhcs.filter(v => 
  //   v.vhcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   v.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   v.toLocation.toLowerCase().includes(searchTerm.toLowerCase())
  // );
  const filteredVHCs = vhcs
  .filter(v => 
    v.vhcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.toLocation.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    // Latest first based on createdAt (fallback to vhcDate)
    const dateA = new Date(a.createdAt || a.vhcDate).getTime();
    const dateB = new Date(b.createdAt || b.vhcDate).getTime();
    return dateB - dateA; // DESCENDING
  });
  
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  const getVehicleNumber = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.vehicleNumber || 'Unknown';
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver?.fullName || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Hire Challans</h1>
          <p className="text-gray-600">Indtrans Freight Solutions LLP · Transport Management</p>
        </div>

        {/* VIEW VHC PAGE */}
        {viewingVHC && !showForm && (
          <div className="bg-white">
            <div className="flex justify-between items-center mb-6 no-print">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewingVHC(null)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  ← Back to list
                </button>
                <span className="text-gray-400">|</span>
                <span className="font-semibold">Challan: {viewingVHC.vhcNumber}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  Print / PDF
                </button>
                {/* Only show button if GCN doesn't exist for this VHC */}
                {!vhcsWithGCN.has(viewingVHC.id) && (
                  <button
                    onClick={handleProceedToGCN}
                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition font-semibold"
                  >
                    Proceed to Create GCN →
                  </button>
                )}
              </div>
            </div>

            {/* VHC Document - Printable */}
            <div className="max-w-4xl mx-auto p-6 border border-gray-200 rounded-lg print-container bg-white">
              {/* Header Section */}
              <div className="flex justify-between items-start mb-6 border-b-2 border-orange-400 pb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <img src="/logo.jpeg" alt="INDTRANS" className="h-12 w-auto" />
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">INDTRANS FREIGHT SOLUTIONS LLP</h1>
                      <p className="text-xs text-gray-600 mt-1">
                        103, 1st Floor Grohitam Premises, APMC Market Sector 19,<br />
                        Navi Mumbai, Maharashtra – 400703<br />
                        Tel: 8850397196 | operations@indtransfreightsolutions.com
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-orange-600 uppercase mb-1">Vehicle Hire Challan</h2>
                  <div className="text-sm">
                    <p className="text-gray-600">Challan No: <span className="font-semibold text-gray-900">{viewingVHC.vhcNumber}</span></p>
                    <p className="text-gray-600">Date: <span className="font-semibold text-gray-900">{new Date(viewingVHC.vhcDate).toLocaleDateString('en-IN')}</span></p>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Customer</p>
                    <p className="font-semibold text-gray-900">{getCustomerName(viewingVHC.customerId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Vehicle Registration</p>
                    <p className="font-semibold text-gray-900">{getVehicleNumber(viewingVHC.vehicleId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Driver Name</p>
                    <p className="font-semibold text-gray-900">{getDriverName(viewingVHC.driverId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Date</p>
                    <p className="font-semibold text-gray-900">{new Date(viewingVHC.vhcDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">From Location</p>
                    <p className="font-semibold text-gray-900">{viewingVHC.fromLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">To Location</p>
                    <p className="font-semibold text-gray-900">{viewingVHC.toLocation}</p>
                  </div>
                </div>
              </div>

              {/* Transportation Hire Charges Table */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-orange-900 uppercase mb-3 bg-orange-50 px-4 py-2 rounded">Transportation Hire Charges</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-700">Transport Cost</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold">₹{viewingVHC.transportCost?.toFixed(2) || '0.00'}</td>
                      </tr>
                      {viewingVHC.loading && viewingVHC.loading > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-700">Loading</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">₹{viewingVHC.loading.toFixed(2)}</td>
                        </tr>
                      )}
                      {viewingVHC.unloading && viewingVHC.unloading > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-700">Unloading</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">₹{viewingVHC.unloading.toFixed(2)}</td>
                        </tr>
                      )}
                      {viewingVHC.detention && viewingVHC.detention > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-700">Detention</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">₹{viewingVHC.detention.toFixed(2)}</td>
                        </tr>
                      )}
                      {viewingVHC.others && viewingVHC.others > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-700">Others</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">₹{viewingVHC.others.toFixed(2)}</td>
                        </tr>
                      )}
                      {viewingVHC.advance && viewingVHC.advance > 0 && (
                        <tr className="bg-red-50">
                          <td className="px-4 py-2 text-sm text-red-700 font-medium">Advance (Deducted)</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-red-700">- ₹{viewingVHC.advance.toFixed(2)} (-)</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-orange-50 border-t-2 border-orange-300">
                      <tr>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">Balance Amount</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-lg font-bold text-orange-600">₹{viewingVHC.balance?.toFixed(2) || '0.00'}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {viewingVHC.remarks && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase mb-1">Remarks</p>
                  <p className="text-sm text-gray-700">{viewingVHC.remarks}</p>
                </div>
              )}

              {/* Signature Section */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="border-t border-gray-300 pt-2 mt-12">
                      <p className="text-xs text-gray-500 uppercase">Prepared By</p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-gray-300 pt-2 mt-12">
                      <p className="text-xs text-gray-500 uppercase">Checked By</p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-gray-300 pt-2 mt-12">
                      <p className="text-xs text-gray-500 uppercase">Authorised Signatory</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400">
                  This is a computer-generated document, No signature required. | Indtrans Freight Solutions LLP — Navi Mumbai
                </p>
              </div>
            </div>

            {/* Print Styles */}
            <style>{`
              @media print {
                /* 1. Define A4 Page */
                @page {
                  size: A4 portrait;
                  margin: 10mm; /* Standard margin */
                }

                /* 2. Hide Sidebar and Top Nav */
                aside, nav, .no-print {
                  display: none !important;
                }

                /* 3. Reset Main Layout (Removes the left space reserved for sidebar) */
                main {
                  margin-left: 0 !important;
                  margin-top: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                }

                /* 4. Expand Document to Full Width */
                .print-container {
                  max-width: 100% !important; /* Overrides max-w-4xl */
                  width: 100% !important;
                  margin: 0 auto !important; /* Centers nicely on paper */
                  padding: 0 !important; /* Let internal padding handle spacing */
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  page-break-inside: avoid;
                }

                /* 5. Restore Readable Font Sizes (Prevent shrinking) */
                body {
                  font-size: 12px !important; /* Normal readable size */
                  line-height: 1.4 !important;
                  color: #000 !important;
                }
                
                /* Header sizing */
                h1 { font-size: 20px !important; font-weight: 800 !important; }
                h2 { font-size: 16px !important; font-weight: 700 !important; }
                h3 { font-size: 13px !important; font-weight: 600 !important; }
                
                /* Table sizing */
                table {
                  width: 100% !important;
                  font-size: 11px !important;
                }
                th, td {
                  padding: 6px !important;
                }

                /* 6. Ensure Colors Print */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* Add VHC Button */}
        {!viewingVHC && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => openForm()}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition font-semibold"
            >
              <Plus className="w-5 h-5" />
              New VHC
            </button>
          </div>
        )}

        {/* Add/Edit VHC Form - 4 Step Wizard */}
        {!viewingVHC && showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVHC ? 'Edit VHC' : 'New Vehicle Hire Challan'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <span className={`ml-2 mr-4 ${step >= 1 ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>Customer</span>
                
                <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ml-4 ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <span className={`ml-2 mr-4 ${step >= 2 ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>Vehicle</span>
                
                <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ml-4 ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
                <span className={`ml-2 mr-4 ${step >= 3 ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>Driver</span>
                
                <div className={`w-16 h-0.5 ${step >= 4 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ml-4 ${step >= 4 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  4
                </div>
                <span className={`ml-2 ${step >= 4 ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>Freight Details</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Customer Selection */}
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Customer</h3>
                  <div className="max-w-2xl">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search customers by name, GST or contact..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {customers.map(customer => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setValue('customerId', customer.id);
                            setStep(2);
                          }}
                          className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition"
                        >
                          <div className="font-semibold text-gray-900">{customer.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Vehicle Selection */}
              {step === 2 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Select Vehicle</h3>
                    <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-600 hover:text-gray-900">
                      ← Back to Customer
                    </button>
                  </div>
                  <div className="max-w-2xl">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by registration number or type..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {vehicles.map(vehicle => (
                        <div
                          key={vehicle.id}
                          onClick={() => {
                            setValue('vehicleId', vehicle.id);
                            setStep(3);
                          }}
                          className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition"
                        >
                          <div className="font-semibold text-gray-900">{vehicle.vehicleNumber}</div>
                          <div className="text-sm text-gray-600">{vehicle.type || 'No type specified'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Driver Selection */}
              {step === 3 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Select Driver</h3>
                    <button type="button" onClick={() => setStep(2)} className="text-sm text-gray-600 hover:text-gray-900">
                      ← Back to Vehicle
                    </button>
                  </div>
                  <div className="max-w-2xl">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search drivers by name, license or contact..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {drivers.map(driver => (
                        <div
                          key={driver.id}
                          onClick={() => {
                            setValue('driverId', driver.id);
                            setStep(4);
                          }}
                          className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition"
                        >
                          <div className="font-semibold text-gray-900">{driver.fullName}</div>
                          <div className="text-sm text-gray-600">{driver.contactNumber || 'No contact'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Freight Details */}
              {step === 4 && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Freight Details</h3>
                    <button type="button" onClick={() => setStep(3)} className="text-sm text-gray-600 hover:text-gray-900">
                      ← Back to Driver
                    </button>
                  </div>

                  {/* Summary of selections */}
                  <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-3">Selected Details:</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <div className="font-semibold text-gray-900">{getCustomerName(watch('customerId'))}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Vehicle:</span>
                        <div className="font-semibold text-gray-900">{getVehicleNumber(watch('vehicleId'))}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Driver:</span>
                        <div className="font-semibold text-gray-900">{getDriverName(watch('driverId'))}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        FROM LOCATION <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          {...register('fromLocation')}
                          placeholder="e.g., Navi Mumbai"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      {errors.fromLocation && <p className="text-red-500 text-sm mt-1">{errors.fromLocation.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TO LOCATION <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          {...register('toLocation')}
                          placeholder="e.g., Pune"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      {errors.toLocation && <p className="text-red-500 text-sm mt-1">{errors.toLocation.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DATE <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="date"
                          {...register('vhcDate')}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      {errors.vhcDate && <p className="text-red-500 text-sm mt-1">{errors.vhcDate.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        VHC NUMBER
                      </label>
                      <input
                        type="text"
                        {...register('vhcNumber')}
                        placeholder="Auto-generated"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 cursor-not-allowed"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {editingVHC ? 'VHC number cannot be changed' : 'Auto-generated (cannot be edited)'}
                      </p>
                    </div>
                  </div>

                  {/* Hire Charges */}
                  <div className="mt-6 bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Hire Charges (Carrier's Side)</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">TRANSPORT COST (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('transportCost')}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">ADVANCE (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('advance')}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">LOADING (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('loading')}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">UNLOADING (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('unloading')}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">DETENTION (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('detention')}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">OTHERS (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register('others')}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                    
                    {/* Balance Calculation */}
                    <div className="mt-4 pt-4 border-t border-yellow-300">
                      <div className="flex justify-between items-center bg-green-100 px-4 py-3 rounded-lg">
                        <span className="font-bold text-green-900">Balance Amount (Auto)</span>
                        <span className="text-2xl font-bold text-green-700">₹{calculateBalance().toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Balance = Transport Cost + Loading + Unloading + Detention + Others - Advance
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">REMARKS</label>
                    <textarea
                      {...register('remarks')}
                      rows={2}
                      placeholder="Any additional notes..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold"
                  >
                    Next Step →
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : editingVHC ? 'Update VHC' : 'Generate Vehicle Hire Challan'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        {!viewingVHC && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by VHC number, from/to location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        )}

        {/* VHC Table */}
        {!viewingVHC && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">VHC No.</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVHCs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm ? 'No VHCs found matching your search.' : 'No VHCs yet. Create your first VHC!'}
                      </td>
                    </tr>
                  ) : (
                    filteredVHCs.map((vhc) => (
                      <tr key={vhc.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-orange-600">{vhc.vhcNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(vhc.vhcDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {getCustomerName(vhc.customerId)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {getVehicleNumber(vhc.vehicleId)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {getDriverName(vhc.driverId)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {vhc.fromLocation} → {vhc.toLocation}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">₹{vhc.balance?.toFixed(2) || '0.00'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewVHC(vhc)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openForm(vhc)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isAdmin &&<button
                              onClick={() => handleDelete(vhc.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{filteredVHCs.length}</span> VHC{filteredVHCs.length !== 1 ? 's' : ''} generated
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
