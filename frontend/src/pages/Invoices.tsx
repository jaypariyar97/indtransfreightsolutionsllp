import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api } from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Plus, Edit2, Trash2, X, Search, FileText, Download } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  shipmentId?: string;
  amount: number;
  status: string;
  issueDate?: string;
  dueDate?: string;
}

const invoiceSchema = yup.object({
  invoiceNumber: yup.string().required('Invoice Number is required'),
  customerId: yup.string().required('Customer ID is required'),
  shipmentId: yup.string().optional(),
  amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
  status: yup.string().required('Status is required'),
  issueDate: yup.string().optional(),
  dueDate: yup.string().optional(),
});

type InvoiceForm = yup.InferType<typeof invoiceSchema>;

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(invoiceSchema),
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await api.get<Invoice[]>('/invoices');
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (invoice?: Invoice) => {
    setEditingInvoice(invoice || null);
    if (invoice) {
      reset({
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        shipmentId: invoice.shipmentId || '',
        amount: invoice.amount,
        status: invoice.status,
        issueDate: invoice.issueDate || '',
        dueDate: invoice.dueDate || '',
      });
    } else {
      reset({ status: 'UNPAID' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    reset();
  };

  const onSubmit = async (data: InvoiceForm) => {
    try {
      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}`, data);
      } else {
        await api.post('/invoices', data);
      }
      closeModal();
      fetchInvoices();
    } catch (error) {
      notify('Failed to save invoice. Check if Invoice Number already exists.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (error) {
      notify('Failed to delete invoice.');
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-6 text-center">Loading invoices...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Pending Amount</p>
          <p className="text-xl font-bold text-gray-900">
            ₹{invoices.filter(i => i.status === 'UNPAID').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Collected This Month</p>
          <p className="text-xl font-bold text-gray-900">
            ₹{invoices.filter(i => i.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-xl font-bold text-gray-900">
            {invoices.filter(i => i.status === 'OVERDUE').length} Invoices
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No invoices found.</td></tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {inv.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{inv.customerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        inv.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{inv.dueDate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button onClick={() => openModal(inv)} className="text-blue-600 hover:text-blue-900"><Edit2 className="w-4 h-4 inline" /></button>
                      <button className="text-gray-600 hover:text-gray-900"><Download className="w-4 h-4 inline" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No *</label>
                  <input {...register('invoiceNumber')} placeholder="INV-001" className="w-full px-3 py-2 border rounded-lg" />
                  {errors.invoiceNumber && <p className="text-red-500 text-sm mt-1">{errors.invoiceNumber.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input {...register('amount')} type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg" />
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID *</label>
                  <input {...register('customerId')} placeholder="Paste ID from Customers" className="w-full px-3 py-2 border rounded-lg" />
                  {errors.customerId && <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select {...register('status')} className="w-full px-3 py-2 border rounded-lg">
                    <option value="UNPAID">Unpaid</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipment ID (Optional)</label>
                  <input {...register('shipmentId')} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input {...register('issueDate')} type="date" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input {...register('dueDate')} type="date" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : editingInvoice ? 'Update' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}