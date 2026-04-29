import { useState, useEffect } from 'react';
import { notify, notifyFormErrors } from '../services/notify';
import { api } from '../services/api';
import { Settings, Trash2, X, Save, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';

/**
 * Catalog of modules that can be permission-gated. The {@code key} matches the
 * server-side module name used by {@code PermissionService}. Admins always have
 * every action regardless of what's stored here.
 */
const MODULES: { key: string; label: string }[] = [
  { key: 'customers',    label: 'Customers' },
  { key: 'transporters', label: 'Transporters' },
  { key: 'vehicles',     label: 'Vehicles' },
  { key: 'drivers',      label: 'Drivers' },
  { key: 'vhc',          label: 'Vehicle Hire Challans' },
  { key: 'gcn',          label: 'GCN Preparation & View' },
  { key: 'tracking',     label: 'GCN Tracking' },
  { key: 'billing',      label: 'Billing & Invoices' },
  { key: 'gallery',      label: 'Gallery Management' },
];

const ACTIONS = ['view', 'add', 'edit', 'delete'] as const;
type Action = typeof ACTIONS[number];

type PermMap = Record<string, Record<Action, boolean>>;

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  permissions: PermMap;
}

function emptyPerms(): PermMap {
  const out: PermMap = {};
  for (const m of MODULES) out[m.key] = { view: false, add: false, edit: false, delete: false };
  return out;
}

function normalisePerms(raw: any): PermMap {
  const out = emptyPerms();
  if (!raw || typeof raw !== 'object') return out;
  for (const m of MODULES) {
    const src = raw[m.key];
    if (src && typeof src === 'object') {
      for (const a of ACTIONS) out[m.key][a] = src[a] === true;
    }
  }
  return out;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Create-user form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Manage-access modal
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [perms, setPerms] = useState<PermMap>(emptyPerms());
  const [savingPerms, setSavingPerms] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/users');
      setUsers(data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        permissions: normalisePerms(u.permissions),
      })));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      notify('Could not load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!username.trim()) errs.username = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) errs.username = 'Must be a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Use at least 8 characters';
    if (Object.keys(errs).length) { notifyFormErrors(errs); return; }

    setCreating(true);
    try {
      await api.post('/users', { name: fullName.trim(), email: username.trim(), password });
      setShowCreateModal(false);
      setFullName(''); setUsername(''); setPassword('');
      await fetchUsers();
      notify('User created. They will be prompted to change their password on first login.');
    } catch (err: any) {
      console.error('Failed to create user', err);
      notify(err?.response?.data?.error || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (u: UserRow) => {
    if (!window.confirm(`Delete ${u.email}?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      await fetchUsers();
      notify('User deleted');
    } catch (err: any) {
      notify(err?.response?.data?.error || 'Failed to delete user');
    }
  };

  const openAccess = async (user: UserRow) => {
    setSelectedUser(user);
    try {
      const fresh = await api.get<any>(`/users/${user.id}/permissions`);
      setPerms(normalisePerms(fresh));
    } catch {
      setPerms(user.permissions);
    }
    setShowAccessModal(true);
  };

  const togglePerm = (moduleKey: string, action: Action, value: boolean) => {
    setPerms(prev => {
      const next: PermMap = { ...prev, [moduleKey]: { ...prev[moduleKey] } };
      if (action === 'view' && !value) {
        // Removing view removes everything else.
        next[moduleKey] = { view: false, add: false, edit: false, delete: false };
      } else {
        next[moduleKey] = { ...next[moduleKey], [action]: value };
        if (value && action !== 'view') next[moduleKey].view = true;
      }
      return next;
    });
  };

  const toggleAll = (moduleKey: string, value: boolean) => {
    setPerms(prev => ({
      ...prev,
      [moduleKey]: { view: value, add: value, edit: value, delete: value },
    }));
  };

  const allChecked = (moduleKey: string) => {
    const m = perms[moduleKey];
    return m.view && m.add && m.edit && m.delete;
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSavingPerms(true);
    try {
      // Strip empty modules so the stored JSON stays compact.
      const payload: PermMap = {};
      for (const [k, v] of Object.entries(perms)) {
        if (v.view || v.add || v.edit || v.delete) payload[k] = v;
      }
      await api.put(`/users/${selectedUser.id}/permissions`, payload);
      await fetchUsers();
      setShowAccessModal(false);
      notify('Permissions updated');
    } catch (err: any) {
      console.error('Failed to update permissions', err);
      notify(err?.response?.data?.error || 'Failed to update permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const moduleSummary = (p: PermMap): string[] => {
    const labels: string[] = [];
    for (const m of MODULES) {
      const v = p[m.key];
      if (!v) continue;
      if (v.view || v.add || v.edit || v.delete) labels.push(m.label);
    }
    return labels;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Create login accounts and grant per-module access.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Access</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => {
                const labels = moduleSummary(user.permissions);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-bold text-sm">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        user.role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'ADMIN' ? (
                        <span className="text-xs text-gray-500 italic">Full access</span>
                      ) : labels.length === 0 ? (
                        <span className="text-xs text-amber-600">No access granted</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {labels.slice(0, 4).map(l => (
                            <span key={l} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                              {l}
                            </span>
                          ))}
                          {labels.length > 4 && (
                            <span className="px-2 py-0.5 text-gray-500 text-xs">+{labels.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAccess(user)}
                          disabled={user.role === 'ADMIN'}
                          className="flex items-center gap-1 px-3 py-1.5 border border-orange-600 text-orange-600 rounded text-xs hover:bg-orange-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Settings className="w-3 h-3" /> Access
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-900">
          <strong>Tip:</strong> Admins automatically have every permission. New employees start with zero access —
          use the <em>Access</em> button to grant View/Add/Edit/Delete per module.
        </div>
      </main>

      {/* Create user modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create User Account</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Temporary Password *</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              The user will be required to set their own password on first login.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleCreateUser} disabled={creating}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-semibold disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access modal */}
      {showAccessModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Manage Access — {selectedUser.email}</h2>
                  <p className="text-sm text-gray-600">Toggle which modules and actions this user can perform.</p>
                </div>
                <button onClick={() => setShowAccessModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold">Module</th>
                      {ACTIONS.map(a => (
                        <th key={a} className="px-4 py-3 text-center text-sm font-bold capitalize">{a}</th>
                      ))}
                      <th className="px-4 py-3 text-center text-sm font-bold">All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {MODULES.map(m => (
                      <tr key={m.key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{m.label}</td>
                        {ACTIONS.map(a => (
                          <td key={a} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perms[m.key][a]}
                              onChange={e => togglePerm(m.key, a, e.target.checked)}
                              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={allChecked(m.key)}
                            onChange={e => toggleAll(m.key, e.target.checked)}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                Granting Add, Edit, or Delete automatically enables View. Removing View clears everything for that module.
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAccessModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions} disabled={savingPerms}
                  className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-semibold disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {savingPerms ? 'Saving…' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
