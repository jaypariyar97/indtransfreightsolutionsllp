import { useState, useEffect, useRef } from 'react';
import { notify, notifyFormErrors } from '../services/notify';
import { api, openProtectedFile } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, X, Truck, FileText, AlertCircle, Upload, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  make: string;
  model: string;
  type?: string;
  rcExpiry?: string;
  insuranceExpiry?: string;
  permitExpiry?: string;
  rcDocumentPath?: string;
  insuranceDocumentPath?: string;
  permitDocumentPath?: string;
  fitnessExpiry?: string;
  taxExpiry?: string;
  fitnessDocumentPath?: string;
  taxDocumentPath?: string;
}

const vehicleSchema = yup.object({
  vehicleNumber: yup.string().required('Registration Number is required'),
  make: yup.string().required('Make is required'),
  model: yup.string().required('Model is required'),
  type: yup.string().optional(),
  rcExpiry: yup.string().optional(),
  insuranceExpiry: yup.string().optional(),
  permitExpiry: yup.string().optional(),
  fitnessExpiry: yup.string().optional(),
  taxExpiry: yup.string().optional(),
});

type VehicleForm = yup.InferType<typeof vehicleSchema>;

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Store actual File objects
  const [selectedFiles, setSelectedFiles] = useState({
    rcFile: null as File | null,
    insuranceFile: null as File | null,
    permitFile: null as File | null,
    fitnessFile: null as File | null,   // ✅ NEW
    taxFile: null as File | null, 
  });
  
  const fileInputRefs = {
    rcFile: useRef<HTMLInputElement>(null),
    insuranceFile: useRef<HTMLInputElement>(null),
    permitFile: useRef<HTMLInputElement>(null),
  };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(vehicleSchema),
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const data = await api.get<Vehicle[]>('/vehicles');
      setVehicles(data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (vehicle?: Vehicle) => {
    setEditingVehicle(vehicle || null);
    if (vehicle) {
      reset({
        vehicleNumber: vehicle.vehicleNumber,
        make: vehicle.make,
        model: vehicle.model,
        type: vehicle.type || '',
        rcExpiry: vehicle.rcExpiry || '',
        insuranceExpiry: vehicle.insuranceExpiry || '',
        permitExpiry: vehicle.permitExpiry || '',
        fitnessExpiry: vehicle.fitnessExpiry || '', 
        taxExpiry: vehicle.taxExpiry || '',
      });
    } else {
      reset({
        make: '',
        model: '',
        type: '',
        rcExpiry: '',
        insuranceExpiry: '',
        permitExpiry: '',
      });
    }
    setSelectedFiles({
      rcFile: null,
      insuranceFile: null,
      permitFile: null,
      fitnessFile: null,
      taxFile: null,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    reset();
    setSelectedFiles({
      rcFile: null,
      insuranceFile: null,
      permitFile: null,
      fitnessFile: null,
      taxFile: null,
    });
  };

  const handleFileChange = (field: keyof typeof selectedFiles, file: File | null) => {
    setSelectedFiles(prev => ({ ...prev, [field]: file }));
  };

  const onSubmit = async (data: VehicleForm) => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('vehicleNumber', data.vehicleNumber);
      formData.append('make', data.make);
      formData.append('model', data.model);
      if (data.type) formData.append('type', data.type);
      if (data.rcExpiry) formData.append('rcExpiry', data.rcExpiry);
      if (data.insuranceExpiry) formData.append('insuranceExpiry', data.insuranceExpiry);
      if (data.permitExpiry) formData.append('permitExpiry', data.permitExpiry);
      if (data.fitnessExpiry) formData.append('fitnessExpiry', data.fitnessExpiry);
      if (data.taxExpiry) formData.append('taxExpiry', data.taxExpiry);
      
      // Append files
      if (selectedFiles.rcFile) {
        formData.append('rcFile', selectedFiles.rcFile);
      }
      if (selectedFiles.insuranceFile) {
        formData.append('insuranceFile', selectedFiles.insuranceFile);
      }
      if (selectedFiles.permitFile) {
        formData.append('permitFile', selectedFiles.permitFile);
      }
      if (selectedFiles.fitnessFile) {
      formData.append('fitnessFile', selectedFiles.fitnessFile);
      }

      if (selectedFiles.taxFile) {
        formData.append('taxFile', selectedFiles.taxFile);
        }
      
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/vehicles', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      closeForm();
      fetchVehicles();
    } catch (error) {
      console.error('Save error:', error);
      notify('Failed to save vehicle. Registration number might already exist.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (error) {
      notify('Failed to delete vehicle.');
    }
  };

  const handleViewFile = async (filePath?: string) => {
    if (filePath) {
      try {
        await openProtectedFile(filePath);
      } catch (error) {
        console.error('Failed to open document:', error);
        notify('Failed to open document.');
      }
    }
  };

  // const isExpiringSoon = (dateStr?: string) => {
  //   if (!dateStr) return false;
  //   const expiry = new Date(dateStr);
  //   const today = new Date();
  //   const diffTime = expiry.getTime() - today.getTime();
  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   return diffDays <= 30 && diffDays >= 0;
  // };

  const getExpiryStatus = (dateStr?: string) => {
  if (!dateStr) return { status: 'none', color: 'bg-gray-100 text-gray-700', message: '' };
  const expiry = new Date(dateStr);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      status: 'expired',
      color: 'bg-red-100 text-red-800 border border-red-300',
      message: 'Expired! Update Immediately'
    };
  }
  if (diffDays <= 15) {
    return {
      status: 'urgent',
      color: 'bg-orange-100 text-orange-800 border border-orange-300',
      message: 'Expiring soon! Update ASAP'
    };
  }
  if (diffDays <= 30) {
    return {
      status: 'warning',
      color: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      message: 'Expiring within 30 days'
    };
  }
  return {
    status: 'ok',
    color: 'bg-gray-100 text-gray-700',
    message: ''
  };
};

  const formatExpiry = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFileSize = (file: File | null) => {
    if (!file) return '';
    const size = file.size / 1024 / 1024; // MB
    return size.toFixed(2) + ' MB';
  };
  const getAllExpiries = () => {
  const all: { type: string; vehicle: string; date?: string }[] = [];

  vehicles.forEach(v => {
    all.push(
      { type: 'RC', vehicle: v.vehicleNumber, date: v.rcExpiry },
      { type: 'INS', vehicle: v.vehicleNumber, date: v.insuranceExpiry },
      { type: 'PERMIT', vehicle: v.vehicleNumber, date: v.permitExpiry },
      { type: 'FITNESS', vehicle: v.vehicleNumber, date: v.fitnessExpiry },
      { type: 'TAX', vehicle: v.vehicleNumber, date: v.taxExpiry }
    );
  });

  return all.filter(x => x.date);
};
  const filteredVehicles = vehicles.filter(v => 
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.model && v.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicles</h1>
          <p className="text-gray-600">Indtrans Freight Solutions LLP· Transport Management</p>
        </div>

        {/* Add Vehicle Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>

        {/* Add/Edit Vehicle Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVehicle ? 'Edit Vehicle' : 'New Vehicle'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit, (errs) => notifyFormErrors(errs as any))} className="space-y-6">
              {/* Basic Details Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b uppercase tracking-wide">Basic Details</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      REGISTRATION NUMBER <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('vehicleNumber')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                      placeholder="MH-XX-XXXX-XXXX"
                      maxLength={15}
                    />
                    {errors.vehicleNumber && <p className="text-red-500 text-sm mt-1">{errors.vehicleNumber.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MAKE <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('make')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    >
                      <option value="">Select make...</option>
                      <option value="Tata">Tata</option>
                      <option value="Eicher">Eicher</option>
                      <option value="Ashok Leyland">Ashok Leyland</option>
                      <option value="Mahindra">Mahindra</option>
                      <option value="BharatBenz">BharatBenz</option>
                      <option value="Volvo">Volvo</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MODEL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('model')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., 407, Ace, 3118"
                    />
                    {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VEHICLE TYPE</label>
                    <select
                      {...register('type')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    >
                      <option value="">Select type...</option>
                      <option value="Full Body Truck (Light)">Full Body Truck (Light)</option>
                      <option value="Full Body Truck (Heavy)">Full Body Truck (Heavy)</option>
                      <option value="Trailer HBT">Trailer HBT</option>
                      <option value="Trailer SLBT">Trailer SLBT</option>
                      <option value="Trailer LBT">Trailer LBT</option>
                      <option value="Container">Container</option>
                      <option value="Refrigerator">Refrigerator Truck</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Vehicle Documents (PDF, JPEG, PNG - Max 2MB)
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* RC File */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">RC COPY</label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-orange-400 cursor-pointer transition">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 text-center">
                        {selectedFiles.rcFile ? selectedFiles.rcFile.name : 'Click to upload'}
                      </span>
                      <input
                        ref={fileInputRefs.rcFile}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('rcFile', e.target.files?.[0] || null)}
                      />
                    </label>
                    {selectedFiles.rcFile && (
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600 bg-white px-3 py-2 rounded border border-orange-200">
                        <span>{getFileSize(selectedFiles.rcFile)}</span>
                        <button
                          type="button"
                          onClick={() => handleFileChange('rcFile', null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Insurance File */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">INSURANCE DOCUMENT</label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-orange-400 cursor-pointer transition">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 text-center">
                        {selectedFiles.insuranceFile ? selectedFiles.insuranceFile.name : 'Click to upload'}
                      </span>
                      <input
                        ref={fileInputRefs.insuranceFile}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('insuranceFile', e.target.files?.[0] || null)}
                      />
                    </label>
                    {selectedFiles.insuranceFile && (
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600 bg-white px-3 py-2 rounded border border-orange-200">
                        <span>{getFileSize(selectedFiles.insuranceFile)}</span>
                        <button
                          type="button"
                          onClick={() => handleFileChange('insuranceFile', null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Permit File */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">PERMIT DOCUMENT</label>
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-orange-400 cursor-pointer transition">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 text-center">
                        {selectedFiles.permitFile ? selectedFiles.permitFile.name : 'Click to upload'}
                      </span>
                      <input
                        ref={fileInputRefs.permitFile}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange('permitFile', e.target.files?.[0] || null)}
                      />
                    </label>
                    {selectedFiles.permitFile && (
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-600 bg-white px-3 py-2 rounded border border-orange-200">
                        <span>{getFileSize(selectedFiles.permitFile)}</span>
                        <button
                          type="button"
                          onClick={() => handleFileChange('permitFile', null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                   {/* Fitness File */}
                  <div>
                       <label className="block text-xs font-semibold text-gray-700 mb-1.5">FITNESS COPY</label>
                      <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-orange-400 cursor-pointer">
                        <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                   {selectedFiles.fitnessFile ? selectedFiles.fitnessFile.name : 'Click to upload'}
                         </span>
                     <input
                   type="file"
                    className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('fitnessFile', e.target.files?.[0] || null)}/>
                  </label>
                      {selectedFiles.fitnessFile && (
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600 bg-white px-3 py-2 rounded border border-orange-200">
                      <span>{getFileSize(selectedFiles.fitnessFile)}</span>
                      <button
                           type="button"
                          onClick={() => handleFileChange('fitnessFile', null)}
                          className="text-red-600 hover:text-red-800">
                               Remove
                                  </button>
                            </div>
                                )}
                          </div>

                  {/* Tax File */}
                  <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1.5">TAX COPY</label>
                      <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-orange-400 cursor-pointer">
                         <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                     {selectedFiles.taxFile ? selectedFiles.taxFile.name : 'Click to upload'}
                    </span>
                    <input
                   type="file"
                    className="hidden"
                         accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('taxFile', e.target.files?.[0] || null)} />
                   </label>
                       {selectedFiles.taxFile && (
                        <div className="file-preview">
                       <span>{getFileSize(selectedFiles.taxFile)}</span>
                      <button onClick={() => handleFileChange('taxFile', null)}>Remove</button>
                      </div>
                              )}
                  </div>
                    </div>
                    </div>
                      {/* Expiry Dates */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b uppercase tracking-wide">Document Expiry Dates</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">RC EXPIRY DATE</label>
                    <input
                      type="date"
                      {...register('rcExpiry')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">INSURANCE EXPIRY</label>
                    <input
                      type="date"
                      {...register('insuranceExpiry')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PERMIT EXPIRY</label>
                    <input
                      type="date"
                      {...register('permitExpiry')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">FITNESS EXPIRY</label>
                              <input
                                type="date"
                                {...register('fitnessExpiry')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">TAX EXPIRY</label>
                              <input
                                type="date"
                                {...register('taxExpiry')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
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
                  {isSubmitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by reg number, make, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        {/* Dashboard Expiry Alerts */}
<div className="grid md:grid-cols-4 gap-4 mb-6">
  {getAllExpiries().map((item, idx) => {
    const exp = getExpiryStatus(item.date);
    return (
      <div
        key={idx}
        title={exp.message}
        className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${exp.color}`}
      >
        <span>{item.vehicle} - {item.type}</span>
        {exp.status !== 'ok' && exp.status !== 'none' && (
          <AlertCircle className="w-4 h-4" />
        )}
      </div>
    );
  })}
</div>
        {/* Vehicles Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Reg. Number</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Make/Model</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Type</th>
                  <th className="px-32 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">RC Expiry</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Insurance Expiry</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Permit Expiry</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Fitness Expiry</th> 
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Tax Expiry</th>  
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No vehicles found matching your search.' : 'No vehicles yet. Add your first vehicle!'}
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-500" />
                          {vehicle.vehicleNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        <div className="font-medium">{vehicle.make}</div>
                        <div className="text-xs text-gray-500">{vehicle.model}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {vehicle.type || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        <div className="flex gap-2">
                          {vehicle.rcDocumentPath && (
                            <button
                              onClick={() => handleViewFile(vehicle.rcDocumentPath)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> RC
                            </button>
                          )}
                          {vehicle.insuranceDocumentPath && (
                            <button
                              onClick={() => handleViewFile(vehicle.insuranceDocumentPath)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> INS
                            </button>
                          )}
                          {vehicle.permitDocumentPath && (
                            <button
                              onClick={() => handleViewFile(vehicle.permitDocumentPath)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> PRM
                            </button>
                          )}
                         {vehicle.fitnessDocumentPath && (
                                      <button
                                        onClick={() => handleViewFile(vehicle.fitnessDocumentPath)}
                                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> FIT
                                      </button>
                                    )}
                                    {vehicle.taxDocumentPath && (
                                      <button
                                        onClick={() => handleViewFile(vehicle.taxDocumentPath)}
                                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" /> TAX
                                      </button>
                                    )}
                          {!vehicle.rcDocumentPath && !vehicle.insuranceDocumentPath && !vehicle.permitDocumentPath && !vehicle.fitnessDocumentPath && !vehicle.taxDocumentPath && (
                            <span className="text-gray-400 text-xs">No docs</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {/* <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isExpiringSoon(vehicle.rcExpiry) ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {formatExpiry(vehicle.rcExpiry)}
                          {isExpiringSoon(vehicle.rcExpiry) && <AlertCircle className="w-3 h-3" />}
                        </div> */}
                        {(() => {
                      const expiry = getExpiryStatus(vehicle.rcExpiry);
                        return (
                             <div
                        title={expiry.message}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${expiry.color}`}>
                {formatExpiry(vehicle.rcExpiry)}
                {expiry.status !== 'ok' && expiry.status !== 'none' && (
                 <AlertCircle className="w-3 h-3" />
                    )}
                  </div>
                  );
                  })()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {/* <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isExpiringSoon(vehicle.insuranceExpiry) ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {formatExpiry(vehicle.insuranceExpiry)}
                          {isExpiringSoon(vehicle.insuranceExpiry) && <AlertCircle className="w-3 h-3" />}
                        </div> */}

                        {(() => {
                    const expiry = getExpiryStatus(vehicle.insuranceExpiry);
                return (
                <div
                 title={expiry.message}
               className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${expiry.color}`}>
                {formatExpiry(vehicle.insuranceExpiry)}
                {expiry.status !== 'ok' && expiry.status !== 'none' && (
                <AlertCircle className="w-3 h-3" />
                    )}
                  </div>
                    );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {/* <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isExpiringSoon(vehicle.permitExpiry) ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {formatExpiry(vehicle.permitExpiry)}
                          {isExpiringSoon(vehicle.permitExpiry) && <AlertCircle className="w-3 h-3" />}
                        </div> */}

          {(() => {
                const expiry = getExpiryStatus(vehicle.permitExpiry);
             return (
            <div
              title={expiry.message}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${expiry.color}`}>
                 {formatExpiry(vehicle.permitExpiry)}
                {expiry.status !== 'ok' && expiry.status !== 'none' && (
               <AlertCircle className="w-3 h-3" />
                )}
              </div>
              );
            })()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                {(() => {
                      const expiry = getExpiryStatus(vehicle.fitnessExpiry);
                  return (
            <div
              title={expiry.message}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${expiry.color}`}>
                 {formatExpiry(vehicle.fitnessExpiry)}
                {expiry.status !== 'ok' && expiry.status !== 'none' && (
               <AlertCircle className="w-3 h-3" />
                )}
              </div>
              );
            })()}
                      </td>
              <td className="px-6 py-4 text-sm">
              {(() => {
                const expiry = getExpiryStatus(vehicle.taxExpiry);
             return (
            <div
              title={expiry.message}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${expiry.color}`}>
                 {formatExpiry(vehicle.taxExpiry)}
                {expiry.status !== 'ok' && expiry.status !== 'none' && (
               <AlertCircle className="w-3 h-3" />
                )}
              </div>
              );
            })()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openForm(vehicle)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              <span className="font-semibold">{filteredVehicles.length}</span> total record{filteredVehicles.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
