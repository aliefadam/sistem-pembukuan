<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AppController;
use App\Http\Controllers\BookkeepingDataController;

Route::middleware('auth')->controller(BookkeepingDataController::class)->group(function (): void {
    Route::get('/data', 'show')->name('data.show');
    Route::get('/data/backup', 'show')->name('data.backup');
    Route::put('/data', 'store')->name('data.store');
    Route::post('/data/migrate', 'migrateLegacyData')->name('data.migrate');
});

Route::middleware('auth')->controller(AppController::class)->group(function (): void {
    Route::get('/', 'index')->name('dashboard');
    Route::get('/pembukuan/pemasukan', 'index')->name('pembukuan.pemasukan');
    Route::get('/pembukuan/pengeluaran', 'index')->name('pembukuan.pengeluaran');
    Route::get('/pembukuan/kategori', 'index')->name('pembukuan.kategori');
    Route::get('/stok/barang', 'index')->name('stok.barang');
    Route::get('/stok/barang-masuk', 'index')->name('stok.barang-masuk');
    Route::get('/stok/konversi', 'index')->name('stok.konversi');
    Route::get('/stok/pemotongan', 'index')->name('stok.pemotongan');
    Route::get('/stok/barang-keluar', 'index')->name('stok.barang-keluar');
    Route::get('/stok/stock-opname', 'index')->name('stok.stock-opname');
    Route::get('/laporan/pemasukan', 'index')->name('laporan.pemasukan');
    Route::get('/laporan/pengeluaran', 'index')->name('laporan.pengeluaran');
    Route::get('/laporan/cash-flow', 'index')->name('laporan.cash-flow');
    Route::get('/laporan/laba', 'index')->name('laporan.laba');
    Route::get('/laporan/stok', 'index')->name('laporan.stok');
    Route::get('/pengaturan/profil', 'index')->name('pengaturan.profil');
    Route::get('/pengaturan/pengguna', 'index')->name('pengaturan.pengguna');
    Route::get('/pengaturan/role', 'index')->name('pengaturan.role');
    Route::get('/pengaturan/backup', 'index')->name('pengaturan.backup');
    Route::get('/pengaturan/audit-log', 'index')->name('pengaturan.audit-log');
});

require __DIR__.'/auth.php';
