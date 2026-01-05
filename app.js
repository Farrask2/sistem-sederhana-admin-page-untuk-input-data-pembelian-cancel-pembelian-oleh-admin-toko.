const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public')); 

const db = new sqlite3.Database('./toko.db');

// Inisialisasi Database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS produk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT,
        harga REAL,
        stok INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pembelian (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produk_id INTEGER,
        jumlah INTEGER,
        total_harga REAL,
        status TEXT DEFAULT 'BERHASIL',
        tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(produk_id) REFERENCES produk(id)
    )`);

    db.get("SELECT COUNT(*) as count FROM produk", (err, row) => {
        if (row && row.count === 0) {
            const laptopList = [
                ['MacBook Air M2', 17500000, 10], ['ASUS ROG Zephyrus G14', 24000000, 5],
                ['Lenovo Legion 5 Pro', 19000000, 8], ['Dell XPS 13', 21500000, 6],
                ['HP Pavilion Gaming 15', 11500000, 12], ['Acer Swift Go 14', 10500000, 15],
                ['MSI Katana GF66', 13500000, 7], ['Microsoft Surface Laptop 5', 18000000, 4],
                ['Huawei MateBook D14', 8500000, 20], ['Axioo MyBook Z10', 7000000, 10]
            ];
            const stmt = db.prepare("INSERT INTO produk (nama, harga, stok) VALUES (?, ?, ?)");
            laptopList.forEach((l) => stmt.run(l[0], l[1], l[2]));
            stmt.finalize();
        }
    });
});

// --- ROUTES ---

// 1. Halaman Input (Utama)
app.get('/', (req, res) => {
    db.all("SELECT * FROM produk", [], (err, produk) => {
        res.render('index', { produk });
    });
});

// 2. Halaman Riwayat
app.get('/riwayat', (req, res) => {
    const sql = `SELECT p.*, pr.nama as nama_produk FROM pembelian p 
                 JOIN produk pr ON p.produk_id = pr.id ORDER BY p.id DESC`;
    db.all(sql, [], (err, pembelian) => {
        res.render('riwayat', { pembelian });
    });
});

// 3. Halaman Stok
app.get('/stok', (req, res) => {
    db.all("SELECT * FROM produk ORDER BY stok ASC", [], (err, produk) => {
        res.render('stok', { produk });
    });
});

// --- ACTIONS ---

app.post('/beli', (req, res) => {
    const { produk_id, jumlah } = req.body;
    db.get("SELECT * FROM produk WHERE id = ?", [produk_id], (err, row) => {
        if (row && row.stok >= jumlah) {
            const total = row.harga * jumlah;
            db.run("UPDATE produk SET stok = stok - ? WHERE id = ?", [jumlah, produk_id]);
            db.run("INSERT INTO pembelian (produk_id, jumlah, total_harga) VALUES (?, ?, ?)", 
            [produk_id, jumlah, total], () => res.redirect('/riwayat'));
        } else { res.redirect('/'); }
    });
});

app.post('/cancel/:id', (req, res) => {
    db.get("SELECT * FROM pembelian WHERE id = ? AND status = 'BERHASIL'", [req.params.id], (err, row) => {
        if (row) {
            db.run("UPDATE produk SET stok = stok + ? WHERE id = ?", [row.jumlah, row.produk_id]);
            db.run("UPDATE pembelian SET status = 'DIBATALKAN' WHERE id = ?", [req.params.id]);
        }
        res.redirect('/riwayat');
    });
});

// FITUR BARU: Tambah Stok (Restock)
app.post('/restock/:id', (req, res) => {
    const tambah = parseInt(req.body.tambah_stok);
    db.run("UPDATE produk SET stok = stok + ? WHERE id = ?", [tambah, req.params.id], () => {
        res.redirect('/stok');
    });
});

app.listen(3000, () => console.log('✅ Server aktif di http://localhost:3000'));