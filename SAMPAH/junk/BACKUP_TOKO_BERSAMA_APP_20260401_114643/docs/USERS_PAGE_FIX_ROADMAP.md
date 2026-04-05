# USERS PAGE FIX ROADMAP
## Audit Halaman Pengguna — Fase Perbaikan

Hasil audit mendalam halaman `UsersPage.tsx` menemukan **9 isu** (2 Critical, 4 High, 3 Medium).
Roadmap ini dibagi menjadi **4 fase** yang harus dikerjakan **secara berurutan** (Fase 1 → 2 → 3 → 4).
> **Exception**: Fase 3 dan Fase 4 **dapat dikerjakan paralel** setelah Fase 2 selesai karena menyentuh fungsi berbeda.

---

## FASE 1 — CRITICAL: Guard Hapus/Nonaktifkan Admin Terakhir & Diri Sendiri

**Isu yang diperbaiki**: C1 (hapus admin terakhir/diri sendiri), C2 (nonaktifkan admin terakhir/diri sendiri tanpa recovery path)

**File yang dimodifikasi**:
- `electron/database.js`
- `src/pages/UsersPage.tsx`

---

### PROMPT UNTUK AGENT FASE 1:

```
Kamu adalah coding agent. Lakukan perubahan kode PERSIS sesuai instruksi di bawah. Jangan ubah bagian lain.

== KONTEKS MASALAH ==

Halaman UsersPage.tsx tidak memiliki proteksi terhadap:
1. Admin menghapus akun dirinya sendiri (self-delete)
2. Admin menghapus admin terakhir yang aktif (sistem tidak bisa dikelola)
3. Admin menonaktifkan dirinya sendiri (self-deactivate)
4. Admin menonaktifkan admin terakhir yang aktif (tidak ada recovery path karena
   resetPasswordWithMasterKey tidak bisa mengaktifkan kembali akun nonaktif)

Perlu ditambahkan guard di dua level:
- Backend (database.js): cegah hapus/nonaktifkan admin terakhir
- Frontend (UsersPage.tsx): cegah self-delete dan self-deactivate sebelum sampai ke backend

== PERUBAHAN 1: electron/database.js — fungsi deleteUser ==

LOKASI: Cari fungsi deleteUser di baris sekitar 437:

```js
function deleteUser(id) {
    run('DELETE FROM users WHERE id = ?', [id]);
    return { id };
}
```

GANTI DENGAN:

```js
function deleteUser(id) {
    const target = getUserById(id);
    if (target?.role === 'admin') {
        const activeAdminCount = get(
            'SELECT COUNT(*) as c FROM users WHERE role = ? AND active = 1',
            ['admin']
        )?.c || 0;
        if (activeAdminCount <= 1) {
            throw new Error(
                'Tidak dapat menghapus admin terakhir yang aktif. ' +
                'Pastikan ada admin lain yang aktif sebelum menghapus akun ini.'
            );
        }
    }
    run('DELETE FROM users WHERE id = ?', [id]);
    return { id };
}
```

== PERUBAHAN 2: electron/database.js — fungsi updateUser ==

LOKASI: Cari fungsi updateUser di baris sekitar 417. Tambahkan guard DI AWAL fungsi, sebelum `const sets = []`:

```js
function updateUser(id, user) {
    const sets = [];
    // ...
```

GANTI DENGAN:

```js
function updateUser(id, user) {
    // Guard: cegah menonaktifkan admin terakhir yang aktif
    if (user.active === 0) {
        const target = getUserById(id);
        if (target?.role === 'admin') {
            const otherActiveAdmins = get(
                'SELECT COUNT(*) as c FROM users WHERE role = ? AND active = 1 AND id != ?',
                ['admin', id]
            )?.c || 0;
            if (otherActiveAdmins === 0) {
                throw new Error(
                    'Tidak dapat menonaktifkan admin terakhir yang aktif. ' +
                    'Pastikan ada admin lain yang aktif terlebih dahulu.'
                );
            }
        }
    }
    const sets = [];
    // ... sisa fungsi tidak berubah
```

== PERUBAHAN 3: src/pages/UsersPage.tsx — tambah useAuth + actionError state ==

LOKASI: Baris 1-2, blok import paling atas. Tambahkan import baru:

```tsx
import { useState, useEffect, memo } from 'react';
```

TAMBAHKAN import useAuth setelah baris pertama import, sebelum atau sesudah import lainnya:

```tsx
import { useAuth } from '@/contexts/AuthContext';
```

LOKASI: Di dalam komponen UsersPage, setelah baris state declarations (sekitar baris 47).
Tambahkan dua baris berikut setelah `const [userToDelete, setUserToDelete] = useState<any>(null);`:

```tsx
const { user: currentUser } = useAuth();
const [actionError, setActionError] = useState('');
```

== PERUBAHAN 4: src/pages/UsersPage.tsx — handleToggleActive dengan self-check ==

LOKASI: Cari fungsi handleToggleActive di baris sekitar 95:

```tsx
const handleToggleActive = async (user: any) => {
    await window.api.updateUser(user.id, { active: user.active ? 0 : 1 });
    loadUsers();
};
```

GANTI DENGAN:

```tsx
const handleToggleActive = async (user: any) => {
    if (user.active && user.id === currentUser?.id) {
        setActionError('Tidak dapat menonaktifkan akun Anda sendiri yang sedang digunakan.');
        return;
    }
    await window.api.updateUser(user.id, { active: user.active ? 0 : 1 });
    loadUsers();
};
```

== PERUBAHAN 5: src/pages/UsersPage.tsx — handleDelete dengan self-check ==

LOKASI: Cari fungsi handleDelete di baris sekitar 100:

```tsx
const handleDelete = (user: any) => setUserToDelete(user);
```

GANTI DENGAN:

```tsx
const handleDelete = (user: any) => {
    if (user.id === currentUser?.id) {
        setActionError('Tidak dapat menghapus akun Anda sendiri yang sedang digunakan.');
        return;
    }
    setUserToDelete(user);
};
```

== PERUBAHAN 6: src/pages/UsersPage.tsx — tampilkan actionError banner di JSX ==

LOKASI: Di dalam JSX return, cari Card yang berisi search input (sekitar baris 132):

```tsx
<Card className="border-none shadow-sm">
  <CardContent className="p-4">
    <div className="relative max-w-md">
```

TAMBAHKAN banner actionError SEBELUM Card search tersebut:

```tsx
{actionError && (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-xl flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
      <p className="text-xs font-bold text-red-600 dark:text-red-400">{actionError}</p>
    </div>
    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setActionError('')}>
      <XCircle className="w-3 h-3 text-red-400" />
    </Button>
  </div>
)}
```

Pastikan `XCircle` sudah ada di import lucide-react (sudah ada di baris 2).

== VERIFIKASI ==
Setelah selesai, cek:
1. database.js: deleteUser ada guard COUNT admin aktif sebelum DELETE
2. database.js: updateUser ada guard COUNT admin aktif lain sebelum set active=0
3. UsersPage.tsx: ada `import { useAuth } from '@/contexts/AuthContext'`
4. UsersPage.tsx: ada `const { user: currentUser } = useAuth()` dan `const [actionError, setActionError] = useState('')`
5. UsersPage.tsx: handleDelete menolak jika `user.id === currentUser?.id`
6. UsersPage.tsx: handleToggleActive menolak deactivate diri sendiri
7. UsersPage.tsx: actionError banner ditampilkan di atas search card
```

---

## FASE 2 — HIGH: Error Handling + Konfirmasi Toggle Aktif/Nonaktif

**Isu yang diperbaiki**: H1 (handleToggleActive tanpa try/catch), H2 (confirmDelete tanpa try/catch), M3 (toggle langsung tanpa konfirmasi)

**File yang dimodifikasi**:
- `src/pages/UsersPage.tsx`

---

### PROMPT UNTUK AGENT FASE 2:

```
Kamu adalah coding agent. Lakukan perubahan kode PERSIS sesuai instruksi di bawah. Jangan ubah bagian lain.

== KONTEKS MASALAH ==

Di UsersPage.tsx:
1. handleToggleActive: tidak ada try/catch — jika backend melempar error (misal: coba nonaktifkan
   admin terakhir), error ditelan diam-diam dan user tidak tahu ada masalah.
2. confirmDelete: tidak ada try/catch — jika backend melempar error (misal: hapus admin terakhir),
   unhandled promise rejection terjadi dan dialog macet tanpa pesan.
3. Toggle aktif/nonaktif langsung dieksekusi tanpa konfirmasi — berbahaya karena bisa mengunci
   seseorang dari sistem. Harus ada dialog konfirmasi seperti delete.

Pastikan Fase 1 sudah selesai sebelum menjalankan fase ini (ada `currentUser` dan `actionError` state).

== PERUBAHAN 1: tambah state userToToggle ==

LOKASI: Setelah `const [userToDelete, setUserToDelete] = useState<any>(null);` (sekitar baris 47),
tambahkan state baru:

```tsx
const [userToToggle, setUserToToggle] = useState<any>(null);
const [toggleError, setToggleError] = useState('');
```

== PERUBAHAN 2: refactor handleToggleActive → handleToggleClick ==

LOKASI: Cari fungsi handleToggleActive (baris sekitar 95):

```tsx
const handleToggleActive = async (user: any) => {
    if (user.active && user.id === currentUser?.id) {
        setActionError('Tidak dapat menonaktifkan akun Anda sendiri yang sedang digunakan.');
        return;
    }
    await window.api.updateUser(user.id, { active: user.active ? 0 : 1 });
    loadUsers();
};
```

GANTI DENGAN dua fungsi:

```tsx
const handleToggleClick = (user: any) => {
    if (user.active && user.id === currentUser?.id) {
        setActionError('Tidak dapat menonaktifkan akun Anda sendiri yang sedang digunakan.');
        return;
    }
    setToggleError('');
    setUserToToggle(user);
};

const confirmToggle = async () => {
    if (!userToToggle) return;
    try {
        await window.api.updateUser(userToToggle.id, { active: userToToggle.active ? 0 : 1 });
        setUserToToggle(null);
        setToggleError('');
        loadUsers();
    } catch (err: any) {
        setToggleError(err.message || 'Gagal mengubah status pengguna.');
    }
};
```

== PERUBAHAN 3: tambah try/catch di confirmDelete ==

LOKASI: Cari fungsi confirmDelete (baris sekitar 102):

```tsx
const confirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
        setActionError('Tidak dapat menghapus akun Anda sendiri yang sedang digunakan.');
        setUserToDelete(null);
        return;
    }
    await window.api.deleteUser(userToDelete.id);
    setUserToDelete(null);
    loadUsers();
};
```

GANTI DENGAN:

```tsx
const [deleteError, setDeleteError] = useState('');

const confirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
        setActionError('Tidak dapat menghapus akun Anda sendiri yang sedang digunakan.');
        setUserToDelete(null);
        return;
    }
    try {
        await window.api.deleteUser(userToDelete.id);
        setUserToDelete(null);
        setDeleteError('');
        loadUsers();
    } catch (err: any) {
        setDeleteError(err.message || 'Gagal menghapus pengguna.');
    }
};
```

CATATAN: Pindahkan deklarasi `const [deleteError, setDeleteError] = useState('');` ke blok state
declarations di atas (bersama state lainnya), bukan di dalam fungsi.

== PERUBAHAN 4: ganti onClick toggle active di JSX ==

LOKASI: Di dalam TableRow mapping, cari Button toggle active (sekitar baris 183):

```tsx
onClick={() => handleToggleActive(user)}
```

GANTI DENGAN:

```tsx
onClick={() => handleToggleClick(user)}
```

== PERUBAHAN 5: tambah error di delete Dialog ==

LOKASI: Di dalam Dialog delete (open={!!userToDelete}), cari DialogFooter:

```tsx
<DialogFooter className="gap-2">
    <Button variant="outline" onClick={() => setUserToDelete(null)} className="font-bold">Batal</Button>
    <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-black">Hapus</Button>
</DialogFooter>
```

TAMBAHKAN error display SEBELUM DialogFooter:

```tsx
{deleteError && (
    <div className="px-6 pb-2">
        <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{deleteError}</p>
    </div>
)}
<DialogFooter className="gap-2">
    <Button variant="outline" onClick={() => { setUserToDelete(null); setDeleteError(''); }} className="font-bold">Batal</Button>
    <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-black">Hapus</Button>
</DialogFooter>
```

== PERUBAHAN 6: tambah Dialog konfirmasi toggle aktif/nonaktif ==

LOKASI: Setelah Dialog delete (penutup `</Dialog>` terakhir, sekitar baris 324), tambahkan Dialog baru:

```tsx
<Dialog open={!!userToToggle} onOpenChange={() => { setUserToToggle(null); setToggleError(''); }}>
    <DialogContent className="sm:max-w-sm">
        <DialogHeader>
            <DialogTitle className="font-black">
                {userToToggle?.active ? 'Nonaktifkan Pengguna?' : 'Aktifkan Pengguna?'}
            </DialogTitle>
            <DialogDescription>
                {userToToggle?.active
                    ? <>Pengguna <strong>{userToToggle?.name}</strong> akan dinonaktifkan dan tidak dapat login.</>
                    : <>Pengguna <strong>{userToToggle?.name}</strong> akan diaktifkan kembali.</>
                }
            </DialogDescription>
        </DialogHeader>
        {toggleError && (
            <div className="px-1">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{toggleError}</p>
            </div>
        )}
        <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setUserToToggle(null); setToggleError(''); }} className="font-bold">Batal</Button>
            <Button
                onClick={confirmToggle}
                className={userToToggle?.active
                    ? 'bg-red-600 hover:bg-red-700 text-white font-black'
                    : 'bg-green-600 hover:bg-green-700 text-white font-black'
                }
            >
                {userToToggle?.active ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

== VERIFIKASI ==
Setelah selesai, cek:
1. UsersPage.tsx: ada state `userToToggle`, `toggleError`, `deleteError`
2. UsersPage.tsx: ada fungsi `handleToggleClick` dan `confirmToggle` (handleToggleActive dihapus)
3. UsersPage.tsx: `confirmDelete` memiliki try/catch dan menampilkan `deleteError` di dialog
4. UsersPage.tsx: `confirmToggle` memiliki try/catch dan menampilkan `toggleError` di dialog
5. UsersPage.tsx: onClick toggle di TableRow memanggil `handleToggleClick`
6. UsersPage.tsx: ada Dialog baru untuk konfirmasi toggle aktif/nonaktif
```

---

## FASE 3 — HIGH: Double-Submit Guard + Validasi Password

**Isu yang diperbaiki**: H3 (double-submit, tidak ada loading state), H4 (tidak ada validasi panjang minimum password)

**File yang dimodifikasi**:
- `src/pages/UsersPage.tsx`

> Fase 3 dan Fase 4 **dapat dikerjakan paralel** setelah Fase 2 selesai.

---

### PROMPT UNTUK AGENT FASE 3:

```
Kamu adalah coding agent. Lakukan perubahan kode PERSIS sesuai instruksi di bawah. Jangan ubah bagian lain.

== KONTEKS MASALAH ==

Di UsersPage.tsx:
1. Form submit (handleSubmit) tidak punya `isSubmitting` state — double-click pada tombol "Simpan Data"
   bisa mengirim dua request paralel. Tombol tidak pernah disabled selama proses berlangsung.
2. Placeholder password mengatakan "Min. 6 karakter" tapi kode hanya cek `if (!form.password)` —
   password 1 karakter seperti "a" diterima tanpa peringatan.

Pastikan Fase 2 sudah selesai sebelum menjalankan fase ini.

== PERUBAHAN 1: tambah state isSubmitting ==

LOKASI: Blok state declarations di dalam komponen (bersama state lainnya, sekitar baris 41-47).
Tambahkan setelah baris terakhir state:

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);
```

== PERUBAHAN 2: tambah validasi password + isSubmitting di handleSubmit ==

LOKASI: Cari fungsi handleSubmit (baris sekitar 70):

```tsx
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
```

GANTI DENGAN:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi password
    if (!editing) {
        if (!form.password) { setError('Password wajib diisi'); return; }
        if (form.password.length < 6) { setError('Password minimal 6 karakter'); return; }
    } else {
        if (form.password && form.password.length < 6) { setError('Password minimal 6 karakter'); return; }
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
        if (editing) {
            const data = { name: form.name, username: form.username, role: form.role as import('@/types/api').UserRole } as any;
            if (form.password) data.password = form.password;
            await window.api.updateUser(editing.id, data);
        } else {
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
    } finally {
        setIsSubmitting(false);
    }
};
```

== PERUBAHAN 3: tambah Loader2 ke import lucide-react ==

LOKASI: Baris 2, import lucide-react:

```tsx
import { UserPlus, Shield, UserCheck, UserX, Edit3, Eye, EyeOff, MoreVertical, CheckCircle2, XCircle, Search, Key } from 'lucide-react';
```

GANTI DENGAN:

```tsx
import { UserPlus, Shield, UserCheck, UserX, Edit3, Eye, EyeOff, MoreVertical, CheckCircle2, XCircle, Search, Key, Loader2 } from 'lucide-react';
```

== PERUBAHAN 4: ubah tombol submit menjadi disabled + spinner saat isSubmitting ==

LOKASI: Di dalam DialogFooter form (sekitar baris 301), cari Button submit:

```tsx
<Button type="submit" className="h-11 px-8 font-black bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 flex-1">
    <CheckCircle2 className="w-4 h-4 mr-2" /> Simpan Data
</Button>
```

GANTI DENGAN:

```tsx
<Button
    type="submit"
    disabled={isSubmitting}
    className="h-11 px-8 font-black bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 flex-1 disabled:opacity-70"
>
    {isSubmitting ? (
        <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Menyimpan...
        </span>
    ) : (
        <><CheckCircle2 className="w-4 h-4 mr-2" /> Simpan Data</>
    )}
</Button>
```

== VERIFIKASI ==
Setelah selesai, cek:
1. UsersPage.tsx: ada state `isSubmitting` di blok declarations
2. UsersPage.tsx: handleSubmit punya validasi `form.password.length < 6` sebelum submit
3. UsersPage.tsx: handleSubmit punya guard `if (isSubmitting) return` + `setIsSubmitting(true/false)`
4. UsersPage.tsx: import lucide-react sudah mencakup `Loader2`
5. UsersPage.tsx: tombol submit punya `disabled={isSubmitting}` dan menampilkan spinner saat loading
```

---

## FASE 4 — MEDIUM: Data Security Backend + loadUsers Error Feedback

**Isu yang diperbaiki**: M1 (SELECT * ekspos password_hash ke renderer), M2 (loadUsers gagal diam-diam)

**File yang dimodifikasi**:
- `electron/database.js`
- `src/pages/UsersPage.tsx`

> Fase 4 **dapat dikerjakan paralel** dengan Fase 3 setelah Fase 2 selesai.

---

### PROMPT UNTUK AGENT FASE 4:

```
Kamu adalah coding agent. Lakukan perubahan kode PERSIS sesuai instruksi di bawah. Jangan ubah bagian lain.

== KONTEKS MASALAH ==

1. database.js: fungsi getUsers() menggunakan `SELECT *` yang menyertakan kolom password_hash.
   Column ini tidak dibutuhkan oleh UI dan tidak boleh dikirim ke renderer via IPC.

2. UsersPage.tsx: fungsi loadUsers() tidak memiliki try/catch — jika API call gagal, error ditelan
   diam-diam. UI hanya menampilkan "Tidak ada pengguna ditemukan" tanpa ada indikasi error.

Pastikan Fase 2 sudah selesai sebelum menjalankan fase ini.

== PERUBAHAN 1: electron/database.js — ganti SELECT * di getUsers ==

LOKASI: Cari fungsi getUsers (baris sekitar 405):

```js
function getUsers() { return all('SELECT * FROM users ORDER BY name'); }
```

GANTI DENGAN:

```js
function getUsers() {
    return all('SELECT id, username, name, role, active, last_login, created_at FROM users ORDER BY name');
}
```

== PERUBAHAN 2: src/pages/UsersPage.tsx — tambah loadError state ==

LOKASI: Blok state declarations (sekitar baris 41-47). Tambahkan setelah state lainnya:

```tsx
const [loadError, setLoadError] = useState('');
```

== PERUBAHAN 3: src/pages/UsersPage.tsx — tambah try/catch di loadUsers ==

LOKASI: Cari fungsi loadUsers (baris sekitar 51):

```tsx
const loadUsers = async () => {
    const data = await window.api.getUsers();
    setUsers((data as any)?.data || (Array.isArray(data) ? data : []));
};
```

GANTI DENGAN:

```tsx
const loadUsers = async () => {
    try {
        setLoadError('');
        const data = await window.api.getUsers();
        setUsers((data as any)?.data || (Array.isArray(data) ? data : []));
    } catch (err: any) {
        setLoadError('Gagal memuat data pengguna: ' + (err.message || 'Coba muat ulang halaman.'));
    }
};
```

== PERUBAHAN 4: src/pages/UsersPage.tsx — tampilkan loadError di JSX ==

LOKASI: Di dalam tabel, cari kondisi empty state (sekitar baris 157):

```tsx
{filteredUsers.length === 0 ? (
    <TableRow>
        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
            <RetroUsers className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-bold text-lg">Tidak ada pengguna ditemukan</p>
        </TableCell>
    </TableRow>
```

GANTI DENGAN:

```tsx
{loadError ? (
    <TableRow>
        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-300 opacity-50" />
            <p className="font-bold text-lg text-red-500 dark:text-red-400">Gagal Memuat Data</p>
            <p className="text-sm mt-1">{loadError}</p>
            <Button variant="outline" className="mt-4 font-bold" onClick={loadUsers}>Coba Lagi</Button>
        </TableCell>
    </TableRow>
) : filteredUsers.length === 0 ? (
    <TableRow>
        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
            <RetroUsers className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-bold text-lg">Tidak ada pengguna ditemukan</p>
        </TableCell>
    </TableRow>
```

CATATAN: Pastikan kurung kurawal kondisi lanjutan (`filteredUsers.map(...)`) tetap berada di posisi
yang benar setelah penambahan kondisi loadError.

== VERIFIKASI ==
Setelah selesai, cek:
1. database.js: getUsers() menggunakan SELECT eksplisit tanpa password_hash
2. UsersPage.tsx: ada state `loadError`
3. UsersPage.tsx: loadUsers() punya try/catch yang set `loadError`
4. UsersPage.tsx: tabel menampilkan error state dengan tombol "Coba Lagi" jika loadError ada
```

---

## Ringkasan Eksekusi

| Fase | Severity | Isu | File | Paralel? |
|------|----------|-----|------|----------|
| 1 | 🔴 Critical | Guard hapus/nonaktifkan admin terakhir + self-check | `database.js`, `UsersPage.tsx` | Wajib pertama |
| 2 | 🟠 High | try/catch toggle+delete + konfirmasi toggle | `UsersPage.tsx` | Setelah Fase 1 |
| 3 | 🟠 High | isSubmitting + validasi password min 6 | `UsersPage.tsx` | Paralel dengan Fase 4 |
| 4 | 🟡 Medium | SELECT tanpa password_hash + loadUsers error | `database.js`, `UsersPage.tsx` | Paralel dengan Fase 3 |

**Urutan eksekusi yang disarankan**:
```
Fase 1 → Fase 2 → [ Fase 3 || Fase 4 ]
```
