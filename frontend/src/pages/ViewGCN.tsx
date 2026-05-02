import { useState, useEffect } from 'react';
import { notify } from '../services/notify';
import { api } from '../services/api';
import { Eye, Printer, Trash2, Search, ArrowLeft, Upload, X, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useIsAdmin } from '../hooks/useIsAdmin';
// --- Interfaces ---
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
  receiptPath?: string;
  receiptOriginalName?: string;
  status: string;
  createdAt: string;
}

interface CargoItem {
  id: string;
  gcnId: string;
  description: string;
  packingType: string;
  quantity: number;
  unit: string;
  weight: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
}

interface Driver {
  id: string;
  fullName: string;
}

interface FreightForm {
  customerFreight: string;
  advance: string;
  loadingCharge: string;
  unloadingCharge: string;
  detentionCharge: string;
  othersCharge: string;
  paymentTerms: string;
  remarks: string;
}

const formatBillingTypeLabel = (billingType?: string, paymentTerms?: string) => {
  if (paymentTerms) {
    return paymentTerms;
  }

  switch (billingType) {
    case 'TO_PAY':
      return 'To Pay';
    case 'PAID':
      return 'Paid';
    case 'TO_BE_BILLED':
      return 'To Be Billed';
    default:
      return 'To Pay';
  }
};

const toBillingTypeValue = (paymentTerms: string) => {
  switch (paymentTerms) {
    case 'Paid':
      return 'PAID';
    case 'To Be Billed':
      return 'TO_BE_BILLED';
    case 'To Pay':
    default:
      return 'TO_PAY';
  }
};

// --- Helper Component for Print Page (Ensures Full Page Layout) ---
const PrintCopyPage = ({
  type,
  gcn,
  vehicleNumber,
  driverName,
  cargoItems
}: {
  type: string;
  gcn: GCN;
  vehicleNumber: string;
  driverName: string;
  cargoItems: CargoItem[]
}) => (
  <div className="print-page" style={{
    width: '210mm',
    minHeight: '297mm', // A4 Height
    padding: '10mm',
    fontFamily: 'Arial, sans-serif',
    fontSize: '10px',
    boxSizing: 'border-box',
    pageBreakAfter: 'always',
    pageBreakInside: 'avoid',
    background: 'white',
    display: 'flex',
    flexDirection: 'column'
  }}>
    {/* Header Section */}
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
      <tbody>
        <tr>
          <td style={{ width: '60%', verticalAlign: 'top', padding: '0' }}>
            <img src="/logo.jpeg" alt="Logo" style={{ height: '40px', marginBottom: '5px' }} />
            <h1 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#ea580c' }}>INDTRANS FREIGHT SOLUTIONS LLP</h1>
            <p style={{ margin: '2px 0', fontSize: '8px', color: '#666' }}>Your reliable Transportation Partner</p>
            <p style={{ margin: '2px 0', fontSize: '8px', color: '#666' }}>
              103, Grohitam Premises APMC market Sector 19 Vashi,<br />
              Navi Mumbai Maharashtra 400703<br />
              Ph: 8850397196 | Email: operations@indtransfreightsolutions.com
            </p>
          </td>
          <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'right', padding: '0' }}>
            <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold' }}>GST NO: 27AAJFI355P1ZQ</p>
            <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold' }}>PAN: AAJFI3555P</p>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Orange Banner */}
    <div style={{
      backgroundColor: '#ea580c',
      color: 'white',
      textAlign: 'center',
      padding: '6px',
      fontWeight: 'bold',
      fontSize: '12px',
      marginTop: '8px',
      marginBottom: '8px'
    }}>
      GOODS CONSIGNMENT NOTE
    </div>

    {/* Copy Type Header Row */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', fontSize: '10px', width: '33%' }}>{type} COPY</td>
          <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center', width: '34%' }}>SUBJECT TO MUMBAI JURISDICTION</td>
          <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'right', width: '33%' }}>
            INSURANCE COVERED BY:<br />
            {/* {gcn.insuranceConsignor ? '☑ CONSIGNOR ' : '☐ CONSIGNOR '}
            {gcn.insuranceConsignee ? '☑ CONSIGNEE' : '☐ CONSIGNEE'} */}
           
                                    <span style={{ marginRight: '10px' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        width: '10px',
                                        height: '10px',
                                        border: '1px solid #000',
                                        marginRight: '4px',
                                        textAlign: 'center',
                                        lineHeight: '10px',
                                        fontSize: '8px'
                                      }}>
                                        {gcn.insuranceConsignor ? '✓' : ''}
                                      </span>
                                      CONSIGNOR
                                    </span>

                                    <span>
                                      <span style={{
                                        display: 'inline-block',
                                        width: '10px',
                                        height: '10px',
                                        border: '1px solid #000',
                                        marginRight: '4px',
                                        textAlign: 'center',
                                        lineHeight: '10px',
                                        fontSize: '8px'
                                      }}>
                                        {gcn.insuranceConsignee ? '✓' : ''}
                                      </span>
                                      CONSIGNEE
                                    </span>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Main Info Grid - 3 Columns */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <tbody>
        <tr>
          {/* Consignor Column */}
          <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', width: '33%' }}>
            <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold', color: '#ea580c' }}>CONSIGNOR (SENDER)</p>
            <p style={{ margin: '4px 0 2px', fontWeight: 'bold', fontSize: '9px' }}>{gcn.consignorName}</p>
            <p style={{ margin: '0', fontSize: '8px', color: '#333' }}>{gcn.consignorAddress}</p>
            {gcn.consignorGst && <p style={{ margin: '2px 0 0', fontSize: '8px' }}>GST No: {gcn.consignorGst}</p>}
          </td>

          {/* Consignee Column */}
          <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', width: '33%' }}>
            <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold', color: '#ea580c' }}>CONSIGNEE (RECEIVER)</p>
            <p style={{ margin: '4px 0 2px', fontWeight: 'bold', fontSize: '9px' }}>{gcn.consigneeName}</p>
            <p style={{ margin: '0', fontSize: '8px', color: '#333' }}>{gcn.consigneeAddress}</p>
            {gcn.consigneeGst && <p style={{ margin: '2px 0 0', fontSize: '8px' }}>GST No: {gcn.consigneeGst}</p>}
          </td>

          {/* Shipment Details Column */}
          <td style={{ border: '1px solid #000', padding: '6px', verticalAlign: 'top', width: '34%', backgroundColor: '#fffbeb' }}>
            <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold', color: '#ea580c', marginBottom: '4px' }}>SHIPMENT DETAILS</p>
            <table style={{ width: '100%', fontSize: '8px' }}>
              <tbody>
                <tr><td style={{ padding: '1px 0', width: '40%' }}>G.C. No.:</td><td style={{ fontWeight: 'bold' }}>{gcn.gcnNumber}</td></tr>
                <tr><td style={{ padding: '1px 0' }}>Date:</td><td>{new Date(gcn.gcnDate).toLocaleDateString('en-IN')}</td></tr>
                <tr><td style={{ padding: '1px 0' }}>From:</td><td>{gcn.fromLocation}</td></tr>
                <tr><td style={{ padding: '1px 0' }}>To:</td><td>{gcn.toLocation}</td></tr>
                <tr><td style={{ padding: '1px 0' }}>Truck No.:</td><td style={{ fontWeight: 'bold' }}>{vehicleNumber}</td></tr>
                <tr><td style={{ padding: '1px 0' }}>Driver:</td><td>{driverName}</td></tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Goods & Invoice Details Table */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f3f4f6' }}>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'left' }}>DESCRIPTION (SAID TO CONTAIN)</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>NO. OF ARTICLES</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>MODE OF PACKING</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>INVOICE NO. & DATE</th>
          <th style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'right' }}>INVOICE VALUE (RS.)</th>
        </tr>
      </thead>
      <tbody>
        {cargoItems.map((item) => (
          <tr key={item.id}>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px' }}>{item.description}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>{item.packingType}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'center' }}>{item.invoiceNumber} / {new Date(item.invoiceDate).toLocaleDateString('en-IN')}</td>
            <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px', textAlign: 'right' }}>Rs. {item.invoiceAmount.toFixed(2)}</td>
          </tr>
        ))}
        {/* Empty rows for filling */}
        {[...Array(4)].map((_, i) => (
          <tr key={`empty-${i}`}>
            <td style={{ border: '1px solid #000', padding: '4px', height: '16px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
            <td style={{ border: '1px solid #000', padding: '4px' }}>&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Weight & Rate / Charges Section */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '6px', width: '50%', verticalAlign: 'top' }}>
            <p style={{ margin: '0 0 6px', fontSize: '8px', fontWeight: 'bold', color: '#ea580c' }}>WEIGHT & RATE</p>
            <table style={{ width: '100%', fontSize: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '2px 0', width: '60%' }}>Weight Actual (Kgs):</td>
                  <td style={{ fontWeight: 'bold' }}>{cargoItems.reduce((sum, item) => sum + item.weight, 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0' }}>Weight Charged (Kgs):</td>
                  <td>{cargoItems.reduce((sum, item) => sum + item.weight, 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0' }}>Rate (Rs/Kg):</td>
                  <td>__________</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td style={{ border: '1px solid #000', padding: '6px', width: '50%', verticalAlign: 'top' }}>
            <p style={{ margin: '0 0 6px', fontSize: '8px', fontWeight: 'bold', color: '#ea580c' }}>CHARGES</p>
            <table style={{ width: '100%', fontSize: '8px' }}>
              <tbody>
                <tr><td style={{ padding: '2px 0', width: '40%' }}>Freight (Rs.):</td><td>{gcn.customerFreight ? gcn.customerFreight.toFixed(2) : '__________'}</td></tr>
                <tr><td style={{ padding: '2px 0' }}>Advance (Rs.):</td><td>{gcn.advance ? gcn.advance.toFixed(2) : '__________'}</td></tr>
                <tr><td style={{ padding: '2px 0' }}>Hamaali:</td><td>{gcn.loadingCharge ? gcn.loadingCharge.toFixed(2) : '__________'}</td></tr>
                <tr><td style={{ padding: '2px 0' }}>S.T. Charge:</td><td>{gcn.unloadingCharge ? gcn.unloadingCharge.toFixed(2) : '__________'}</td></tr>
                <tr><td style={{ padding: '2px 0' }}>Duty:</td><td>{gcn.detentionCharge ? gcn.detentionCharge.toFixed(2) : '__________'}</td></tr>
                <tr><td style={{ padding: '2px 0' }}>Taxes:</td><td>{gcn.othersCharge ? gcn.othersCharge.toFixed(2) : '__________'}</td></tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#fffbeb' }}>
                  <td style={{ padding: '4px 2px' }}>GRAND TOTAL:</td>
                  <td>__________</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Amount Fields */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px' }}>Amount to Pay: Rs. _____ P. _____</td>
          <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px' }}>Amount Paid: Rs. _____ P. _____</td>
          <td style={{ border: '1px solid #000', padding: '4px', fontSize: '8px' }}>Remarks: {gcn.remarks || '_______________'}</td>
        </tr>
      </tbody>
    </table>

    {/* Payment Status & Signature */}
    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '8px' }}>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '6px', width: '50%' }}>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <span style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '8px', fontWeight: 'bold', backgroundColor: gcn.billingType === 'TO_PAY' ? '#000' : 'white', color: gcn.billingType === 'TO_PAY' ? 'white' : 'black' }}>TO PAY</span>
              <span style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '8px', fontWeight: 'bold' }}>PAID</span>
              <span style={{ border: '1px solid #000', padding: '2px 6px', fontSize: '8px', fontWeight: 'bold' }}>TO BE BILLED</span>
            </div>
          </td>
          <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', width: '50%' }}>
            <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold' }}>FOR INDTRANS FREIGHT SOLUTIONS LLP</p>
            <div style={{ marginTop: '20px', borderTop: '1px solid #000', width: '150px', marginLeft: 'auto' }}></div>
            <p style={{ margin: '2px 0 0', fontSize: '8px', fontWeight: 'bold' }}>AUTHORISED SIGNATURE</p>
          </td>
        </tr>
      </tbody>
    </table>

    {/* Computer Generated Note */}
    <p style={{ margin: '4px 0', fontSize: '7px', color: '#666', fontStyle: 'italic' }}>This is a computer generated document, no need signature</p>

    {/* Caution Box */}
    <div style={{
      border: '1px solid #ea580c',
      backgroundColor: '#fffbeb',
      padding: '6px',
      textAlign: 'center',
      marginBottom: '8px',
      marginTop: 'auto' // Pushes this section to the bottom if content is short
    }}>
      <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold' }}>CAUTION</p>
      <p style={{ margin: '2px 0 0', fontSize: '7px' }}>This consignment will not be detained/delivered/re-routed or re-book without consignee's Bank's written permission will be delivered at the destination</p>
    </div>

    {/* Footer Banner */}
    <div style={{
      backgroundColor: '#78350f',
      color: 'white',
      padding: '6px',
      textAlign: 'center',
      fontSize: '7px'
    }}>
      <p style={{ margin: '0' }}>PAN NO: AAJFI3555P | Goods transported at owner's risk. | GST liability on consignor/consignee.<br />
      Company is not responsible for any damage or loss of goods during transit.</p>
    </div>
  </div>
);

// --- Main Component ---
export default function ViewGCN() {
  const [gcns, setGcns] = useState<GCN[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [viewingGCN, setViewingGCN] = useState<GCN | null>(null);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = useIsAdmin();

  // Modals State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [showFreightModal, setShowFreightModal] = useState(false);
  const [freightForm, setFreightForm] = useState<FreightForm>({
    customerFreight: '',
    advance: '',
    loadingCharge: '',
    unloadingCharge: '',
    detentionCharge: '',
    othersCharge: '',
    paymentTerms: 'To Pay',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gcnData, vehicleData, driverData] = await Promise.all([
        api.get<GCN[]>('/gcn'),
        api.get<Vehicle[]>('/vehicles'),
        api.get<Driver[]>('/drivers'),
      ]);
      setGcns(gcnData);
      setVehicles(vehicleData);
      setDrivers(driverData);
    } catch (error) {
      console.error('Failed to fetch ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGCN = async (gcn: GCN) => {
    setViewingGCN(gcn);
    try {
      const items = await api.get<CargoItem[]>(`/gcn/${gcn.id}/cargo`);
      setCargoItems(items);

      // Pre-fill freight form with existing data
      setFreightForm({
        customerFreight: gcn.customerFreight?.toString() || '',
        advance: gcn.advance?.toString() || '',
        loadingCharge: gcn.loadingCharge?.toString() || '',
        unloadingCharge: gcn.unloadingCharge?.toString() || '',
        detentionCharge: gcn.detentionCharge?.toString() || '',
        othersCharge: gcn.othersCharge?.toString() || '',
        paymentTerms: formatBillingTypeLabel(gcn.billingType, gcn.paymentTerms),
        remarks: gcn.remarks || ''
      });
    } catch (error) {
      console.error('Failed to fetch cargo items:', error);
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

  const openPrintableGcn = async (gcn: GCN) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      notify('Please allow popups to print the GCN');
      return;
    }

    printWindow.document.write('<p style="font-family: Arial, sans-serif; padding: 16px;">Preparing printable copy...</p>');
    printWindow.document.close();

    try {
      const html = await api.get<string>(`/gcn/${gcn.id}/printable`, {
        params: { autoprint: 'true' },
        responseType: 'text',
      });

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (error) {
      printWindow.close();
      console.error('Failed to open printable GCN:', error);
      notify('Failed to generate the printable GCN');
    }
  };

  const handlePrint = async () => {
    if (!viewingGCN) return;
    await openPrintableGcn(viewingGCN);
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !viewingGCN) {
      notify('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('receiptFile', receiptFile);

      // Call the backend endpoint
      await api.post(`/gcn/${viewingGCN.id}/receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh the GCN data to show updated receipt
      const updatedGCN = await api.get<GCN>(`/gcn/${viewingGCN.id}`);
      setViewingGCN(updatedGCN);

      setShowReceiptModal(false);
      setReceiptFile(null);
      notify('Receipt uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      notify('Failed to upload receipt. Please try again.');
    }
  };

  const handleSaveFreight = async () => {
    if (!viewingGCN) return;

    try {
      const formData = new FormData();
      formData.append('customerFreight', freightForm.customerFreight || '0');
      formData.append('advance', freightForm.advance || '0');
      formData.append('loadingCharge', freightForm.loadingCharge || '0');
      formData.append('unloadingCharge', freightForm.unloadingCharge || '0');
      formData.append('detentionCharge', freightForm.detentionCharge || '0');
      formData.append('othersCharge', freightForm.othersCharge || '0');
      formData.append('billingType', toBillingTypeValue(freightForm.paymentTerms));
      formData.append('paymentTerms', freightForm.paymentTerms);
      formData.append('remarks', freightForm.remarks);

      await api.put(`/gcn/${viewingGCN.id}/freight`, formData);

      // Refresh the GCN data to show updated freight details
      const updatedGCN = await api.get<GCN>(`/gcn/${viewingGCN.id}`);
      setViewingGCN(updatedGCN);

      // Update freight form with saved data
      setFreightForm({
        customerFreight: updatedGCN.customerFreight?.toString() || '',
        advance: updatedGCN.advance?.toString() || '',
        loadingCharge: updatedGCN.loadingCharge?.toString() || '',
        unloadingCharge: updatedGCN.unloadingCharge?.toString() || '',
        detentionCharge: updatedGCN.detentionCharge?.toString() || '',
        othersCharge: updatedGCN.othersCharge?.toString() || '',
        paymentTerms: formatBillingTypeLabel(updatedGCN.billingType, updatedGCN.paymentTerms),
        remarks: updatedGCN.remarks || ''
      });

      setShowFreightModal(false);
      notify('Freight details saved successfully!');
    } catch (error) {
      console.error('Failed to save freight:', error);
      notify('Failed to save freight details');
    }
  };

  const getVehicleNumber = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.vehicleNumber || 'N/A';
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver?.fullName || 'N/A';
  };

  // const filteredGCNs = gcns.filter(gcn =>
  //   gcn.gcnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   gcn.consignorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   getVehicleNumber(gcn.vehicleId).toLowerCase().includes(searchTerm.toLowerCase())
  // );
const filteredGCNs = gcns
  .filter(gcn =>
    gcn.gcnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gcn.consignorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getVehicleNumber(gcn.vehicleId).toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    const numA = parseInt(a.gcnNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.gcnNumber.replace(/\D/g, '')) || 0;
    return numB - numA; // 🔽 DESCENDING (latest first)
  });
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Show individual GCN view
  if (viewingGCN) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <main className="ml-64 p-8">
          <div className="flex justify-between items-center mb-6 no-print">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewingGCN(null)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to list
              </button>
              <span className="text-gray-400">|</span>
              <span className="font-semibold">GCN: {viewingGCN.gcnNumber}</span>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition font-semibold"
            >
              <Printer className="w-4 h-4" />
              Print 3 Copies / Save PDF
            </button>
          </div>

          {/* GCN Document - Printable Screen View */}
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm print-container">
            {/* Header with Logo */}
            <div className="text-center mb-6">
              <img src="/logo.jpeg" alt="Indtrans Freight Solutions" className="h-12 w-auto mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-gray-900">INDTRANS FREIGHT SOLUTIONS LLP</h1>
              <p className="text-sm text-gray-600 mt-1">
                103, 1st Floor Grohitam Premises, APMC Market Sector 19, Navi Mumbai – 400703
              </p>
              <div className="flex justify-center mt-3">
                <span className="bg-orange-500 text-white px-6 py-1.5 rounded-full text-sm font-bold">
                  GOODS CONSIGNMENT NOTE (GCN)
                </span>
              </div>
            </div>

            {/* GCN Info Bar */}
            <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">GCN No:</p>
                <p className="font-bold text-gray-900">{viewingGCN.gcnNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Date:</p>
                <p className="font-semibold text-gray-900">{new Date(viewingGCN.gcnDate).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">VHC Ref:</p>
                <p className="font-semibold text-orange-600">{viewingGCN.vhcNumber || viewingGCN.vhcId}</p>
              </div>
            </div>

            {/* Consignor & Consignee */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">CONSIGNOR (SHIPPER)</h3>
                <p className="font-bold text-gray-900">{viewingGCN.consignorName}</p>
                <p className="text-sm text-gray-600 mt-1">{viewingGCN.consignorAddress}</p>
                {viewingGCN.consignorGst && (
                  <p className="text-xs text-gray-500 mt-2">GST: {viewingGCN.consignorGst}</p>
                )}
                {viewingGCN.consignorPincode && (
                  <p className="text-xs text-gray-500">Pincode: {viewingGCN.consignorPincode}</p>
                )}
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">CONSIGNEE (RECEIVER)</h3>
                <p className="font-bold text-gray-900">{viewingGCN.consigneeName}</p>
                <p className="text-sm text-gray-600 mt-1">{viewingGCN.consigneeAddress}</p>
                {viewingGCN.consigneeGst && (
                  <p className="text-xs text-gray-500 mt-2">GST: {viewingGCN.consigneeGst}</p>
                )}
                {viewingGCN.consigneePincode && (
                  <p className="text-xs text-gray-500">Pincode: {viewingGCN.consigneePincode}</p>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">FROM</span> {viewingGCN.fromLocation}
                <span className="mx-3 text-orange-600">→</span>
                <span className="font-semibold">TO</span> {viewingGCN.toLocation}
              </p>
            </div>

            {/* Cargo Details */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-orange-600 uppercase mb-3 bg-orange-50 p-2 rounded">Cargo Details</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">#</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Packing</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Invoice No.</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Inv. Date</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Inv. Amt</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Description</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Weight</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Qty</th>
                      <th className="border-b px-3 py-2 text-left text-xs font-bold">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargoItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{index + 1}</td>
                        <td className="px-3 py-2 text-sm">{item.packingType}</td>
                        <td className="px-3 py-2 text-sm">{item.invoiceNumber}</td>
                        <td className="px-3 py-2 text-sm">{new Date(item.invoiceDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-3 py-2 text-sm">₹{item.invoiceAmount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-sm">{item.description}</td>
                        <td className="px-3 py-2 text-sm">{item.weight}</td>
                        <td className="px-3 py-2 text-sm">{item.quantity}</td>
                        <td className="px-3 py-2 text-sm">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle & Driver */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Vehicle No.</p>
                <p className="font-bold text-lg">{getVehicleNumber(viewingGCN.vehicleId)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Driver</p>
                <p className="font-semibold">{getDriverName(viewingGCN.driverId)}</p>
              </div>
            </div>

            {/* Billing & Insurance */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs font-bold text-orange-600 uppercase mb-2">Bill To Party</p>
                <p className="text-sm font-semibold">{viewingGCN.billingType.replace('_', ' ')}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Insurance Covered By</p>
                <p className="text-sm">
                  {viewingGCN.insuranceConsignor && '✓ Consignor '}
                  {viewingGCN.insuranceConsignee && '✓ Consignee'}
                </p>
              </div>
            </div>

            {/* Receipt Upload Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">Acknowledged Receipt</h3>
              {viewingGCN.receiptPath ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <p className="text-green-600 font-semibold">✓ Receipt uploaded</p>
                    <p className="text-gray-700 text-xs">
                      {/* Always show the original filename the user uploaded. */}
                      {viewingGCN.receiptOriginalName ||
                        decodeURIComponent((viewingGCN.receiptPath.split('/').pop() || ''))}
                    </p>
                  </div>
                  <a
                    href={viewingGCN.receiptPath}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    View
                  </a>
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="px-3 py-1 text-xs border border-orange-600 text-orange-600 rounded hover:bg-orange-50"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">No receipt uploaded yet. Click 'Upload Receipt' to attach.</p>
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Receipt
                  </button>
                </div>
              )}
            </div>

            {/* Customer Freight Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase mb-3">Customer Freight</h3>

              {viewingGCN.customerFreight && Number(viewingGCN.customerFreight) > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Freight</p>
                      <p className="font-semibold">₹ {Number(viewingGCN.customerFreight).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Advance</p>
                      <p className="font-semibold">₹ {Number(viewingGCN.advance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Loading</p>
                      <p className="font-semibold">₹ {Number(viewingGCN.loadingCharge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Unloading</p>
                      <p className="font-semibold">₹ {Number(viewingGCN.unloadingCharge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Detention</p>
                      <p className="font-semibold">₹ {Number(viewingGCN.detentionCharge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Others</p>
                      <p className="font-semibold">₹ {Number(viewingGCN.othersCharge || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Payment Terms</p>
                      <p className="font-semibold">{viewingGCN.paymentTerms || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase">Remarks</p>
                      <p className="font-semibold">{viewingGCN.remarks || '—'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFreightModal(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-semibold"
                  >
                    <span className="text-lg">+</span>
                    Edit Customer Freight
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-3">No customer freight entry yet. Add one after uploading the acknowledged receipt.</p>
                  <button
                    onClick={() => setShowFreightModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-semibold"
                  >
                    <span className="text-lg">+</span>
                    Add Customer Freight
                  </button>
                </>
              )}
            </div>

            {/* Footer Note */}
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>Printing generates 3 copies: Driver Copy, Consignor Copy, Consignee Copy</p>
            </div>
          </div>

          {/* Hidden Print Template - 3 COPIES */}
          <div className="print-only" style={{ display: 'none' }}>
            {/* 1. Driver Copy */}
            <PrintCopyPage
              type="DRIVER"
              gcn={viewingGCN}
              vehicleNumber={getVehicleNumber(viewingGCN.vehicleId)}
              driverName={getDriverName(viewingGCN.driverId)}
              cargoItems={cargoItems}
            />

            {/* 2. Consignor Copy */}
            <PrintCopyPage
              type="CONSIGNOR"
              gcn={viewingGCN}
              vehicleNumber={getVehicleNumber(viewingGCN.vehicleId)}
              driverName={getDriverName(viewingGCN.driverId)}
              cargoItems={cargoItems}
            />

            {/* 3. Consignee Copy */}
            <PrintCopyPage
              type="CONSIGNEE"
              gcn={viewingGCN}
              vehicleNumber={getVehicleNumber(viewingGCN.vehicleId)}
              driverName={getDriverName(viewingGCN.driverId)}
              cargoItems={cargoItems}
            />
          </div>

          {/* Print Styles */}
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 0;
              }

              .no-print {
                display: none !important;
              }

              .print-container {
                display: none !important;
              }

              .print-only {
                display: block !important;
              }

              .print-page {
                page-break-after: always;
                page-break-inside: avoid;
              }

              .print-page:last-child {
                page-break-after: auto;
              }

              body {
                background: white !important;
              }

              aside, main > div:first-child {
                display: none !important;
              }

              main {
                margin-left: 0 !important;
                padding: 0 !important;
              }
            }
          `}</style>
        </main>

        {/* Upload Receipt Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Upload Receipt</h3>
                <button onClick={() => setShowReceiptModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full border p-2 rounded"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadReceipt}
                    disabled={!receiptFile}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Freight Modal */}
        {showFreightModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Customer Freight Details</h3>
                <button onClick={() => setShowFreightModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CUSTOMER FREIGHT (₹)</label>
                  <input
                    type="number"
                    value={freightForm.customerFreight}
                    onChange={(e) => setFreightForm({...freightForm, customerFreight: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ADVANCE (₹)</label>
                  <input
                    type="number"
                    value={freightForm.advance}
                    onChange={(e) => setFreightForm({...freightForm, advance: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">LOADING (₹)</label>
                  <input
                    type="number"
                    value={freightForm.loadingCharge}
                    onChange={(e) => setFreightForm({...freightForm, loadingCharge: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">UNLOADING (₹)</label>
                  <input
                    type="number"
                    value={freightForm.unloadingCharge}
                    onChange={(e) => setFreightForm({...freightForm, unloadingCharge: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">DETENTION (₹)</label>
                  <input
                    type="number"
                    value={freightForm.detentionCharge}
                    onChange={(e) => setFreightForm({...freightForm, detentionCharge: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">OTHERS (₹)</label>
                  <input
                    type="number"
                    value={freightForm.othersCharge}
                    onChange={(e) => setFreightForm({...freightForm, othersCharge: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PAYMENT TERMS</label>
                  <select
                    value={freightForm.paymentTerms}
                    onChange={(e) => setFreightForm({...freightForm, paymentTerms: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="To Pay">To Pay</option>
                    <option value="Paid">Paid</option>
                    <option value="To Be Billed">To Be Billed</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">REMARKS</label>
                  <textarea
                    value={freightForm.remarks}
                    onChange={(e) => setFreightForm({...freightForm, remarks: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowFreightModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFreight}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Freight
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main GCN List View (Same as before)
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">View Goods Consignment Notes</h1>
          <p className="text-gray-600">All created GCNs — view details, print copies, or upload receipts</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">All Goods Consignment Notes ({gcns.length})</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search GCN, customer, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">GCN No.</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Bill To Party</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGCNs.map(gcn => (
                  <tr key={gcn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-orange-600">{gcn.gcnNumber}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{new Date(gcn.gcnDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 font-medium">{gcn.consignorName}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{gcn.fromLocation} → {gcn.toLocation}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{getVehicleNumber(gcn.vehicleId)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        gcn.billingType === 'TO_PAY' ? 'bg-yellow-100 text-yellow-700' :
                        gcn.billingType === 'PAID' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {gcn.billingType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewGCN(gcn)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => openPrintableGcn(gcn)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                        >
                          <Printer className="w-3 h-3" />
                          Print
                        </button>
                        {isAdmin && <button
                          onClick={() => handleDeleteGCN(gcn.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
