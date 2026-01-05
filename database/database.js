const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./toko.db');

db.serialize(() => {
    // Tabel Produk & Stock (One-to-One / Integrated)
    db.run(`CREATE TABLE IF NOT EXISTS produk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT,
        harga REAL,
        stok INTEGER
    )`);

    // Tabel Pembelian
    db.run(`CREATE TABLE IF NOT EXISTS pembelian (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produk_id INTEGER,
        jumlah INTEGER,
        total_harga REAL,
        status TEXT DEFAULT 'BERHASIL',
        tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(produk_id) REFERENCES produk(id)
    )`);

    // Input 10 Produk Awal jika tabel kosong
    db.get("SELECT COUNT(*) as count FROM produk", (err, row) => {
        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO produk (nama, harga, stok) VALUES (?, ?, ?)");
            for (let i = 1; i <= 10; i++) {
                stmt.run(`Produk ${i}`, i * 10000, 50);
            }
            stmt.finalize();
        }
    });
});

module.exports = db;