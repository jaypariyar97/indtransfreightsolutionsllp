import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, Plus, Trash2, X, Send, Calendar, Clock, ExternalLink } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { api } from '../services/api';
import { notify } from '../services/notify';
import { useAuth } from '../hooks/useAuth';

interface GcnRow {
  id: string;
  gcnNumber: string;
  consignorName: string;
  consigneeName: string;
  fromLocation: string;
  toLocation: string;
  gcnDate: string;
  status: string;
}

interface TrackingEvent {
  id: string;
  status: string;
  location?: string;
  description?: string;
  eventAt: string;
  createdBy?: string;
  createdAt?: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'BOOKED', label: 'Booked' },
  { value: 'PICKED_UP', label: 'Picked up from origin' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'REACHED_HUB', label: 'Reached transit hub' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'EXCEPTION', label: 'Delivery exception' },
  { value: 'RETURNED', label: 'Returned to sender' },
];

function statusLabel(code: string) {
  return STATUS_OPTIONS.find(s => s.value === code)?.label || code.replace(/_/g, ' ');
}

function statusColor(code: string) {
  switch (code) {
    case 'DELIVERED': return 'bg-green-100 text-green-700 border-green-200';
    case 'OUT_FOR_DELIVERY': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'EXCEPTION':
    case 'RETURNED': return 'bg-red-100 text-red-700 border-red-200';
    case 'IN_TRANSIT':
    case 'REACHED_HUB': return 'bg-orange-100 text-orange-700 border-orange-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export default function Tracking() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('tracking', 'add');
  const canDelete = hasPermission('tracking', 'delete');

  const [gcns, setGcns] = useState<GcnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GcnRow | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Add-event form
  const [showAdd, setShowAdd] = useState(false);
  const [status, setStatus] = useState('IN_TRANSIT');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eventAt, setEventAt] = useState(() => toLocalInput(new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchGcns(); }, []);

  const fetchGcns = async () => {
    setLoading(true);
    try {
      const rows = await api.get<GcnRow[]>('/tracking/gcns');
      setGcns(rows);
    } catch (err) {
      console.error('Failed to fetch GCNs', err);
      notify('Could not load GCN list');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (g: GcnRow) => {
    setEventsLoading(true);
    setSelected(g);
    try {
      const rows = await api.get<TrackingEvent[]>(`/tracking/${g.id}/events`);
      setEvents(rows);
    } catch (err) {
      console.error('Failed to fetch events', err);
      notify('Could not load tracking events');
    } finally {
      setEventsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return gcns;
    return gcns.filter(g =>
      g.gcnNumber.toLowerCase().includes(q) ||
      (g.consignorName || '').toLowerCase().includes(q) ||
      (g.consigneeName || '').toLowerCase().includes(q) ||
      (g.fromLocation || '').toLowerCase().includes(q) ||
      (g.toLocation || '').toLowerCase().includes(q)
    );
  }, [gcns, search]);

  const handleAddEvent = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = {
        status,
        location: location.trim() || null,
        description: description.trim() || null,
        eventAt: new Date(eventAt).toISOString(),
      };
      await api.post(`/tracking/${selected.id}/events`, payload);
      setShowAdd(false);
      setLocation(''); setDescription('');
      setStatus('IN_TRANSIT');
      setEventAt(toLocalInput(new Date()));
      await fetchEvents(selected);
      // Update list status snapshot
      setGcns(prev => prev.map(g => g.id === selected.id ? { ...g, status: payload.status } : g));
      notify('Tracking update posted');
    } catch (err: any) {
      console.error('Failed to add event', err);
      notify(err?.response?.data?.error || 'Failed to add tracking update');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Remove this tracking update?')) return;
    try {
      await api.delete(`/tracking/events/${id}`);
      if (selected) await fetchEvents(selected);
      notify('Update removed');
    } catch (err: any) {
      notify(err?.response?.data?.error || 'Failed to remove update');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-orange-600" /> GCN Tracking
            </h1>
            <p className="text-gray-600">Post real-time delivery updates that customers can look up by GCN number.</p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            View public tracker <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* GCN list */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by GCN, consignor, consignee, location…"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-6 text-center text-sm text-gray-500">Loading GCNs…</div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">No GCNs match your search.</div>
              ) : (
                filtered.map(g => {
                  const active = selected?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => fetchEvents(g)}
                      className={`w-full text-left p-4 hover:bg-orange-50 transition ${active ? 'bg-orange-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-mono font-bold text-orange-700">{g.gcnNumber}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(g.status)}`}>
                          {statusLabel(g.status || 'BOOKED')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">{g.consignorName || '—'} → {g.consigneeName || '—'}</div>
                      <div className="text-xs text-gray-500 mt-1">{g.fromLocation || '—'} → {g.toLocation || '—'} · {g.gcnDate}</div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Event timeline */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center p-12 text-center text-gray-500">
                <div>
                  <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  Select a GCN on the left to view or post tracking updates.
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">GCN</div>
                    <div className="font-mono font-bold text-orange-700 text-lg">{selected.gcnNumber}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selected.fromLocation || '—'} → {selected.toLocation || '—'}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setShowAdd(true)}
                      className="flex items-center gap-1 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700"
                    >
                      <Plus className="w-4 h-4" /> Add Update
                    </button>
                  )}
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  {eventsLoading ? (
                    <div className="text-sm text-gray-500">Loading timeline…</div>
                  ) : events.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      No tracking events yet. Post the first one to start the timeline.
                    </div>
                  ) : (
                    <ol className="relative border-l-2 border-orange-200 ml-3 space-y-6">
                      {events.map((e, idx) => (
                        <li key={e.id} className="ml-4">
                          <span className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-white ${
                            idx === 0 ? 'bg-orange-600' : 'bg-orange-300'
                          }`} />
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{statusLabel(e.status)}</div>
                              {e.location && <div className="text-xs text-gray-600">{e.location}</div>}
                            </div>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteEvent(e.id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {e.description && <p className="text-sm text-gray-700">{e.description}</p>}
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> {formatDateTime(e.eventAt)}
                            {e.createdBy && <span className="ml-2">· posted by {e.createdBy}</span>}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {showAdd && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add tracking update</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">For GCN <span className="font-mono font-bold">{selected.gcnNumber}</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                >
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                <input
                  type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Pune Hub"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Event time
                </label>
                <input
                  type="datetime-local" value={eventAt} onChange={e => setEventAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} placeholder="Customer-facing notes — e.g. 'Held at hub, will dispatch tomorrow morning.'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleAddEvent} disabled={saving}
                className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg hover:bg-orange-700 font-semibold disabled:opacity-60"
              >
                <Send className="w-4 h-4" /> {saving ? 'Posting…' : 'Post update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
