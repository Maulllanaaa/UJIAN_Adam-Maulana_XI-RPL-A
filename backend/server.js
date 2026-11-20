const pool = require("./db");
const cors = require("cors");
const express = require("express");
const app = express();

app.use(cors());
app.use(express.json()); 


app.get("/", (req, res) => {
    res.send("Selamat datang di Server Backend Peminjaman alat!");
});

// read
app.get("/api/alat", async (req, res) => {
    try {  
        const result = await pool.query("SELECT * FROM alat");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
}); 

app.get("/api/peminjaman", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM peminjaman");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
}); 

app.get("/api/kategori_alat", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM kategori_alat");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
}); 

//  delete  
app.delete("/api/alat/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const query = "DELETE FROM alat WHERE id_alat = $1 RETURNING *";
        const result = await pool.query(query,[id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
}); 

app.delete("/api/peminjaman/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const query = "DELETE FROM peminjaman WHERE id_peminjaman  = $1 RETURNING *";
        const result = await pool.query(query,[id])
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
}); 

app.delete("/api/kategori_alat/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const query = "DELETE FROM kategori_alat WHERE id_kategori  = $1 RETURNING *";
        const result = await pool.query(query,[id])
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
}); 

// post
app.post("/api/alat/", async (req, res) => {
    try{
        const { id_kategori, nama_alat, kondisi, stok, lokasi } = req.body;
        const query = `INSERT INTO alat (id_kategori, nama_alat, kondisi, stok, lokasi) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const result = await pool.query(query,[id_kategori, nama_alat, kondisi, stok, lokasi]);
        res.json(result.rows);
    }catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
});

app.post("/api/kategori_alat/", async (req, res) => {
    try{
        const { nama_kategori, deskripsi } = req.body;
        const query = `INSERT INTO kategori_alat ( nama_kategori, deskripsi ) 
        VALUES ($1, $2) RETURNING *`;
        const result = await pool.query(query,[nama_kategori, deskripsi]);
        res.json(result.rows);
    }catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
});

app.post("/api/peminjaman/", async (req, res) => {
    try{
        const { id_alat, nama_peminjam, kelas, tanggal_pinjam, tanggal_kembali, jumlah, status } = req.body;
        const query = `INSERT INTO peminjaman ( id_alat, nama_peminjam, kelas, tanggal_pinjam,  tanggal_kembali, jumlah, status ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const result = await pool.query(query,[id_alat, nama_peminjam, kelas, tanggal_pinjam,tanggal_kembali, jumlah, status]);
        res.json(result.rows);
    }catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
});

// update
app.patch("/api/alat/:id", async(req, res) => {
     try{
        const{id} = req.params;
        const { id_kategori, nama_alat, kondisi, stok, lokasi } = req.body;
        const query = `
                      UPDATE alat 
                      SET id_kategori = COALESCE ($1, id_kategori),
                      nama_alat = COALESCE ($2, nama_alat),
                      kondisi = COALESCE ($3, kondisi),
                      stok = COALESCE ($4, stok),
                      lokasi =  COALESCE ($5, lokasi)
                      WHERE id_alat = $6 RETURNING * 
                      `;
        const result = await pool.query(query,[id_kategori, nama_alat, kondisi, stok, lokasi, id ]);
        if (result.rows.length === 0){
            return res.status(404).json({error:"Data tidak ditemukan"});
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Data tidak bisa diupdate" });
    }  
});

app.patch("/api/kategori_alat/:id", async(req, res) => {
     try{
        const{id} = req.params;
        const { nama_kategori, deskripsi } = req.body;
        const query = `
                      UPDATE kategori_alat
                      SET nama_kategori = COALESCE ($2, nama_kategori),
                      deskripsi = COALESCE ($3, deskripsi)
                      WHERE id_kategori = $1 RETURNING * 
                      `;
        const result = await pool.query(query,[id, nama_kategori, deskripsi]);
        if (result.rows.length === 0){
            return res.status(404).json({error:"Data tidak ditemukan"});
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Data tidak bisa diupdate" });
    }  
});

app.patch("/api/peminjaman/:id", async(req, res) => {
     try{
        const{id} = req.params;
        const query = `
                      UPDATE peminjaman
                      SET status = 'Dikembalikan', 
                      tanggal_kembali = CURRENT_DATE 
                      WHERE id_peminjaman = $1 AND status = 'Dipinjam' RETURNING * 
                      `;
        const result = await pool.query(query,[id]);
        if(!result.rows.length) return res.status(404).json({message: 'Data tidak ditemukan atau sudah dikembalikan'});
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Data tidak bisa diupdate" });
    }  
});

// Menjalankan server pada port 5000
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server berhasil berjalan di http://localhost:${PORT}`);
});