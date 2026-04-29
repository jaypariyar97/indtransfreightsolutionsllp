import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api } from '../services/api';
import { FileText, Plus, Search, Eye, Printer, Trash2, Truck, MapPin, Calendar, CheckCircle, Upload, X, ArrowLeft } from 'lucide-react';
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
}

interface GCN {
  id: string;
  gcnNumber: string;
  vhcId: string;
  vhcNumber?: string;
  customerId: string;
  vehicleId: string;
  driverId: string;
  consignorName: string;
  consignorAddress: string;
  consignorGst?: string;
  consignorPincode?: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeGst?: string;
  consigneePincode?: string;
  fromLocation: string;
  toLocation: string;
  gcnDate: string;
  billingType: string;
  insuranceConsignor: boolean;
  insuranceConsignee: boolean;
  customerFreight: number;
  advance: number;
  loadingCharge: number;
  unloadingCharge: number;
  detentionCharge: number;
  othersCharge: number;
  paymentTerms: string;
  remarks: string;
  status: string;
}

interface CargoItem {
  id?: string;
  description: string;
  packingType: string;
  quantity: number;
  unit: string;
  weight: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
}

interface Billing {
  id: string;
  billNumber: string;
  gcnId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerGst: string;
  billDate: string;
  amount: number;
  paidAmount: number;
  status: string;
  sourceType: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  pincode: string;
  gstNumber?: string;
  type: 'PICKUP' | 'DROP';
}

// ✅ FIX: Added optional vehicleNumber and driverName props
const PrintCopyPage = ({
  type,
  gcn,
  cargoItems,
  vehicleNumber,
  driverName,
}: {
  type: string;
  gcn: GCN;
  cargoItems: CargoItem[];
  vehicleNumber?: string;
  driverName?: string;
}) => (
  <div className="print-page" style={{
    width: '210mm', minHeight: '297mm', padding: '10mm',
    fontFamily: 'Arial, sans-serif', fontSize: '10px', boxSizing: 'border-box',
    pageBreakAfter: 'always', pageBreakInside: 'avoid', background: 'white',
    display: 'flex', flexDirection: 'column'
  }}>
    {/* Header */}
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ width: '60%', verticalAlign: 'top' }}>
            <img src="/logo.jpeg" alt="Logo" style={{ height: '40px', marginBottom: '5px' }} />
            <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#ea580c' }}>INDTRANS FREIGHT SOLUTIONS LLP</h1>
            <p style={{ margin: '2px 0', fontSize: '8px', color: '#666' }}>Your reliable Transportation Partner</p>
            <p style={{ margin: '2px 0', fontSize: '8px', color: '#666' }}>
              103, Grohitam Premises APMC market Sector 19 Vashi,<br />
              Navi Mumbai Maharashtra 400703<br />
              Ph: 8850397196 | Email: operations@indtransfreightsolutions.com
            </p>
          </td>
          <td style={{ width: '40%', textAlign: 'right', verticalAlign: 'top' }}>
            <p style={{ margin: 0, fontSize: '8px', fontWeight: 'bold' }}>GST NO: 27AAJFI355P1ZQ</p>
            <p style={{ margin: 0, fontSize: '8px', fontWeight: 'bold' }}>PAN: AAJFI3555P</p>
          </td>
        </tr>
      </tbody>
    </table>

    <div style={{
      backgroundColor: '#ea580c', color: 'white', textAlign: 'center',
      padding: '6px', fontWeight: 'bold', fontSize: '12px',
      marginTop: '8px', marginBottom: '8px'
    }}>
      GOODS CONSIGNMENT NOTE
    </div>

    {/* Copy title row */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', fontSize: '10px', width: '33%' }}>{type} COPY</td>
          <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center', width: '34%' }}>SUBJECT TO MUMBAI JURISDICTION</td>
         <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'right', width: '33%' }}>
            INSURANCE COVERED BY:<br />
            <span>
              {gcn.insuranceConsignor ? '☑ CONSIGNOR ' : '☐ CONSIGNOR '}
              {gcn.insuranceConsignee ? '☑ CONSIGNEE' : '☐ CONSIGNEE'}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Consignor / Consignee / Shipment */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', width: '33%' }}>
            <p style={{ margin: 0, fontSize: '8px', fontWeight: 'bold', color: '#ea580c' }}>CONSIGNOR (SENDER)</p>
            <p style={{ margin: '4px 0 2px', fontWeight: 'bold', fontSize: '9px' }}>{gcn.consignorName}</p>
            <p style={{ margin: 0, fontSize: '8px', color: '#333' }}>{gcn.consignorAddress}</p>
            {gcn.consignorGst && <p style={{ margin: '2px 0 0', fontSize: '8px' }}>GST No: {gcn.consignorGst}</p>}
          </td>
          <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', width: '33%' }}>
            <p style={{ margin: 0, fontSize: '8px', fontWeight: 'bold', color: '#ea580c' }}>CONSIGNEE (RECEIVER)</p>
            <p style={{ margin: '4px 0 2px', fontWeight: 'bold', fontSize: '9px' }}>{gcn.consigneeName}</p>
            <p style={{ margin: 0, fontSize: '8px', color: '#333' }}>{gcn.consigneeAddress}</p>
            {gcn.consigneeGst && <p style={{ margin: '2px 0 0', fontSize: '8px' }}>GST No: {gcn.consigneeGst}</p>}
          </td>
          <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', width: '34%', backgroundColor: '#fffbeb' }}>
            <p style={{ margin: 0, fontSize: '8px', fontWeight: 'bold', color: '#ea580c', marginBottom: '4px' }}>SHIPMENT DETAILS</p>
            <table style={{ width: '100%', fontSize: '8px' }}>
              <tbody>
                <tr><td style={{ width: '40%' }}>G.C. No.:</td><td style={{ fontWeight: 'bold' }}>{gcn.gcnNumber}</td></tr>
                <tr><td>VHC Ref:</td><td style={{ fontWeight: 'bold' }}>{gcn.vhcNumber || gcn.vhcId}</td></tr>
                <tr><td>Date:</td><td>{new Date(gcn.gcnDate).toLocaleDateString('en-IN')}</td></tr>
                <tr><td>From:</td><td>{gcn.fromLocation}</td></tr>
                <tr><td>To:</td><td>{gcn.toLocation}</td></tr>
                {/* ✅ FIX: Use enriched props with fallback to IDs */}
                <tr><td>Truck No.:</td><td style={{ fontWeight: 'bold' }}>{vehicleNumber || gcn.vehicleId}</td></tr>
                <tr><td>Driver:</td><td>{driverName || gcn.driverId}</td></tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Cargo */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f3f4f6' }}>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'left' }}>DESCRIPTION</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>NO. OF ARTICLES</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>PACKING</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>INVOICE NO. & DATE</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'right' }}>INVOICE VALUE (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        {(cargoItems.length ? cargoItems : [{ description: '', quantity: 0, unit: '', packingType: '', invoiceNumber: '', invoiceDate: '', invoiceAmount: 0 }]).map((it: any, i: number) => (
          <tr key={i}>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px' }}>{it.description}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>{it.quantity} {it.unit}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>{it.packingType}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>{it.invoiceNumber}{it.invoiceDate ? ' / ' + new Date(it.invoiceDate).toLocaleDateString('en-IN') : ''}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'right' }}>{it.invoiceAmount?.toFixed?.(2) ?? it.invoiceAmount}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Footer */}
    <div style={{ border: '1px solid #ea580c', backgroundColor: '#fffbeb', padding: '6px', textAlign: 'center', marginTop: 'auto', marginBottom: '8px' }}>
      <p style={{ margin: 0, fontSize: '8px', fontWeight: 'bold' }}>CAUTION</p>
      <p style={{ margin: '2px 0 0', fontSize: '7px' }}>This consignment will not be detained / delivered / re-routed without consignee bank's written permission.</p>
    </div>
    <div style={{ backgroundColor: '#78350f', color: 'white', padding: '6px', textAlign: 'center', fontSize: '7px' }}>
      <p style={{ margin: 0 }}>PAN NO: AAJFI3555P | Goods transported at owner's risk. | GST liability on consignor/consignee.</p>
    </div>
  </div>
);

export default function GCN() {
  const [vhcs, setVhcs] = useState<VHC[]>([]);
  const [gcns, setGcns] = useState<GCN[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; vehicleNumber: string }[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; fullName?: string; name?: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedVHC, setSelectedVHC] = useState<VHC | null>(null);
  const [viewingGCN, setViewingGCN] = useState<GCN | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  // Enriched data for the currently viewed/printed GCN
  const [printVehicleNumber, setPrintVehicleNumber] = useState<string>('');
  const [printDriverName, setPrintDriverName] = useState<string>('');
  const [viewCargoItems, setViewCargoItems] = useState<CargoItem[]>([]);

  // Form states
  const [consignorName, setConsignorName] = useState('');
  const [consignorAddress, setConsignorAddress] = useState('');
  const [consignorGst, setConsignorGst] = useState('');
  const [consignorPincode, setConsignorPincode] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');
  const [consigneeGst, setConsigneeGst] = useState('');
  const [consigneePincode, setConsigneePincode] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [gcnDate, setGcnDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingType, setBillingType] = useState('TO_BE_BILLED');
  const [insuranceConsignor, setInsuranceConsignor] = useState(true);
  const [insuranceConsignee, setInsuranceConsignee] = useState(true);
  const [triggerPrint, setTriggerPrint] = useState(false);
  const isAdmin = useIsAdmin();
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([{
    description: '',
    packingType: '',
    quantity: 0,
    unit: 'kg',
    weight: 0,
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: 0
  }]);

  // Location modal states
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<Location | null>(null);
  const [selectedDropLocation, setSelectedDropLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    pincode: '',
    gstNumber: '',
    type: 'PICKUP' as 'PICKUP' | 'DROP'
  });

  useEffect(() => {
    fetchData();
    fetchLocations();
  }, []);

  // Fetch vehicle, driver and cargo details when viewing a GCN
  useEffect(() => {
    if (viewingGCN) {
      Promise.all([
        api.get<any>(`/vehicles/${viewingGCN.vehicleId}`).catch(() => null),
        api.get<any>(`/drivers/${viewingGCN.driverId}`).catch(() => null),
        api.get<CargoItem[]>(`/gcn/${viewingGCN.id}/cargo`).catch(() => [] as CargoItem[]),
      ]).then(([vehicle, driver, cargo]) => {
        setPrintVehicleNumber(vehicle?.vehicleNumber || getVehicleNumber(viewingGCN.vehicleId));
        setPrintDriverName(driver?.fullName || driver?.name || getDriverName(viewingGCN.driverId));
        setViewCargoItems(Array.isArray(cargo) ? cargo : []);
                              if (triggerPrint) {
                        setTimeout(() => {
                          window.print();
                          setTriggerPrint(false);
                        }, 800); // give full time to render
                      }
      });
    } else {
      setViewCargoItems([]);
      setPrintVehicleNumber('');
      setPrintDriverName('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingGCN]);

  const fetchData = async () => {
    try {
      const [vhcData, gcnData, billingData, vehicleData, driverData, customerData] = await Promise.all([
        api.get<VHC[]>('/vhc'),
        api.get<GCN[]>('/gcn'),
        api.get<Billing[]>('/billing'),
        api.get<any[]>('/vehicles').catch(() => []),
        api.get<any[]>('/drivers').catch(() => []),
        api.get<any[]>('/customers').catch(() => []),
      ]);
      setVhcs(vhcData);
           setGcns(
                      gcnData.map((gcn) => ({
                        ...gcn,
                        insuranceConsignor: Boolean(gcn.insuranceConsignor),
                        insuranceConsignee: Boolean(gcn.insuranceConsignee),
                      }))
                    );
      setBillings(billingData);
      setVehicles(vehicleData || []);
      setDrivers(driverData || []);
      setCustomers(customerData || []);
    } catch (error) {
      console.error('Failed to fetch ', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleNumber = (id?: string) =>
    vehicles.find(v => v.id === id)?.vehicleNumber || '—';
  const getDriverName = (id?: string) => {
    const d = drivers.find(d => d.id === id);
    return d?.fullName || d?.name || '—';
  };
  const getCustomerName = (id?: string) =>
    customers.find(c => c.id === id)?.name || '—';
  const getVhcNumber = (id?: string) =>
    vhcs.find(v => v.id === id)?.vhcNumber || '—';

  const fetchLocations = async () => {
    try {
      const data = await api.get<Location[]>('/locations');
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleSelectPickupLocation = (location: Location) => {
    setSelectedPickupLocation(location);
    setConsignorName(location.name);
    setConsignorAddress(location.address);
    setConsignorGst(location.gstNumber || '');
    setConsignorPincode(location.pincode);
    setShowPickupModal(false);
  };

  const handleSelectDropLocation = (location: Location) => {
    setSelectedDropLocation(location);
    setConsigneeName(location.name);
    setConsigneeAddress(location.address);
    setConsigneeGst(location.gstNumber || '');
    setConsigneePincode(location.pincode);
    setShowDropModal(false);
  };

  const handleAddLocation = async () => {
    try {
      const saved = await api.post('/locations', newLocation);
      await fetchLocations();
      setShowAddLocationModal(false);
      setNewLocation({ name: '', address: '', pincode: '', gstNumber: '', type: 'PICKUP' });

      if (newLocation.type === 'PICKUP') {
        handleSelectPickupLocation(saved as any);
      } else {
        handleSelectDropLocation(saved as any);
      }
    } catch (error) {
      console.error('Failed to add location:', error);
      notify('Failed to add location');
    }
  };

  const handleDeleteGCN = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this GCN?')) return;
    try {
      await api.delete(`/gcn/${id}`);
      fetchData();
      notify('GCN deleted successfully');
    } catch (error) {
      console.error('Failed to delete GCN:', error);
      notify('Failed to delete GCN');
    }
  };

  const handleCreateGCN = async (vhc: VHC) => {
    setSelectedVHC(vhc);
    setShowCreateForm(true);
    setFromLocation(vhc.fromLocation);
    setToLocation(vhc.toLocation);
    try {
      const customers = await api.get<any[]>('/customers');
      const customer = customers.find(c => c.id === vhc.customerId);
      if (customer) {
        setConsignorName(customer.name);
        setConsignorAddress(customer.address || '');
        setConsignorGst(customer.gstNumber || '');
        setConsignorPincode(customer.pincode || '');
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    }
  };

  const handleGenerateGCN = async () => {
    try {
      const formData = new FormData();
      // Empty value tells the backend to assign the authoritative GCN-YYYY-NNNNNN number.
      formData.append('gcnNumber', '');
      formData.append('vhcId', selectedVHC?.id || '');
      formData.append('customerId', selectedVHC?.customerId || '');
      formData.append('vehicleId', selectedVHC?.vehicleId || '');
      formData.append('driverId', selectedVHC?.driverId || '');
      formData.append('consignorName', consignorName);
      formData.append('consignorAddress', consignorAddress);
      formData.append('consignorGst', consignorGst);
      formData.append('consignorPincode', consignorPincode);
      formData.append('consigneeName', consigneeName);
      formData.append('consigneeAddress', consigneeAddress);
      formData.append('consigneeGst', consigneeGst);
      formData.append('consigneePincode', consigneePincode);
      formData.append('fromLocation', fromLocation);
      formData.append('toLocation', toLocation);
      formData.append('gcnDate', gcnDate);
      formData.append('billingType', billingType);
      formData.append('insuranceConsignor', insuranceConsignor.toString());
      formData.append('insuranceConsignee', insuranceConsignee.toString());
      formData.append('cargoItems', JSON.stringify(cargoItems));

      await api.post('/gcn', formData);

      setShowCreateForm(false);
      setSelectedVHC(null);
      fetchData();
      notify('GCN created successfully!');
    } catch (error) {
      console.error('Failed to create GCN:', error);
      notify('Failed to create GCN.');
    }
  };

  const handleViewBilling = () => {
    setShowBilling(true);
  };

  const handleMarkPaid = async (billingId: string) => {
    try {
      await api.put(`/billing/${billingId}/status`, new URLSearchParams({ status: 'PAID' }));
      fetchData();
    } catch (error) {
      notify('Failed to update status');
    }
  };

  const hasGCN = (vhcId: string) => {
    return gcns.some(gcn => gcn.vhcId === vhcId);
  };

  const filteredVHCs = vhcs.filter(vhc =>
    vhc.vhcNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.address.toLowerCase().includes(locationSearch.toLowerCase()) ||
    loc.pincode.includes(locationSearch)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show Billing Page
  if (showBilling) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing</h1>
          <p className="text-gray-600 mb-6">Auto-generated from Challans & GCNs</p>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Total Billed</p>
              <p className="text-2xl font-bold text-orange-600">₹{billings.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
              <p className="text-sm text-gray-500">{billings.length} entries</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">₹{billings.filter(b => b.status === 'PENDING').reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600">₹{billings.filter(b => b.status === 'PAID').reduce((sum, b) => sum + (b.paidAmount || 0), 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
            </div>
          </div>
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
                {billings.map(billing => (
                  <tr key={billing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-orange-600">{billing.billNumber}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{new Date(billing.billDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 font-medium">{billing.customerName}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">{billing.sourceType}</span></td>
                    <td className="px-6 py-4 font-semibold">₹{(billing.amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${billing.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{billing.status}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {billing.status !== 'PAID' && <button onClick={() => handleMarkPaid(billing.id)} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Mark Paid</button>}
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded"><Eye className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }

  // Show Create Form
  if (showCreateForm && selectedVHC) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 p-8">
          <button onClick={() => setShowCreateForm(false)} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" />Back to VHC List</button>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">New Goods Consignment Note</h1>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="bg-orange-50 p-4 rounded-lg mb-6">
              <p className="text-xs text-orange-600 font-semibold mb-2">AUTO-FILLED FROM VHC: {selectedVHC.vhcNumber}</p>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500">CUSTOMER</p><input value={getCustomerName(selectedVHC.customerId)} className="w-full px-3 py-2 border rounded text-sm bg-gray-50" readOnly /></div>
                <div><p className="text-xs text-gray-500">VEHICLE NO.</p><input value={getVehicleNumber(selectedVHC.vehicleId)} className="w-full px-3 py-2 border rounded text-sm bg-gray-50" readOnly /></div>
                <div><p className="text-xs text-gray-500">DRIVER</p><input value={getDriverName(selectedVHC.driverId)} className="w-full px-3 py-2 border rounded text-sm bg-gray-50" readOnly /></div>
                {/* <div><p className="text-xs text-gray-500">CUSTOMER</p><input value={consignorName} onChange={e => setConsignorName(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" /></div>
                <div><p className="text-xs text-gray-500">VEHICLE NO.</p><input value={selectedVHC.vehicleId} className="w-full px-3 py-2 border rounded text-sm bg-gray-50" readOnly /></div>
                <div><p className="text-xs text-gray-500">DRIVER</p><input value={selectedVHC.driverId} className="w-full px-3 py-2 border rounded text-sm bg-gray-50" readOnly /></div> */}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">1. Consignor Details (Shipper)</h3>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-xs text-orange-600 font-semibold mb-2">CONSIGNOR PICKUP LOCATION</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowPickupModal(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"><MapPin className="w-4 h-4" />{selectedPickupLocation ? selectedPickupLocation.name : 'Select Pickup Location'}</button>
                  <button type="button" onClick={() => { setNewLocation({ ...newLocation, type: 'PICKUP' }); setShowAddLocationModal(true); }} className="px-4 py-2 border border-orange-600 text-orange-600 rounded hover:bg-orange-50">+ Add Pickup Location</button>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">2. Consignee Details (Receiver)</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-600 font-semibold mb-2">CONSIGNEE DROP LOCATION</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowDropModal(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"><MapPin className="w-4 h-4" />{selectedDropLocation ? selectedDropLocation.name : 'Select Drop Location'}</button>
                  <button type="button" onClick={() => { setNewLocation({ ...newLocation, type: 'DROP' }); setShowAddLocationModal(true); }} className="px-4 py-2 border border-orange-600 text-orange-600 rounded hover:bg-orange-50">+ Add Drop Location</button>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">3. GCN Date</h3>
              <input type="date" value={gcnDate} onChange={e => setGcnDate(e.target.value)} className="px-3 py-2 border rounded" />
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">4. Billing & Insurance Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-xs text-orange-600 font-semibold mb-2">BILL TO PARTY</p>
                  <div className="flex gap-2">
                    {['To Pay', 'Paid', 'To Be Billed'].map(type => (
                      <button key={type} onClick={() => setBillingType(type.replace(/\s+/g, '_').toUpperCase())} className={`px-3 py-1 rounded text-xs ${billingType === type.replace(/\s+/g, '_').toUpperCase() ? 'bg-orange-600 text-white' : 'bg-white border'}`}>{type}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-xs text-blue-600 font-semibold mb-2">INSURANCE COVERED BY</p>
                  <label className="flex items-center gap-2 mb-1"><input type="checkbox" checked={insuranceConsignor} onChange={e => setInsuranceConsignor(e.target.checked)} /><span className="text-sm">Consignor</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={insuranceConsignee} onChange={e => setInsuranceConsignee(e.target.checked)} /><span className="text-sm">Consignee</span></label>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">5. Cargo Details</h3>
              {cargoItems.map((item, index) => (
                <div key={index} className="border rounded p-4 mb-3">
                  <div className="grid grid-cols-4 gap-3 mb-2">
                    <input placeholder="Description" value={item.description} onChange={e => { const newItems = [...cargoItems]; newItems[index].description = e.target.value; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                    <input placeholder="Packing Type" value={item.packingType} onChange={e => { const newItems = [...cargoItems]; newItems[index].packingType = e.target.value; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                    <input placeholder="Quantity" type="number" value={item.quantity} onChange={e => { const newItems = [...cargoItems]; newItems[index].quantity = parseInt(e.target.value) || 0; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                    <input placeholder="Unit" value={item.unit} onChange={e => { const newItems = [...cargoItems]; newItems[index].unit = e.target.value; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <input placeholder="Weight" type="number" value={item.weight} onChange={e => { const newItems = [...cargoItems]; newItems[index].weight = parseFloat(e.target.value) || 0; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                    <input placeholder="Invoice No." value={item.invoiceNumber} onChange={e => { const newItems = [...cargoItems]; newItems[index].invoiceNumber = e.target.value; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                    <input type="date" value={item.invoiceDate} onChange={e => { const newItems = [...cargoItems]; newItems[index].invoiceDate = e.target.value; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                    <input placeholder="Amount" type="number" value={item.invoiceAmount} onChange={e => { const newItems = [...cargoItems]; newItems[index].invoiceAmount = parseFloat(e.target.value) || 0; setCargoItems(newItems); }} className="px-3 py-2 border rounded" />
                  </div>
                </div>
              ))}
              <button onClick={() => setCargoItems([...cargoItems, { description: '', packingType: '', quantity: 0, unit: 'kg', weight: 0, invoiceNumber: '', invoiceDate: '', invoiceAmount: 0 }])} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm"><Plus className="w-4 h-4" /> Add Cargo Row</button>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setShowCreateForm(false)} className="px-6 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleGenerateGCN} className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Generate Goods Consignment Note</button>
            </div>
          </div>
          {showPickupModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Select Pickup Location (Consignor)</h3><button onClick={() => setShowPickupModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
                <div className="flex gap-2 mb-4"><input type="text" placeholder="Search by name, address or pincode..." value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} className="flex-1 px-3 py-2 border rounded" /><button onClick={() => { setNewLocation({ ...newLocation, type: 'PICKUP' }); setShowAddLocationModal(true); }} className="px-4 py-2 border border-orange-600 text-orange-600 rounded hover:bg-orange-50">+ Add New</button></div>
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-bold">#</th><th className="px-4 py-2 text-left text-xs font-bold">NAME / COMPANY</th><th className="px-4 py-2 text-left text-xs font-bold">ADDRESS</th><th className="px-4 py-2 text-left text-xs font-bold">PINCODE</th><th className="px-4 py-2 text-left text-xs font-bold">GST NO.</th><th className="px-4 py-2 text-right text-xs font-bold">ACTION</th></tr></thead><tbody>{filteredLocations.filter(loc => loc.type === 'PICKUP').map((loc, index) => (<tr key={loc.id} className="border-t hover:bg-gray-50"><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3 font-semibold">{loc.name}</td><td className="px-4 py-3 text-sm">{loc.address}</td><td className="px-4 py-3 text-sm">{loc.pincode}</td><td className="px-4 py-3 text-sm">{loc.gstNumber || '-'}</td><td className="px-4 py-3 text-right"><button onClick={() => handleSelectPickupLocation(loc)} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Select</button></td></tr>))}</tbody></table></div>
              </div>
            </div>
          )}
          {showDropModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Select Drop Location (Consignee)</h3><button onClick={() => setShowDropModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
                <div className="flex gap-2 mb-4"><input type="text" placeholder="Search by name, address or pincode..." value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} className="flex-1 px-3 py-2 border rounded" /><button onClick={() => { setNewLocation({ ...newLocation, type: 'DROP' }); setShowAddLocationModal(true); }} className="px-4 py-2 border border-orange-600 text-orange-600 rounded hover:bg-orange-50">+ Add New</button></div>
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-bold">#</th><th className="px-4 py-2 text-left text-xs font-bold">NAME / COMPANY</th><th className="px-4 py-2 text-left text-xs font-bold">ADDRESS</th><th className="px-4 py-2 text-left text-xs font-bold">PINCODE</th><th className="px-4 py-2 text-left text-xs font-bold">GST NO.</th><th className="px-4 py-2 text-right text-xs font-bold">ACTION</th></tr></thead><tbody>{filteredLocations.filter(loc => loc.type === 'DROP').map((loc, index) => (<tr key={loc.id} className="border-t hover:bg-gray-50"><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3 font-semibold">{loc.name}</td><td className="px-4 py-3 text-sm">{loc.address}</td><td className="px-4 py-3 text-sm">{loc.pincode}</td><td className="px-4 py-3 text-sm">{loc.gstNumber || '-'}</td><td className="px-4 py-3 text-right"><button onClick={() => handleSelectDropLocation(loc)} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">Select</button></td></tr>))}</tbody></table></div>
              </div>
            </div>
          )}
          {showAddLocationModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold mb-4">Add {newLocation.type === 'PICKUP' ? 'Pickup' : 'Drop'} Location</h3>
                <div className="space-y-3">
                  <input placeholder="Location Name / Point Label" value={newLocation.name} onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} className="w-full px-3 py-2 border rounded" />
                  <input placeholder="Address 1 *" value={newLocation.address} onChange={(e) => setNewLocation({...newLocation, address: e.target.value})} className="w-full px-3 py-2 border rounded" />
                  <input placeholder="Pin Code *" value={newLocation.pincode} onChange={(e) => setNewLocation({...newLocation, pincode: e.target.value})} className="w-full px-3 py-2 border rounded" />
                  <input placeholder="GST Number (optional)" value={newLocation.gstNumber} onChange={(e) => setNewLocation({...newLocation, gstNumber: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowAddLocationModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                  <button onClick={handleAddLocation} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Save {newLocation.type === 'PICKUP' ? 'Pickup' : 'Drop'} Location</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Main GCN List Page
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-64 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GCN Preparation</h1>
        <p className="text-gray-600 mb-6">Select a Vehicle Hire Challan to create a GCN</p>

        {/* VHC List - ONLY SHOW VHCs WITHOUT GCN */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Vehicle Hire Challans</h3>
            <input placeholder="Search VHC..." className="px-3 py-1 border rounded text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-6 py-3 text-left text-xs font-bold">Challan No.</th><th className="px-6 py-3 text-left text-xs font-bold">Date</th><th className="px-6 py-3 text-left text-xs font-bold">Customer</th><th className="px-6 py-3 text-left text-xs font-bold">Vehicle</th><th className="px-6 py-3 text-left text-xs font-bold">Driver</th><th className="px-6 py-3 text-left text-xs font-bold">Route</th><th className="px-6 py-3 text-right text-xs font-bold">Action</th></tr>
            </thead>
            <tbody>
              {filteredVHCs.filter(vhc => !hasGCN(vhc.id)).map(vhc => (
                <tr key={vhc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-orange-600">{vhc.vhcNumber}</td>
                  <td className="px-6 py-4 text-sm">{new Date(vhc.vhcDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4">{getCustomerName(vhc.customerId)}</td>
                  <td className="px-6 py-4 text-sm font-mono">{getVehicleNumber(vhc.vehicleId)}</td>
                  <td className="px-6 py-4 text-sm">{getDriverName(vhc.driverId)}</td>
                  <td className="px-6 py-4 text-sm">{vhc.fromLocation} → {vhc.toLocation}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => handleCreateGCN(vhc)} className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700">+ Create GCN</button></td>
                </tr>
              ))}
              {filteredVHCs.filter(vhc => !hasGCN(vhc.id)).length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">All VHCs have GCNs created. No pending VHCs.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* GCN List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">All Goods Consignment Notes ({gcns.length})</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-6 py-3 text-left text-xs font-bold">GCN No.</th><th className="px-6 py-3 text-left text-xs font-bold">Date</th><th className="px-6 py-3 text-left text-xs font-bold">Customer</th><th className="px-6 py-3 text-left text-xs font-bold">Route</th><th className="px-6 py-3 text-left text-xs font-bold">Bill To</th><th className="px-6 py-3 text-right text-xs font-bold">Actions</th></tr>
            </thead>
            <tbody>
              {/* {gcns.map(gcn => ( */}
               {[...gcns]
                .sort((a, b) => b.gcnNumber.localeCompare(a.gcnNumber))
                .map(gcn => (
                <tr key={gcn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-orange-600">{gcn.gcnNumber}</td>
                  <td className="px-6 py-4 text-sm">{new Date(gcn.gcnDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4">{gcn.consignorName}</td>
                  <td className="px-6 py-4 text-sm">{gcn.fromLocation} → {gcn.toLocation}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{gcn.billingType}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setViewingGCN(gcn)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
                      {/* <button
                                onClick={() => {
                                  setViewingGCN(gcn);
                                  setTriggerPrint(true);
                                }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button> */}
                      {isAdmin && <button onClick={() => handleDeleteGCN(gcn.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* View GCN Modal */}
      {viewingGCN && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Goods Consignment Note (GCN)</h2>
                <button onClick={() => setViewingGCN(null)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="text-center mb-6">
                  <img src="/logo.jpeg" alt="Logo" className="h-12 w-auto mx-auto mb-2" />
                  <h1 className="text-xl font-bold text-gray-900">INDTRANS FREIGHT SOLUTIONS LLP</h1>
                  <p className="text-sm text-gray-600 mt-1">103, 1st Floor Grohitam Premises, APMC Market Sector 19, Navi Mumbai – 400703</p>
                  <div className="flex justify-center mt-3"><span className="bg-orange-500 text-white px-6 py-1.5 rounded-full text-sm font-bold">GOODS CONSIGNMENT NOTE (GCN)</span></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div><p className="text-xs text-gray-500 uppercase mb-1">GCN No:</p><p className="font-bold text-gray-900">{viewingGCN.gcnNumber}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase mb-1">Date:</p><p className="font-semibold text-gray-900">{new Date(viewingGCN.gcnDate).toLocaleDateString('en-IN')}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase mb-1">VHC Ref:</p><p className="font-semibold text-orange-600">{viewingGCN.vhcNumber || getVhcNumber(viewingGCN.vhcId)}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6 bg-orange-50 p-4 rounded-lg">
                  <div><p className="text-xs text-gray-500 uppercase mb-1">Vehicle No:</p><p className="font-bold text-gray-900 font-mono">{printVehicleNumber || getVehicleNumber(viewingGCN.vehicleId)}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase mb-1">Driver:</p><p className="font-semibold text-gray-900">{printDriverName || getDriverName(viewingGCN.driverId)}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">CONSIGNOR (SHIPPER)</h3>
                    <p className="font-bold text-gray-900">{viewingGCN.consignorName}</p>
                    <p className="text-sm text-gray-600 mt-1">{viewingGCN.consignorAddress}</p>
                    {viewingGCN.consignorGst && <p className="text-xs text-gray-500 mt-2">GST: {viewingGCN.consignorGst}</p>}
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">CONSIGNEE (RECEIVER)</h3>
                    <p className="font-bold text-gray-900">{viewingGCN.consigneeName}</p>
                    <p className="text-sm text-gray-600 mt-1">{viewingGCN.consigneeAddress}</p>
                    {viewingGCN.consigneeGst && <p className="text-xs text-gray-500 mt-2">GST: {viewingGCN.consigneeGst}</p>}
                  </div>
                </div>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg"><p className="text-sm"><span className="font-semibold">FROM</span> {viewingGCN.fromLocation} <span className="mx-3 text-orange-600">→</span> <span className="font-semibold">TO</span> {viewingGCN.toLocation}</p></div>
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg"><p className="text-xs font-bold text-gray-500 uppercase mb-2">INSURANCE COVERED BY</p>
                  <p className="text-sm font-semibold">{viewingGCN.insuranceConsignor ? '☑ Consignor' : '☐ Consignor'}</p>
                  <p className="text-sm font-semibold">{viewingGCN.insuranceConsignee ? '☑ Consignee' : '☐ Consignee'}</p></div>

                {/* Cargo Details */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">CARGO DETAILS</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Description</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Packing</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Qty</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Weight</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Invoice No.</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Inv. Date</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Inv. Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewCargoItems.length === 0 ? (
                          <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-500">No cargo items recorded.</td></tr>
                        ) : viewCargoItems.map((it, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">{it.description}</td>
                            <td className="px-3 py-2">{it.packingType}</td>
                            <td className="px-3 py-2 text-right">{it.quantity} {it.unit}</td>
                            <td className="px-3 py-2 text-right">{it.weight}</td>
                            <td className="px-3 py-2">{it.invoiceNumber}</td>
                            <td className="px-3 py-2">{it.invoiceDate ? new Date(it.invoiceDate).toLocaleDateString('en-IN') : ''}</td>
                            <td className="px-3 py-2 text-right">₹{(it.invoiceAmount ?? 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* <button
                    onClick={() => { setTimeout(() => window.print(), 800); }}
                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-semibold"
                  >
                    <Printer className="w-4 h-4" />
                    Print 3 Copies / Save PDF
                  </button> */}
                  <button onClick={() => setViewingGCN(null)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Template - 3 identical copies, only title differs */}
      {viewingGCN && (
        <div className="print-only" style={{ display: 'none' }}>
          <PrintCopyPage
            type="DRIVER"
            gcn={viewingGCN}
            cargoItems={viewCargoItems}
            vehicleNumber={printVehicleNumber}
            driverName={printDriverName}
          />
          <PrintCopyPage
            type="CONSIGNOR"
            gcn={viewingGCN}
            cargoItems={viewCargoItems}
            vehicleNumber={printVehicleNumber}
            driverName={printDriverName}
          />
          <PrintCopyPage
            type="CONSIGNEE"
            gcn={viewingGCN}
            cargoItems={viewCargoItems}
            vehicleNumber={printVehicleNumber}
            driverName={printDriverName}
          />
        </div>
      )}

                  <style>{`

                /* 👇 IMPORTANT: hide print content normally */
                .print-only {
                  display: none;
                }

                @media print {
                  @page { size: A4; margin: 0; }

                  body {
                    background: white !important;
                  }

                  /* hide everything */
                  body * {
                    visibility: hidden;
                  }

                  /* show only print section */
                  .print-only {
                    display: block !important;
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }

                  /* make all children visible */
                  .print-only, 
                  .print-only * {
                    visibility: visible;
                  }

                  /* page control */
                  .print-page {
                    page-break-after: always;
                    page-break-inside: avoid;
                  }

                  .print-page:last-child {
                    page-break-after: auto;
                  }
                }

              `}</style>
    </div>
  );
}