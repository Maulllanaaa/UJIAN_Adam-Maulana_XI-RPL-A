const API_URL = 'http://localhost:5000/api';
const PEMINJAMAN_URL = `${API_URL}/peminjaman`;   
const ALAT_URL = `${API_URL}/alat`;
let currentList = [];
let alatMap = {};
let deleteTargetId = null;

function ambilData(result) {
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    return [];
}

function escapeHTML(teks) {
    return String(teks ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function toInputDate(v) {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    if (isNaN(d)) return '';
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatTanggal(v) {
    const t = toInputDate(v);
    if (!t) return '-';
    const [y, m, d] = t.split('-');
    return `${d}/${m}/${y}`;
}

function badgeStatus(status) {
    const warna = {
        Dipinjam: 'bg-yellow-100 text-yellow-700',
        Dikembalikan: 'bg-green-100 text-green-700',
        Terlambat: 'bg-red-100 text-red-700'
    }[status] || 'bg-gray-100 text-gray-700';
    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${warna}">${escapeHTML(status)}</span>`;
}


async function loadAlat() {
    const selects = [
        document.getElementById('id_alat'),  
        document.getElementById('idAlat')    
    ];
    try {
        const res = await fetch(ALAT_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = ambilData(await res.json());

        alatMap = {};
        selects.forEach(select => {
            select.innerHTML = '<option value="" disabled selected>Pilih Alat</option>';
            data.forEach(a => {
                alatMap[a.id_alat] = a.nama_alat;
                const opt = document.createElement('option');
                opt.value = a.id_alat;
                opt.textContent = `${a.nama_alat} (stok: ${a.stok})`;
                select.appendChild(opt);
            });
        });
    } catch (error) {
        console.error('Gagal memuat alat:', error);
        selects.forEach(s => {
            s.innerHTML = '<option value="" disabled selected>Gagal memuat alat</option>';
        });
    }
}

async function loadPeminjaman() {
    const tbody = document.querySelector('table tbody');
    try {
        const res = await fetch(PEMINJAMAN_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currentList = ambilData(await res.json());

        if (currentList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="py-4 px-6 text-center text-gray-500">Belum ada data peminjaman.</td>
                </tr>`;
            return;
        }

        tbody.innerHTML = currentList.map(p => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6 text-gray-900">${escapeHTML(p.id_peminjaman)}</td>
                <td class="py-4 px-6 text-gray-900">${escapeHTML(p.nama_alat ?? alatMap[p.id_alat] ?? p.id_alat)}</td>
                <td class="py-4 px-6 text-gray-600">${escapeHTML(p.nama_peminjam)}</td>
                <td class="py-4 px-6 text-gray-600">${escapeHTML(p.kelas)}</td>
                <td class="py-4 px-6 text-gray-600">${formatTanggal(p.tanggal_pinjam)}</td>
                <td class="py-4 px-6 text-gray-600">${formatTanggal(p.tanggal_kembali)}</td>
                <td class="py-4 px-6 text-gray-600">${escapeHTML(p.jumlah)}</td>
                <td class="py-4 px-6">${badgeStatus(p.status)}</td>
                <td class="py-4 px-6">
                    <div class="flex gap-2">
                        <button onclick="openEditModal(${Number(p.id_peminjaman)})"
                            class="bg-yellow-300 hover:bg-yellow-400 transition-colors cursor-pointer px-3 py-1 rounded-lg">Edit</button>
                        <button onclick="openDeleteModal(${Number(p.id_peminjaman)})"
                            class="bg-red-300 hover:bg-red-400 transition-colors cursor-pointer px-3 py-1 rounded-lg">Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Gagal mengambil data peminjaman:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="py-4 px-6 text-center text-red-500">Gagal memuat data peminjaman. Pastikan server aktif.</td>
            </tr>`;
    }
}

function openEditModal(id) {
    const p = currentList.find(x => x.id_peminjaman == id);
    if (!p) return;

    document.getElementById('modalTitle').innerText = 'Edit Peminjaman';
    document.getElementById('idPeminjaman').value = p.id_peminjaman;
    document.getElementById('namaPeminjam').value = p.nama_peminjam ?? '';
    document.querySelector('#form #kelas').value = p.kelas ?? '';
    document.getElementById('idAlat').value = p.id_alat;
    document.querySelector('#form #jumlah').value = p.jumlah;
    document.getElementById('tanggalPinjam').value = toInputDate(p.tanggal_pinjam);
    document.getElementById('tanggalKembali').value = toInputDate(p.tanggal_kembali);
    document.getElementById('status').value = p.status ?? 'Dipinjam';

    document.getElementById('formModal').showModal();
}

function openDeleteModal(id) {
    const p = currentList.find(x => x.id_peminjaman == id);
    if (!p) return;

    deleteTargetId = id;
    document.getElementById('deletePeminjamName').innerText =
        `peminjaman "${p.nama_peminjam}" (${p.nama_alat ?? alatMap[p.id_alat] ?? 'alat'})`;
    document.getElementById('deleteModal').showModal();
}

document.addEventListener('DOMContentLoaded', async () => {
    const headRow = document.querySelector('table thead tr');
    if (headRow && headRow.children.length < 9) {
        const th = document.createElement('th');
        th.className = 'p-3 text-left';
        th.textContent = 'Aksi';
        headRow.appendChild(th);
    }

    await loadAlat();       
    await loadPeminjaman();
    const formTambah = document.getElementById('formPeminjaman');
    const setTanggalDefault = () => {
        document.getElementById('tanggal_pinjam').value = toInputDate(new Date());
    };
    setTanggalDefault();
    formTambah.addEventListener('reset', () => setTimeout(setTanggalDefault, 0));

    formTambah.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pinjam = document.getElementById('tanggal_pinjam').value;
        const kembali = document.getElementById('tanggal_kembali').value;
        if (kembali < pinjam) {
            alert('Tanggal kembali tidak boleh sebelum tanggal pinjam');
            return;
        }
        const payload = {
            id_alat: document.getElementById('id_alat').value,
            nama_peminjam: document.getElementById('nama_peminjam').value.trim(),
            kelas: formTambah.querySelector('#kelas').value.trim(),
            jumlah: Number(formTambah.querySelector('#jumlah').value),
            tanggal_pinjam: pinjam,
            tanggal_kembali: kembali,
            status: 'Dipinjam'
        };
        try {
            const res = await fetch(PEMINJAMAN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.error || result.message || `HTTP ${res.status}`);
            }
            formTambah.reset();
            await loadAlat();        
            await loadPeminjaman();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Gagal menambahkan peminjaman');
        }
    });

    const formModal = document.getElementById('formModal');
    document.getElementById('closeModalBtn').addEventListener('click', () => formModal.close());
    document.getElementById('cancelBtn').addEventListener('click', () => formModal.close());
    formModal.addEventListener('mousedown', (e) => {
        if (e.target === formModal) formModal.close();
    });

    const formEdit = document.getElementById('form');
    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('idPeminjaman').value;
        if (!id) return;

        const pinjam = document.getElementById('tanggalPinjam').value;
        const kembali = document.getElementById('tanggalKembali').value;
        if (kembali < pinjam) {
            alert('Tanggal kembali tidak boleh sebelum tanggal pinjam');
            return;
        }
        const payload = {
            id_alat: document.getElementById('idAlat').value,
            nama_peminjam: document.getElementById('namaPeminjam').value.trim(),
            kelas: formEdit.querySelector('#kelas').value.trim(),
            jumlah: Number(formEdit.querySelector('#jumlah').value),
            tanggal_pinjam: pinjam,
            tanggal_kembali: kembali,
            status: document.getElementById('status').value
        };
        try {
            const res = await fetch(`${PEMINJAMAN_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.error || result.message || `HTTP ${res.status}`);
            }
            formModal.close();
            await loadAlat();
            await loadPeminjaman();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Gagal menyimpan data');
        }
    });

    const deleteModal = document.getElementById('deleteModal');
    document.getElementById('closeDeleteModalBtn').addEventListener('click', () => deleteModal.close());
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => deleteModal.close());
    deleteModal.addEventListener('mousedown', (e) => {
        if (e.target === deleteModal) deleteModal.close();
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (deleteTargetId === null) return;
        try {
            const res = await fetch(`${PEMINJAMAN_URL}/${deleteTargetId}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.error || result.message || `HTTP ${res.status}`);
            }
            deleteModal.close();
            deleteTargetId = null;
            await loadPeminjaman();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Gagal menghapus data');
        }
    });
});
