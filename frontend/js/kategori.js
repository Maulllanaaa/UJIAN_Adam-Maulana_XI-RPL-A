const API_URL = 'http://localhost:5000/api';
const KATEGORI_URL = `${API_URL}/kategori_alat`;
let currentKategoriList = [];
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
async function loadKategori() {
    const tbody = document.getElementById('kategori-list');
    try {
        const res = await fetch(KATEGORI_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currentKategoriList = ambilData(await res.json());
        if (currentKategoriList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-4 px-6 text-center text-gray-500">Belum ada kategori yang ditambahkan.</td>
                </tr>`;
            return;
        }
        tbody.innerHTML = currentKategoriList.map(k => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6 text-gray-900">${escapeHTML(k.id_kategori)}</td>
                <td class="py-4 px-6 text-gray-900">${escapeHTML(k.nama_kategori)}</td>
                <td class="py-4 px-6 text-gray-600">${escapeHTML(k.deskripsi)}</td>
                <td class="py-4 px-6">
                    <div class="flex gap-2">
                        <button onclick="openEditModal(${Number(k.id_kategori)})"
                            class="bg-yellow-300 hover:bg-yellow-400 transition-colors cursor-pointer px-3 py-1 rounded-lg">Edit</button>
                        <button onclick="openDeleteModal(${Number(k.id_kategori)})"
                            class="bg-red-300 hover:bg-red-400 transition-colors cursor-pointer px-3 py-1 rounded-lg">Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Gagal mengambil data kategori:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-4 px-6 text-center text-red-500">Gagal memuat data kategori. Pastikan server aktif.</td>
            </tr>`;
    }
}
function openEditModal(id) {
    const item = currentKategoriList.find(k => k.id_kategori == id);
    if (!item) return;
    document.getElementById('modalTitle').innerText = 'Edit Kategori';
    document.getElementById('idKategori').value = item.id_kategori;
    document.getElementById('namaKategori').value = item.nama_kategori ?? '';
    document.getElementById('deskripsiKategori').value = item.deskripsi ?? '';
    document.getElementById('formModal').showModal();
}
function openDeleteModal(id) {
    const item = currentKategoriList.find(k => k.id_kategori == id);
    if (!item) return;
    deleteTargetId = id;
    document.getElementById('deleteKategoriName').innerText = `"${item.nama_kategori}"`;
    document.getElementById('deleteModal').showModal();
}
document.addEventListener('DOMContentLoaded', () => {
    loadKategori();
    const formTambah = document.getElementById('formKategori');
    formTambah.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nama_kategori: document.getElementById('nama_kategori').value.trim(),
            deskripsi: document.getElementById('deskripsi').value.trim()
        };
        if (!payload.nama_kategori) {
            alert('Nama kategori wajib diisi');
            return;
        }
        try {
            const res = await fetch(KATEGORI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.error || result.message || 'Terjadi kesalahan');
            }
            formTambah.reset();
            await loadKategori();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Gagal menambahkan kategori');
        }
    });

    const formModal = document.getElementById('formModal');
    document.getElementById('closeModalBtn').addEventListener('click', () => formModal.close());
    document.getElementById('cancelBtn').addEventListener('click', () => formModal.close());
    formModal.addEventListener('mousedown', (e) => {
        if (e.target === formModal) formModal.close();
    });
    document.getElementById('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('idKategori').value;
        if (!id) return;
        const payload = {
            nama_kategori: document.getElementById('namaKategori').value.trim(),
            deskripsi: document.getElementById('deskripsiKategori').value.trim()
        };
        try {
            const res = await fetch(`${KATEGORI_URL}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.error || result.message || 'Terjadi kesalahan');
            }
            formModal.close();
            await loadKategori();
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
        if (!deleteTargetId) return;
        try {
            const res = await fetch(`${KATEGORI_URL}/${deleteTargetId}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.error || result.message || 'Terjadi kesalahan');
            }
            deleteModal.close();
            deleteTargetId = null;
            await loadKategori();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Gagal menghapus data');
        }
    });
});