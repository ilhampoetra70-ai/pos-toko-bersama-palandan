import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'cashier' });
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const data = await window.api.getUsers();
    setUsers(data);
  };

  const resetForm = () => {
    setForm({ username: '', password: '', name: '', role: 'cashier' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (user) => {
    setEditing(user);
    setForm({ username: user.username, password: '', name: user.name, role: user.role });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editing) {
        const data = { name: form.name, role: form.role };
        if (form.password) data.password = form.password;
        await window.api.updateUser(editing.id, data);
      } else {
        if (!form.password) { setError('Password wajib diisi'); return; }
        await window.api.createUser(form);
      }
      resetForm();
      loadUsers();
    } catch (err) {
      setError('Gagal menyimpan: ' + (err.message || 'Error'));
    }
  };

  const handleToggleActive = async (user) => {
    await window.api.updateUser(user.id, { active: user.active ? 0 : 1 });
    loadUsers();
  };

  const handleDelete = async (user) => {
    if (!confirm(`Hapus user "${user.name}"?`)) return;
    await window.api.deleteUser(user.id);
    loadUsers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Pengguna</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">+ Tambah User</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-lg mb-4">{editing ? 'Edit User' : 'Tambah User'}</h3>
            {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input className="input-field" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required disabled={!!editing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password {editing && '(kosongkan jika tidak diubah)'}</label>
                <input type="password" className="input-field" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} {...(!editing && { required: true })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="cashier">Cashier</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="btn-secondary">Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Username</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{user.username}</td>
                <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'supervisor' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggleActive(user)} className={`text-xs px-2 py-1 rounded-full ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(user)} className="text-primary-600 hover:text-primary-700 text-sm mr-3">Edit</button>
                  <button onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-700 text-sm">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
