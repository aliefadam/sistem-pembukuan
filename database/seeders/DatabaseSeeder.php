<?php

namespace Database\Seeders;

use App\Models\BusinessSetting;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use LogicException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = config('app.admin');

        if (blank($admin['email']) || blank($admin['password'])) {
            throw new LogicException(
                'Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running php artisan db:seed.',
            );
        }

        User::firstOrCreate(
            ['email' => $admin['email']],
            [
                'name' => $admin['name'],
                'password' => Hash::make($admin['password']),
                'role' => 'owner',
                'status' => 'active',
                'email_verified_at' => now(),
            ],
        );

        foreach ([
            ['income', 'Penjualan'],
            ['income', 'Pendapatan Jasa'],
            ['income', 'Pendapatan Lainnya'],
            ['income', 'Modal Pemilik'],
            ['income', 'Inisialisasi Saldo Awal'],
            ['expense', 'Pembelian Barang'],
            ['expense', 'Operasional'],
            ['expense', 'Sewa Tempat'],
            ['expense', 'Listrik, Air & Internet'],
            ['expense', 'Transportasi'],
            ['expense', 'Marketing'],
            ['expense', 'Perawatan & Perbaikan'],
            ['expense', 'Pajak & Administrasi'],
            ['expense', 'Pengeluaran Lainnya'],
        ] as [$type, $name]) {
            Category::firstOrCreate(compact('type', 'name'));
        }

        BusinessSetting::firstOrCreate([], [
            'business_name' => '',
            'phone' => '',
            'email' => '',
            'address' => '',
        ]);
    }
}
