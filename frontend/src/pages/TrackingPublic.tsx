import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Truck, CheckCircle2, AlertTriangle, Clock, Search } from 'lucide-react';

interface TrackingEvent {
  id: string;
  status: string;
  location?: string;
  description?: string;
  eventAt: string;
}

interface PublicTracking {
  gcnNumber: string;
  gcnDate?: string;
  fromLocation?: string;
  toLocation?: string;
  consignorName?: string;
  consigneeName?: string;
  consigneeCity?: string;
  currentStatus?: string;
  currentLocation?: string;
  headlineStatus?: string;
  events: TrackingEvent[];
}

const STATUS_LABELS: Record<string, string> = {
  BOOKED: 'Booked',
  PICKED_UP: 'Picked up from origin',
  IN_TRANSIT: 'In transit',
  REACHED_HUB: 'Reached transit hub',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  EXCEPTION: 'Delivery exception',
  RETURNED: 'Returned to sender',
};

const STAGE_ORDER = ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function iconFor(status?: string) {
  switch (status) {
    case 'DELIVERED': return CheckCircle2;
    case 'OUT_FOR_DELIVERY': return Truck;
    case 'IN_TRANSIT':
    case 'REACHED_HUB': return MapPin;
    case 'PICKED_UP': return Package;
    case 'EXCEPTION':
    case 'RETURNED': return AlertTriangle;
    default: return Clock;
  }
}

function colorFor(status?: string) {
  if (status === 'DELIVERED') return 'text-green-600 bg-green-100';
  if (status === 'EXCEPTION' || status === 'RETURNED') return 'text-red-600 bg-red-100';
  return 'text-orange-600 bg-orange-100';
}

export default function TrackingPublic() {
  const { gcnNumber } = useParams<{ gcnNumber: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(gcnNumber || '');

  useEffect(() => {
    if (!gcnNumber) return;
    setLoading(true);
    setError(null);
    fetch(`/api/public/tracking/${encodeURIComponent(gcnNumber)}`)
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body?.error || `No shipment found for ${gcnNumber}`);
        }
        return r.json();
      })
      .then((d: PublicTracking) => setData(d))
      .catch(e => { setError(e.message || 'Tracking lookup failed'); setData(null); })
      .finally(() => setLoading(false));
  }, [gcnNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const v = searchValue.trim();
    if (!v) return;
    navigate(`/track/${encodeURIComponent(v)}`);
  };

  const HeroIcon = iconFor(data?.currentStatus);
  const heroColor = colorFor(data?.currentStatus);

  // Compute the stage-bar progress (5 visible milestones)
  const stageIndex = data?.currentStatus
    ? Math.max(0, STAGE_ORDER.indexOf(data.currentStatus))
    : 0;
  const isExceptional = data?.currentStatus === 'EXCEPTION' || data?.currentStatus === 'RETURNED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="INDTRANS" className="h-10 w-auto" />
            <div className="leading-tight">
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                INDTRANS Freight LLP
                {/* <span className="text-orange-600">LLP</span> */}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Track your shipment</p>
            </div>
          </Link>
          <Link to="/" className="text-sm text-gray-600 hover:text-orange-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Enter GCN tracking number"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg"
          >
            Track
          </button>
        </form>

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto" />
            <p className="text-gray-500 mt-4">Looking up your shipment…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-10 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Shipment not found</h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-xs text-gray-500 mt-4">
              Double-check your GCN number — it's the reference printed on your consignment slip.
            </p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            {/* Headline card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${heroColor}`}>
                  <HeroIcon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Tracking #</p>
                  <h1 className="text-2xl font-black text-gray-900 font-mono">{data.gcnNumber}</h1>
                  <p className="text-lg font-semibold text-gray-800 mt-2">
                    {data.headlineStatus || STATUS_LABELS[data.currentStatus || 'BOOKED']}
                  </p>
                  {data.currentLocation && (
                    <p className="text-sm text-gray-600">at {data.currentLocation}</p>
                  )}
                </div>
              </div>

              {/* Stage progress bar (only for normal flow) */}
              {!isExceptional && (
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {STAGE_ORDER.map(s => <span key={s} className="flex-1 text-center">{STATUS_LABELS[s]}</span>)}
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 bg-orange-600 rounded-full transition-all duration-500"
                      style={{ width: `${(stageIndex / (STAGE_ORDER.length - 1)) * 100}%` }}
                    />
                    {STAGE_ORDER.map((_, i) => (
                      <div
                        key={i}
                        className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${
                          i <= stageIndex ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                        style={{ left: `calc(${(i / (STAGE_ORDER.length - 1)) * 100}% - 6px)` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shipment details */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">From</p>
                <p className="font-semibold text-gray-900">{data.consignorName || '—'}</p>
                <p className="text-sm text-gray-600">{data.fromLocation || '—'}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">To</p>
                <p className="font-semibold text-gray-900">{data.consigneeName || '—'}</p>
                <p className="text-sm text-gray-600">{data.toLocation || '—'}{data.consigneeCity ? ` · ${data.consigneeCity}` : ''}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tracking history</h2>
              {data.events.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No tracking updates yet. Updates will appear here as your shipment moves.
                </p>
              ) : (
                <ol className="relative border-l-2 border-orange-200 ml-3 space-y-6">
                  {data.events.map((e, idx) => {
                    const Icon = iconFor(e.status);
                    return (
                      <li key={e.id} className="ml-5">
                        <span className={`absolute -left-[14px] flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-white ${
                          idx === 0 ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex flex-wrap justify-between gap-x-4">
                          <div>
                            <p className="font-bold text-gray-900">{STATUS_LABELS[e.status] || e.status}</p>
                            {e.location && <p className="text-sm text-gray-600">{e.location}</p>}
                            {e.description && <p className="text-sm text-gray-700 mt-1">{e.description}</p>}
                          </div>
                          <p className="text-xs text-gray-500">{formatDateTime(e.eventAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div className="text-center text-xs text-gray-500 mt-8">
              Need help? Call us at <a href="tel:8850397196" className="text-orange-600 font-semibold">+91 8850397196</a> or email
              <a href="mailto:operations@indtransfreightsolutions.com" className="text-orange-600 font-semibold ml-1">
                operations@indtransfreightsolutions.com
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
