import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api, openProtectedFile } from '../services/api';
import { Printer, Eye, Edit2, Trash2, Search, CheckCircle, X, Save, Upload, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface Billing {
  id: string;
  billNumber: string;
  gcnId?: string;
  vhcId?: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerGst: string;
  billDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  sourceType: string;
  remarks: string;
  loadingDate?: string;
  vehicleNo?: string;
  gcnNo?: string;
  receiptPath?: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  address: string;
  gstNumber: string;
  contactNumber: string;
}

export default function Billing() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingBill, setViewingBill] = useState<Billing | null>(null);
  const [editingBill, setEditingBill] = useState<Billing | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [billingData, customerData] = await Promise.all([
        api.get<Billing[]>('/billing'),
        api.get<Customer[]>('/customers'),
      ]);
      setBillings(billingData);
      setCustomers(customerData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await api.put(`/billing/${id}/status`, null, {
        params: { status: 'PAID' }
      });
      fetchData();
      if (viewingBill && viewingBill.id === id) {
        const updated = await api.get<Billing>(`/billing/${id}`);
        setViewingBill(updated);
      }
    } catch (error) {
      notify('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await api.delete(`/billing/${id}`);
      fetchData();
      setViewingBill(null);
    } catch (error) {
      notify('Failed to delete bill');
    }
  };

  const handleEdit = (bill: Billing) => {
    setEditingBill({ ...bill });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBill) return;
    try {
      await api.put(`/billing/${editingBill.id}`, editingBill);
      fetchData();
      if (viewingBill && viewingBill.id === editingBill.id) {
        setViewingBill(editingBill);
      }
      setShowEditModal(false);
      setEditingBill(null);
      notify('Bill updated successfully');
    } catch (error) {
      notify('Failed to update bill');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReceiptUpload = async (billId: string, file: File) => {
    try {
      const form = new FormData();
      form.append('receipt', file);
      const updated = await api.post<Billing>(`/billing/${billId}/receipt`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (viewingBill && viewingBill.id === billId) setViewingBill(updated);
      fetchData();
      notify('Receipt uploaded. Bill marked as PAID.');
    } catch (e) {
      console.error(e);
      notify('Failed to upload receipt');
    }
  };

  const handleReceiptDelete = async (billId: string) => {
    if (!window.confirm('Remove uploaded receipt?')) return;
    try {
      await api.delete(`/billing/${billId}/receipt`);
      if (viewingBill && viewingBill.id === billId) {
        setViewingBill({ ...viewingBill, receiptPath: undefined });
      }
      fetchData();
    } catch (e) {
      notify('Failed to remove receipt');
    }
  };

  const handleViewReceipt = async (receiptPath?: string) => {
    if (!receiptPath) return;

    try {
      await openProtectedFile(receiptPath);
    } catch (error) {
      console.error('Failed to open receipt:', error);
      notify('Failed to open receipt.');
    }
  };

const filteredBillings = billings
  .filter(bill => {
    const matchesSearch = bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || bill.status.toUpperCase() === statusFilter.toUpperCase();
    const matchesSource = sourceFilter === 'All' || 
                         (sourceFilter === 'From GCNs' && bill.sourceType === 'GCN') ||
                         (sourceFilter === 'From Challans' && bill.sourceType === 'VHC');
    return matchesSearch && matchesStatus && matchesSource;
  })
  // ✅ ADD THIS SORT
  .sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());

  const totalBilled = billings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalPending = billings.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalCollected = billings.filter(b => b.status === 'PAID').reduce((sum, b) => sum + (b.paidAmount || 0), 0);

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

      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
          <p className="text-gray-600">Auto-generated from Challans & GCNs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
            <p className="text-sm text-gray-600 mb-2">Total Billed</p>
            <p className="text-3xl font-bold text-orange-600">
              ₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">{billings.length} entries</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200">
            <p className="text-sm text-gray-600 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">{billings.filter(b => b.status === 'PENDING').length} unpaid</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
            <p className="text-sm text-gray-600 mb-2">Collected</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">{billings.filter(b => b.status === 'PAID').length} paid</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setSourceFilter('All')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${sourceFilter === 'All' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All Entries
            </button>
            <button 
              onClick={() => setSourceFilter('From GCNs')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${sourceFilter === 'From GCNs' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              From GCNs ({billings.filter(b => b.sourceType === 'GCN').length})
            </button>
            <button 
              onClick={() => setSourceFilter('From Challans')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${sourceFilter === 'From Challans' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              From Challans ({billings.filter(b => b.sourceType === 'VHC').length})
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              {['All', 'Pending', 'Paid'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${statusFilter === status ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by bill no, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Billing Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Bill No.</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBillings.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-orange-600">{bill.billNumber}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{new Date(bill.billDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 font-medium">{bill.customerName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">{bill.sourceType}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold">₹{(bill.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      bill.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      bill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {bill.status !== 'PAID' && (
                        <button
                          onClick={() => handleMarkPaid(bill.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Paid
                        </button>
                      )}
                      <button
                        onClick={() => setViewingBill(bill)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {bill.receiptPath && (
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(bill.receiptPath)}
                          title="View receipt"
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(bill)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* View Bill Modal */}
      {viewingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Tax Invoice / Bill</h2>
                <button onClick={() => setViewingBill(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Bill View Card */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h1 className="text-xl font-bold text-center text-gray-900">INDTRANS FREIGHT SOLUTIONS LLP</h1>
                  <p className="text-center text-sm text-gray-600 mt-1">
                    103, 1st Floor Grohitam Premises, APMC Market Sector 19, Navi Mumbai – 400703
                  </p>
                  <div className="flex justify-center mt-2">
                    <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      TAX INVOICE / BILL
                    </span>
                  </div>
                </div>

                {/* Bill Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Bill No:</p>
                    <p className="font-bold text-lg">{viewingBill.billNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase mb-1">Date:</p>
                    <p className="font-semibold">{new Date(viewingBill.billDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bill To</h3>
                  <p className="font-bold text-gray-900">{viewingBill.customerName}</p>
                  <p className="text-sm text-gray-600 mt-1">{viewingBill.customerAddress || 'Address not available'}</p>
                  {viewingBill.customerGst && (
                    <p className="text-xs text-gray-500 mt-1">GST: {viewingBill.customerGst}</p>
                  )}
                </div>

                {/* Shipment Info */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                  {viewingBill.loadingDate && (
                    <div>
                      <p className="text-xs text-gray-500">Loading Date:</p>
                      <p className="font-semibold">{new Date(viewingBill.loadingDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  )}
                  {viewingBill.vehicleNo && (
                    <div>
                      <p className="text-xs text-gray-500">Vehicle No:</p>
                      <p className="font-semibold">{viewingBill.vehicleNo}</p>
                    </div>
                  )}
                  {viewingBill.gcnNo && (
                    <div>
                      <p className="text-xs text-gray-500">GCN No:</p>
                      <p className="font-semibold">{viewingBill.gcnNo}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Description</h3>
                  <p className="text-sm text-gray-700">
                    Goods Consignment Note {viewingBill.gcnNo} - {viewingBill.remarks || 'Transportation Services'}
                  </p>
                </div>

                {/* Amount */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Total Freight</h3>
                      <p className="text-xs text-gray-500">Zero Rupees Only</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">₹{(viewingBill.amount || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Status:</p>
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      viewingBill.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      viewingBill.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {viewingBill.status}
                    </span>
                  </div>
                  {viewingBill.status !== 'PAID' && (
                    <button
                      onClick={() => handleMarkPaid(viewingBill.id)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>

                {/* Payment Receipt Section */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Payment Receipt
                  </h3>
                  {viewingBill.receiptPath ? (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(viewingBill.receiptPath)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-orange-300 rounded-lg text-sm text-orange-700 hover:bg-orange-100 font-medium"
                      >
                        <Eye className="w-4 h-4" /> View uploaded receipt
                      </button>
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        <Upload className="w-4 h-4" /> Replace
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleReceiptUpload(viewingBill.id, f);
                          }}
                        />
                      </label>
                      <button
                        onClick={() => handleReceiptDelete(viewingBill.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed border-orange-300 rounded-lg bg-white hover:border-orange-500 text-sm text-gray-700">
                      <Upload className="w-5 h-5 text-orange-600" />
                      <span>Click to upload receipt (PDF, JPG, PNG - max 10MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleReceiptUpload(viewingBill.id, f);
                        }}
                      />
                    </label>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Uploading a receipt automatically marks this bill as <strong>PAID</strong>.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Save as PDF
                  </button>
                  <button
                    onClick={() => {
                      setViewingBill(null);
                      handleEdit(viewingBill);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setViewingBill(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {showEditModal && editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Bill</h2>
              <button onClick={() => { setShowEditModal(false); setEditingBill(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Number</label>
                <input
                  type="text"
                  value={editingBill.billNumber}
                  onChange={(e) => setEditingBill({...editingBill, billNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Date</label>
                <input
                  type="date"
                  value={editingBill.billDate}
                  onChange={(e) => setEditingBill({...editingBill, billDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={editingBill.customerName}
                  onChange={(e) => setEditingBill({...editingBill, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Address</label>
                <textarea
                  value={editingBill.customerAddress}
                  onChange={(e) => setEditingBill({...editingBill, customerAddress: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer GST</label>
                <input
                  type="text"
                  value={editingBill.customerGst}
                  onChange={(e) => setEditingBill({...editingBill, customerGst: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingBill.amount}
                  onChange={(e) => setEditingBill({...editingBill, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Paid Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingBill.paidAmount}
                  onChange={(e) => setEditingBill({...editingBill, paidAmount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={editingBill.status}
                  onChange={(e) => setEditingBill({...editingBill, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="TO_BE_BILLED">To Be Billed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={editingBill.remarks}
                  onChange={(e) => setEditingBill({...editingBill, remarks: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => { setShowEditModal(false); setEditingBill(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

{/* Print Styles */}
<style>{`
  @media print {
    body * {
      visibility: hidden !important;
    }
    .print-only {
      visibility: visible !important;
      display: block !important;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
      padding: 15mm;
    }
    .print-only * {
      visibility: visible !important;
    }
    @page {
      margin: 10mm;
      size: auto;
    }
  }
`}</style>
	
{/* Hidden Print Template */}
{viewingBill && (
  <div className="print-only" style={{ 
    display: 'none', // Will be overridden by print CSS
    width: '210mm',
    minHeight: '297mm',
    fontFamily: 'Arial, sans-serif',
    fontSize: '11px',
    boxSizing: 'border-box',
    background: 'white'
  }}>
    {/* Header */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
      <tbody>
        <tr>
          <td style={{ width: '60%', verticalAlign: 'top' }}>
            <img 
              src={`${window.location.origin}/logo.jpeg`} 
              alt="Logo" 
              style={{ height: '50px', marginBottom: '10px' }}
              onError={(e) => {
                console.log('Logo not found, using fallback');
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 style={{ margin: '0', fontSize: '16px', fontWeight: 'bold', color: '#ea580c' }}>
              INDTRANS FREIGHT SOLUTIONS LLP
            </h1>
            <p style={{ margin: '5px 0', fontSize: '10px', color: '#666' }}>
              Your reliable Transportation Partner
            </p>
            <p style={{ margin: '3px 0', fontSize: '9px', color: '#666' }}>
              103, 1st Floor Grohitam Premises, APMC Market Sector 19,<br />
              Navi Mumbai, Maharashtra – 400703<br />
              Ph: 8850397196 | Email: operations@indtransfreightsolutions.com
            </p>
          </td>
          <td style={{ width: '40%', textAlign: 'right', verticalAlign: 'top' }}>
            <p style={{ margin: '0', fontSize: '9px', fontWeight: 'bold' }}>PAN: AAJFI3555P</p>
            <p style={{ margin: '3px 0', fontSize: '9px', fontWeight: 'bold' }}>GST No: 27AAJFI355P1ZQ</p>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Title */}
    <div style={{
      backgroundColor: '#000',
      color: 'white',
      textAlign: 'center',
      padding: '8px',
      fontWeight: 'bold',
      fontSize: '14px',
      marginBottom: '20px'
    }}>
      TAX INVOICE / BILL
    </div>

    {/* Invoice Info */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
            <p style={{ margin: '0', fontSize: '9px', fontWeight: 'bold' }}>INVOICE NO.</p>
            <p style={{ margin: '3px 0', fontSize: '11px', fontWeight: 'bold' }}>{viewingBill.billNumber}</p>
          </td>
          <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}>
            <p style={{ margin: '0', fontSize: '9px', fontWeight: 'bold' }}>DATE</p>
            <p style={{ margin: '3px 0', fontSize: '11px' }}>{new Date(viewingBill.billDate).toLocaleDateString('en-IN')}</p>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Bill To */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '8px' }}>
            <p style={{ margin: '0', fontSize: '9px', fontWeight: 'bold' }}>BILL TO</p>
            <p style={{ margin: '5px 0', fontSize: '12px', fontWeight: 'bold' }}>{viewingBill.customerName}</p>
            {viewingBill.customerAddress && (
              <p style={{ margin: '3px 0', fontSize: '10px' }}>{viewingBill.customerAddress}</p>
            )}
            {viewingBill.customerGst && (
              <p style={{ margin: '3px 0', fontSize: '9px' }}>GST: {viewingBill.customerGst}</p>
            )}
          </td>
        </tr>
      </tbody>
    </table>

    {/* Shipment Info */}
    {(viewingBill.loadingDate || viewingBill.vehicleNo || viewingBill.gcnNo) && (
      <div style={{ marginBottom: '20px', fontSize: '9px', padding: '8px', backgroundColor: '#f9fafb' }}>
        {viewingBill.loadingDate && (
          <span><strong>Loading Date:</strong> {new Date(viewingBill.loadingDate).toLocaleDateString('en-IN')} | </span>
        )}
        {viewingBill.vehicleNo && (
          <span><strong>Vehicle No:</strong> {viewingBill.vehicleNo} | </span>
        )}
        {viewingBill.gcnNo && (
          <span><strong>GCN No:</strong> {viewingBill.gcnNo}</span>
        )}
      </div>
    )}

    {/* Items Table */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000' }}>
      <thead>
        <tr style={{ backgroundColor: '#f3f4f6' }}>
          <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontSize: '9px', fontWeight: 'bold' }}>#</th>
          <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontSize: '9px', fontWeight: 'bold' }}>DESCRIPTION</th>
          <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontSize: '9px', fontWeight: 'bold' }}>AMOUNT (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '6px', fontSize: '9px' }}>1</td>
          <td style={{ border: '1px solid #000', padding: '6px', fontSize: '9px' }}>
            {viewingBill.remarks || 'Transportation Services'}
          </td>
          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontSize: '9px' }}>
            ₹{(viewingBill.amount || 0).toFixed(2)}
          </td>
        </tr>
        <tr>
          <td colSpan={2} style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '9px', backgroundColor: '#f9fafb' }}>
            Sub Total
          </td>
          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontSize: '9px' }}>
            ₹{(viewingBill.amount || 0).toFixed(2)}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr style={{ backgroundColor: '#000', color: 'white' }}>
          <td colSpan={2} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '11px' }}>
            GRAND TOTAL
          </td>
          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '12px' }}>
            ₹ {(viewingBill.amount || 0).toFixed(2)}
          </td>
        </tr>
      </tfoot>
    </table>

    {/* Amount in Words */}
    <div style={{ 
      marginBottom: '20px', 
      fontSize: '9px', 
      fontStyle: 'italic',
      padding: '8px',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb'
    }}>
      <strong>Amount in Words:</strong> {viewingBill.amount === 0 ? 'Zero Rupees Only' : `Rupees ${viewingBill.amount.toFixed(2).replace('.', ' and Paise ')} Only`}
    </div>

    {/* Description */}
    <div style={{ border: '1px solid #000', padding: '8px', marginBottom: '20px', fontSize: '9px' }}>
      <p style={{ margin: '0' }}>
        <strong>Description:</strong> Goods Consignment Note {viewingBill.gcnNo} - {viewingBill.remarks || 'Transportation Services'}
      </p>
    </div>

    {/* Bank Details & Signature */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
      <tbody>
        <tr>
          <td style={{ width: '50%', verticalAlign: 'top', border: '1px solid #000', padding: '8px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 'bold', fontSize: '9px' }}>BANK DETAILS</p>
            <table style={{ width: '100%', fontSize: '8px' }}>
              <tbody>
                <tr><td style={{ padding: '2px 0', width: '30%' }}>Bank Name</td><td>: HDFC Bank</td></tr>
                <tr><td style={{ padding: '2px 0' }}>Account Name</td><td>: Indtrans Freight Solutions LLP</td></tr>
                <tr><td style={{ padding: '2px 0' }}>Account No.</td><td>: 50200083002582</td></tr>
                <tr><td style={{ padding: '2px 0' }}>IFSC Code</td><td>: HDFC0001585</td></tr>
                <tr><td style={{ padding: '2px 0' }}>Branch</td><td>: Turbhe, Navi Mumbai</td></tr>
              </tbody>
            </table>
          </td>
          <td style={{ width: '50%', verticalAlign: 'top', textAlign: 'right', border: '1px solid #000', padding: '8px' }}>
            <p style={{ margin: '0 0 40px', fontSize: '9px', fontWeight: 'bold' }}>FOR INDTRANS FREIGHT SOLUTIONS LLP</p>
            <div style={{ borderTop: '1px solid #000', width: '150px', margin: '0 auto 5px' }}></div>
            <p style={{ margin: '0', fontSize: '9px' }}>Authorised Signatory</p>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Footer */}
    <div style={{
      backgroundColor: '#000',
      color: 'white',
      padding: '8px',
      textAlign: 'center',
      fontSize: '8px',
      marginTop: '40px'
    }}>
      This is a computer-generated invoice, No signature required. | PAN: AAJFI3555P | GSTIN: 27AAJFI355P1ZQ | Indtrans Freight Solutions LLP, Navi Mumbai
    </div>
  </div>
)}
     
    </div>
  );
}
