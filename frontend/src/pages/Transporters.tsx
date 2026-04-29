import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api, openProtectedFile } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, X, Warehouse } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface Transporter {
  id: string;
  companyName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  bankName?: string;
  ifscCode?: string;
  accountNumber?: string;
  branchName?: string;
  chequeFileUrl?: string;
  chequeFileName?: string;
}

const transporterSchema = yup.object({
  companyName: yup.string().required('Company Name is required'),
  contactNumber: yup.string().optional(),
  email: yup.string().email('Invalid email'),
  address: yup.string().optional(),
  bankName: yup.string().optional(),
  ifscCode: yup.string().optional(),
  accountNumber: yup.string().optional(),
  branchName: yup.string().optional(),
});

type TransporterForm = yup.InferType<typeof transporterSchema>;

export default function Transporters() {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(transporterSchema),
  });

  useEffect(() => {
    fetchTransporters();
  }, []);

  const fetchTransporters = async () => {
    try {
      const data = await api.get<Transporter[]>('/transporters');
      setTransporters(data);
    } catch (error) {
      console.error('Failed to fetch transporters:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (transporter: Transporter) => {
    setEditingTransporter(transporter);
    reset({
      companyName: transporter.companyName,
      contactNumber: transporter.contactNumber || '',
      email: transporter.email || '',
      address: transporter.address || '',
      bankName: transporter.bankName || '',
      ifscCode: transporter.ifscCode || '',
      accountNumber: transporter.accountNumber || '',
      branchName: transporter.branchName || '',
    });
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingTransporter(null);
    reset();
  };

 const onSubmit = async (data: TransporterForm) => {
  try {
    const formData = new FormData();

    formData.append("companyName", data.companyName);
    if (data.contactNumber) formData.append("contactNumber", data.contactNumber);
    if (data.email) formData.append("email", data.email);
    if (data.address) formData.append("address", data.address);
    if (data.bankName) formData.append("bankName", data.bankName);
    if (data.ifscCode) formData.append("ifscCode", data.ifscCode);
    if (data.accountNumber) formData.append("accountNumber", data.accountNumber);
    if (data.branchName) formData.append("branchName", data.branchName);

    if (chequeFile) {
      formData.append("chequeFile", chequeFile);
    }

    if (editingTransporter) {
      await api.put(`/transporters/${editingTransporter.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } else {
      await api.post("/transporters", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    }

    closeForm();
    setChequeFile(null);
    fetchTransporters();

  } catch (error: any) {
    console.error(error);
    notify("Failed to save transporter");
  }
};
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transporter?')) return;
    try {
      await api.delete(`/transporters/${id}`);
      fetchTransporters();
    } catch (error) {
      notify('Failed to delete transporter.');
    }
  };

  const filteredTransporters = transporters.filter(t => 
    t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.contactNumber && t.contactNumber.includes(searchTerm)) ||
    (t.ifscCode && t.ifscCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewCheque = async (filePath?: string) => {
    if (!filePath) return;

    try {
      await openProtectedFile(filePath);
    } catch (error) {
      console.error('Failed to open cheque copy:', error);
      notify('Failed to open cheque copy.');
    }
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transporters</h1>
          <p className="text-gray-600">Indtrans Freight Solutions LLP · Transport Management</p>
        </div>

        {/* Add Transporter Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Transporter
          </button>
        </div>

        {/* Add/Edit Transporter Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTransporter ? 'Edit Transporter' : 'New Transporter'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Company Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      COMPANY NAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('companyName')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter company name"
                    />
                    {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CONTACT NUMBER</label>
                    <input
                      type="tel"
                      {...register('contactNumber')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ADDRESS</label>
                    <textarea
                      {...register('address')}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Bank Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BANK NAME</label>
                    <input
                      type="text"
                      {...register('bankName')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">IFSC CODE</label>
                    <input
                      type="text"
                      {...register('ifscCode')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                      placeholder="e.g. SBIN0001234"
                      maxLength={11}
                    />
                  </div>
              
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ACCOUNT NUMBER</label>
                    <input
                      type="text"
                      {...register('accountNumber')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BRANCH NAME</label>
                    <input
                      type="text"
                      {...register('branchName')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>
              </div>
               {/* Cheque Upload Section */}
    <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
    Cheque Upload (PDF, JPEG, PNG)
  </h3>

  <label className="flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-orange-400 cursor-pointer transition">
    <span className="text-sm text-gray-600">
      {chequeFile ? chequeFile.name : 'Click to upload cheque'}
    </span>
    <input
      type="file"
      className="hidden"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={(e) => setChequeFile(e.target.files?.[0] || null)}
    />
  </label>

  {chequeFile && (
    <div className="mt-2 text-xs text-gray-600">
      Selected: {chequeFile.name}
      <button
        type="button"
        onClick={() => setChequeFile(null)}
        className="ml-3 text-red-600">
        Remove
      </button>
    </div>
  )}
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
                  {isSubmitting ? 'Saving...' : editingTransporter ? 'Update Transporter' : 'Add Transporter'}
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
              placeholder="Search by company name or IFSC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Transporters Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">IFSC</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Account</th>
                  <th className="px-1 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Cheque</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransporters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No transporters found matching your search.' : 'No transporters yet. Add your first transporter!'}
                    </td>
                  </tr>
                ) : (
                  filteredTransporters.map((transporter) => (
                    <tr key={transporter.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{transporter.companyName}</div>
                        {transporter.email && <div className="text-sm text-gray-500">{transporter.email}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {transporter.contactNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {transporter.ifscCode || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {transporter.accountNumber || '-'}
                      </td>
                      <td>
                      {transporter.chequeFileUrl ? (
                      <button
                         onClick={() => handleViewCheque(transporter.chequeFileUrl)}
                       className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs border border-blue-200 hover:bg-blue-100">
                           View
                                </button>) : (<span className="text-gray-400 text-xs">No File</span>)}
                          </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(transporter)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transporter.id)}
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
              <span className="font-semibold">{filteredTransporters.length}</span> total record{filteredTransporters.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
