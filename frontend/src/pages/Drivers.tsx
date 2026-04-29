import { useState, useEffect, useRef } from 'react';
import { notify, notifyFormErrors } from '../services/notify';
import { api, openProtectedFile } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, X, Users, FileText, Upload, Eye, Phone, MapPin } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface Driver {
  id: string;
  fullName: string;
  licenceNumber: string;
  contactNumber: string;
  address?: string;
  licenceDocumentPath?: string;
}

const driverSchema = yup.object({
  fullName: yup.string().required('Full Name is required'),
  licenceNumber: yup.string().required('Licence Number is required'),
  contactNumber: yup.string().required('Contact Number is required'),
  address: yup.string().optional(),
});

type DriverForm = yup.InferType<typeof driverSchema>;

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Store actual File object for licence
  const [selectedLicenceFile, setSelectedLicenceFile] = useState<File | null>(null);
  const licenceFileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(driverSchema),
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const data = await api.get<Driver[]>('/drivers');
      setDrivers(data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (driver?: Driver) => {
    setEditingDriver(driver || null);
    if (driver) {
      reset({
        fullName: driver.fullName,
        licenceNumber: driver.licenceNumber,
        contactNumber: driver.contactNumber,
        address: driver.address || '',
      });
    } else {
      reset({
        fullName: '',
        licenceNumber: '',
        contactNumber: '',
        address: '',
      });
    }
    setSelectedLicenceFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingDriver(null);
    reset();
    setSelectedLicenceFile(null);
  };

  const handleLicenceChange = (file: File | null) => {
    setSelectedLicenceFile(file);
  };

  const onSubmit = async (data: DriverForm) => {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('licenceNumber', data.licenceNumber);
      formData.append('contactNumber', data.contactNumber);
      if (data.address) formData.append('address', data.address);
      
      // Append licence file if selected
      if (selectedLicenceFile) {
        formData.append('licenceFile', selectedLicenceFile);
      }
      
      if (editingDriver) {
        await api.put(`/drivers/${editingDriver.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/drivers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      closeForm();
      fetchDrivers();
    } catch (error) {
      console.error('Save error:', error);
      notify('Failed to save driver. Licence number might already exist.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers();
    } catch (error) {
      notify('Failed to delete driver.');
    }
  };

  const handleViewLicence = async (filePath?: string) => {
    if (filePath) {
      try {
        await openProtectedFile(filePath);
      } catch (error) {
        console.error('Failed to open licence copy:', error);
        notify('Failed to open licence copy.');
      }
    }
  };

  const getFileSize = (file: File | null) => {
    if (!file) return '';
    const size = file.size / 1024 / 1024; // MB
    return size.toFixed(2) + ' MB';
  };

  const filteredDrivers = drivers.filter(d => 
    d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.contactNumber.includes(searchTerm)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Drivers</h1>
          <p className="text-gray-600">Indtrans Freight Solutions LLP · Transport Management</p>
        </div>

        {/* Add Driver Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Driver
          </button>
        </div>

        {/* Add/Edit Driver Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDriver ? 'Edit Driver' : 'New Driver'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit, (errs) => notifyFormErrors(errs as any))} className="space-y-6">
              {/* Personal Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b uppercase tracking-wide">Personal Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      FULL NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('fullName')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter full name"
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LICENCE NUMBER <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('licenceNumber')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                      placeholder="e.g., MH0120230012345"
                      maxLength={20}
                    />
                    {errors.licenceNumber && <p className="text-red-500 text-sm mt-1">{errors.licenceNumber.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CONTACT NUMBER <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        {...register('contactNumber')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="+91 98765 43210"
                        maxLength={13}
                      />
                    </div>
                    {errors.contactNumber && <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ADDRESS
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <textarea
                        {...register('address')}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Enter residential address"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Licence Document Upload */}
              <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Driving Licence Document (PDF, JPEG, PNG - Max 10MB)
                </h3>
                <div className="max-w-md">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-orange-400 cursor-pointer transition">
                    <Upload className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600 text-center">
                      {selectedLicenceFile ? selectedLicenceFile.name : 'Click to upload licence copy'}
                    </span>
                    <input
                      ref={licenceFileRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleLicenceChange(e.target.files?.[0] || null)}
                    />
                  </label>
                  {selectedLicenceFile && (
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600 bg-white px-4 py-3 rounded border border-orange-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <span>{selectedLicenceFile.name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{getFileSize(selectedLicenceFile)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLicenceChange(null)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, JPG, JPEG, PNG. Max size: 10MB</p>
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
                  {isSubmitting ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
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
              placeholder="Search by name, licence, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Driver Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Licence Number</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Licence Copy</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No drivers found matching your search.' : 'No drivers yet. Add your first driver!'}
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          {driver.fullName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {driver.licenceNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {driver.contactNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">
                        {driver.address || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {driver.licenceDocumentPath ? (
                          <button
                            onClick={() => handleViewLicence(driver.licenceDocumentPath)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View Licence
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">Not uploaded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openForm(driver)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(driver.id)}
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
              <span className="font-semibold">{filteredDrivers.length}</span> total driver{filteredDrivers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
