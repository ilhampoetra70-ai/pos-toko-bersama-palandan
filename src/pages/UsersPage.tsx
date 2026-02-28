import { useState, useEffect, memo } from 'react';
import { UserPlus, Shield, UserCheck, UserX, Edit3, Eye, EyeOff, MoreVertical, CheckCircle2, XCircle, Search, Key } from 'lucide-react';
import { RetroUsers, RetroTrash } from '../components/RetroIcons';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default memo(function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'cashier', showPassword: false });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const data = await window.api.getUsers();
    setUsers((data as any)?.data || (Array.isArray(data) ? data : []));
  };

  const resetForm = () => {
    setForm({ username: '', password: '', name: '', role: 'cashier', showPassword: false });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (user: any) => {
    setEditing(user);
    setForm({ username: user.username || '', password: '', name: user.name || '', role: user.role || 'cashier', showPassword: false });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editing) {
        const data = { name: form.name, username: form.username, role: form.role as import('@/types/api').UserRole } as any;
        if (form.password) data.password = form.password;
        await window.api.updateUser(editing.id, data);
      } else {
        if (!form.password) { setError('Password wajib diisi'); return; }
        await window.api.createUser({
          name: form.name,
          username: form.username,
          password: form.password,
          role: form.role as import('@/types/api').UserRole
        });
      }
      resetForm();
      loadUsers();
    } catch (err: any) {
      setError('Gagal menyimpan: ' + (err.message || 'Error'));
    }
  };

  const handleToggleActive = async (user: any) => {
    await window.api.updateUser(user.id, { active: user.active ? 0 : 1 });
    loadUsers();
  };

  const handleDelete = (user: any) => setUserToDelete(user);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    await window.api.deleteUser(userToDelete.id);
    setUserToDelete(null);
    loadUsers();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleConfig = {
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400' },
    supervisor: { label: 'Supervisor', color: 'bg-primary text-primary-foreground dark:bg-primary/30 dark:text-primary' },
    cashier: { label: 'Cashier', color: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' }
  } as any;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground dark:text-foreground tracking-tight">Pengguna</h2>
          <p className="text-sm text-muted-foreground font-medium">Manajemen hak akses dan akun karyawan</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="h-11 px-6 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 gap-2 font-bold">
          <UserPlus className="w-5 h-5" /> Tambah User
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
            <Input
              placeholder="Cari user berdasarkan nama atau username..."
              className="pl-10 h-11 bg-background/50 dark:bg-card/50 border-none shadow-inner"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm overflow-hidden">
        <Table className="zebra-rows">
          <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            <TableRow className="border-b border-border">
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">Nama & Username</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground">Jabatan / Role</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground text-center">Status</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 text-muted-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                  <RetroUsers className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="font-bold text-lg">Tidak ada pengguna ditemukan</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers.map(user => (
              <TableRow key={user.id} className="hover:bg-muted/30 transition-colors h-16 border-b border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted dark:bg-card flex items-center justify-center font-black text-muted-foreground dark:text-muted-foreground group-hover:bg-primary-50 dark:group-hover:bg-primary-950/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-foreground dark:text-foreground">{user.name}</div>
                      <div className="text-[10px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-widest">@{user.username}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-black text-[10px] uppercase h-6 shadow-none", roleConfig[user.role]?.color)}>
                    {roleConfig[user.role]?.label || user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(user)}
                    className={cn(
                      "font-black text-[10px] uppercase h-7 px-3 rounded-full",
                      user.active
                        ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/40"
                        : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/40"
                    )}
                  >
                    {user.active ? <UserCheck className="w-3.5 h-3.5 mr-1.5" /> : <UserX className="w-3.5 h-3.5 mr-1.5" />}
                    {user.active ? 'Aktif' : 'Nonaktif'}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="text-primary-600 h-9 w-9" onClick={() => handleEdit(user)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 h-9 w-9 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleDelete(user)}>
                      <RetroTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={resetForm}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card dark:bg-background border-none flex flex-col">
          <DialogHeader className="p-6 border-b dark:border-border shrink-0 bg-background/50 dark:bg-background/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                <RetroUsers className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-foreground dark:text-foreground">{editing ? 'Edit Pengguna' : 'Tambah Pengguna'}</DialogTitle>
                <DialogDescription className="text-muted-foreground font-medium">Kelola kredensial dan hak akses pengguna</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Username</label>
                <Input
                  className="h-11 bg-background dark:bg-background border-none shadow-inner"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                  disabled={!!editing}
                  placeholder="nama_panggilan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Nama Lengkap</label>
                <Input
                  className="h-11 bg-background dark:bg-background border-none shadow-inner"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Nama Karyawan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                  Password {editing && '(Kosongkan jika tidak diubah)'}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                  <Input
                    type={form.showPassword ? 'text' : 'password'}
                    className="pl-10 h-11 bg-background dark:bg-background border-none shadow-inner"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    {...(!editing && { required: true })}
                    placeholder="Min. 6 karakter"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setForm(f => ({ ...f, showPassword: !f.showPassword }))}
                    className="absolute right-1.5 top-1.5 h-8 w-8 hover:bg-card dark:hover:bg-card transition-colors"
                  >
                    {form.showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Hak Akses / Role</label>
                <Select value={form.role} onValueChange={val => setForm(f => ({ ...f, role: val }))}>
                  <SelectTrigger className="h-11 bg-background dark:bg-background border-none shadow-inner data-[state=open]:bg-card dark:data-[state=open]:bg-foreground/10">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier (Akses Kasir)</SelectItem>
                    <SelectItem value="supervisor">Supervisor (Akses Laporan)</SelectItem>
                    <SelectItem value="admin">Admin (Akses Penuh)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="p-6 bg-background/50 dark:bg-background/50 border-t dark:border-border gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={resetForm} className="h-11 px-6 font-bold flex-1 border-border dark:border-border">Batal</Button>
              <Button type="submit" className="h-11 px-8 font-black bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black">Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <strong>{userToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserToDelete(null)} className="font-bold">Batal</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-black">Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
