import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type User = {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'rep';
  is_active: boolean;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'rep'>('rep');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'manager' | 'rep'>('rep');
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);


  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      if (!companyId) {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
        if (!profile || !profile.company_id) throw new Error("Company not found for user");
        setCompanyId(profile.company_id);
      }

      const { data, error } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      setUsers(data as User[]);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleInviteUser = async () => {
    if (!inviteName || !inviteEmail || !companyId) {
      setInviteError("Name and email are required.");
      return;
    }
    setInviting(true);
    setInviteError(null);
    try {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail, full_name: inviteName, role: inviteRole, company_id: companyId }
      });
      if (error) throw error;
      
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('rep');
      await loadUsers();

    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };
  
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditIsActive(user.is_active);
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setUpdating(true);
    setUpdateError(null);
    try {
      const { error } = await supabase.functions.invoke('update-user', {
        body: {
          userId: editingUser.id,
          role: editRole,
          is_active: editIsActive
        }
      });
      if (error) throw error;
      
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();

    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#111827]">User Management</h2>
        <button onClick={() => setShowInviteModal(true)} className="btn btn-primary">
          Invite User
        </button>
      </div>

      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEditModal(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Invite New User</h3>
            {inviteError && <p className="text-red-500 text-sm mb-4">{inviteError}</p>}
            <div className="space-y-4">
              <input type="text" placeholder="Full Name" value={inviteName} onChange={e => setInviteName(e.target.value)} className="w-full input-field" />
              <input type="email" placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full input-field" />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} className="w-full input-field">
                <option value="rep">Sales Rep</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowInviteModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleInviteUser} disabled={inviting} className="btn btn-primary">
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit User: {editingUser.full_name}</h3>
            {updateError && <p className="text-red-500 text-sm mb-4">{updateError}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className="w-full input-field mt-1">
                  <option value="rep">Sales Rep</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={editIsActive ? 'active' : 'inactive'} onChange={e => setEditIsActive(e.target.value === 'active')} className="w-full input-field mt-1">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleUpdateUser} disabled={updating} className="btn btn-primary">
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}