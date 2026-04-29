import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Search, Edit2, Trash2, X, Building2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface Customer {
  id: string;
  name: string;
  gstNumber?: string;
  phone?: string;
  accountNumber?: string;
  address?: string;
  plantAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const customerSchema = yup.object({
  name: yup.string().required('Company Name is required'),
  gstNumber: yup.string().optional(),
  phone: yup.string().optional(),
  accountNumber: yup.string().optional(),
  address: yup.string().optional(),
  plantAddress: yup.string().optional(),
  city: yup.string().optional(),
  state: yup.string().optional(),
  pincode: yup.string().optional(),
});

type CustomerForm = yup.InferType<typeof customerSchema>;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(customerSchema),
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.get<Customer[]>('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      gstNumber: customer.gstNumber || '',
      phone: customer.phone || '',
      accountNumber: customer.accountNumber || '',
      address: customer.address || '',
      plantAddress: customer.plantAddress || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || '',
    });
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingCustomer(null);
    reset();
  };

  const onSubmit = async (data: CustomerForm) => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, data);
      } else {
        await api.post('/customers', data);
      }
      closeForm();
      fetchCustomers();
    } catch (error) {
      notify('Failed to save customer. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error) {
      notify('Failed to delete customer.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.gstNumber && c.gstNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.phone && c.phone.includes(searchTerm))
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
      {/* Sidebar - Same as Dashboard */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers</h1>
          <p className="text-gray-600">Indtrans Freight Solutions LLP · Transport Management</p>
        </div>

        {/* Add Customer Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Customer
          </button>
        </div>

        {/* Add/Edit Customer Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    COMPANY NAME <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter company name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST NUMBER</label>
                  <input
                    type="text"
                    {...register('gstNumber')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter GST number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CONTACT NUMBER</label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter contact number"
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ADDRESS</label>
                  <textarea
                    {...register('address')}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">PLANT ADDRESS</label>
                  <textarea
                    {...register('plantAddress')}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter plant address"
                  />
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
                  {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
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
              placeholder="Search by company name or GST..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">GST</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? 'No customers found matching your search.' : 'No customers yet. Add your first customer!'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {customer.gstNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {customer.accountNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(customer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
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
              <span className="font-semibold">{filteredCustomers.length}</span> total record{filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}