const API_URL = 'http://localhost:5000/api';
let currentAlatList = [];
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
async function loadAlat() {
    const alatList = document.getElementById('alat-list');
    try {
        const res = await fetch(`${API_URL}/alat`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currentAlatList = ambilData(await res.json());

        if (currentAlatList.length === 0) {
            alatList.innerHTML = `
                <tr>
                    <td colspan="7" class="py-4 px-6 text-center text-gray-500">Belum ada alat yang ditambahkan.</td>
                </tr>`;
            return;
        }
        alatList.innerHTML = currentAlatList.map(alat => `
                    <tr class="hover:bg-gray-50 transition-colors"> 
                <td class="py-4 px-6 text-center text-gray-900">${escapeHTML(alat.id_alat)}</td>
                <td class="py-4 px-6 text-center text-gray-900">${escapeHTML(alat.nama_kategori ?? alat.id_kategori)}</td>
                <td class="py-4 px-6 text-center text-gray-600">${escapeHTML(alat.nama_alat)}</td>
                <td class="py-4 px-6 text-center text-gray-600">${escapeHTML(alat.kondisi)}</td>
                <td class="py-4 px-6 text-center text-gray-600">${escapeHTML(alat.stok)}</td>
                <td class="py-4 px-6 text-center text-gray-600">${escapeHTML(alat.lokasi)}</td>
                <td class="py-4 px-6">
                    <div class="flex justify-center gap-2">
                        <button onclick="openEditModal(${Number(alat.id_alat)})"
                            class="bg-yellow-300 hover:bg-yellow-400 transition-colors cursor-pointer px-3 py-1 rounded-lg">Edit</button>
                        <button onclick="openDeleteModal(${Number(alat.id_alat)})"
                            class="bg-red-300 hover:bg-red-400 transition-colors cursor-pointer px-3 py-1 rounded-lg">Hapus</button>
                    </div>
                </td>
                </tr>
        `).join('');
    } catch (error) {
        console.error('Gagal mengambil data alat:', error);
        alatList.innerHTML = `
        <tr>
                <td colspan="7" class="py-4 px-6 text-center text-red-500">Gagal memuat data alat. Pastikan server aktif.</td>
            </tr>`;
    }
}
async function loadKategori() {
    const selects = [
        document.getElementById('id_kategori'),  
        document.getElementById('kategoriAlat')   
    ];
    try {
        const res = await fetch(`${API_URL}/kategori_alat`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = ambilData(await res.json());
        selects.forEach(select => {
            select.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
            data.forEach(k => {
        const option = document.createElement('option');
                option.value = k.id_kategori;
                option.textContent = k.nama_kategori;
                select.appendChild(option);
            });
    });
    } catch (error) {
        console.error('Gagal memuat kategori:', error);
        selects.forEach(select => {
            select.innerHTML = '<option value="" disabled selected>Gagal memuat kategori</option>';
        });
}
}
function openEditModal(id) {
    const item = currentAlatList.find(a => a.id_alat == id);
    if (!item) return;

    document.getElementById('modalTitle').innerText = 'Edit Alat';
    document.getElementById('idAlat').value = item.id_alat;
    document.getElementById('namaAlat').value = item.nama_alat;
    document.getElementById('kategoriAlat').value = item.id_kategori;
    document.getElementById('kondisiAlat').value = item.kondisi;
    document.getElementById('stokAlat').value = item.stok;
    document.getElementById('lokasiAlat').value = item.lokasi;
    document.getElementById('formModal').showModal();
}
function openDeleteModal(id) {
    const item = currentAlatList.find(a => a.id_alat == id);
    if (!item) return;
    deleteTargetId = id;
    document.getElementById('deleteAlatName').innerText = `"${item.nama_alat}"`;
    document.getElementById('deleteModal').showModal();
}
document.addEventListener('DOMContentLoaded', () => {
    loadAlat();
    loadKategori();
    document.getElementById('formAlat').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nama_alat: document.getElementById('nama_alat').value.trim(),
            id_kategori: document.getElementById('id_kategori').value,
            kondisi: document.getElementById('kondisi').value.trim(),
            stok: Number(document.getElementById('stok').value),
            lokasi: document.getElementById('lokasi').value.trim()
        };
        try {
            const res = await fetch(`${API_URL}/alat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.message || `HTTP ${res.status}`);
            }
            e.target.reset();
            await loadAlat();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Gagal menambahkan alat');
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
        const id = document.getElementById('idAlat').value;
        if (!id) return;

        const payload = {
            nama_alat: document.getElementById('namaAlat').value.trim(),
            id_kategori: document.getElementById('kategoriAlat').value,
            kondisi: document.getElementById('kondisiAlat').value.trim(),
            stok: Number(document.getElementById('stokAlat').value),
            lokasi: document.getElementById('lokasiAlat').value.trim()
        };
        try {
            const res = await fetch(`${API_URL}/alat/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.message || `HTTP ${res.status}`);
            }
            formModal.close();
            await loadAlat();
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
            const res = await fetch(`${API_URL}/alat/${deleteTargetId}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok || result.success === false) {
                throw new Error(result.message || `HTTP ${res.status}`);
            }
            deleteModal.close();
            deleteTargetId = null;
            await loadAlat();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Gagal menghapus data');
        }
    });
});