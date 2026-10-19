<?php

namespace Tests\Feature;

use App\Models\BookkeepingData;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookkeepingDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_read_or_save_bookkeeping_data(): void
    {
        $this->getJson('/data')->assertUnauthorized();
        $this->putJson('/data', ['data' => []])->assertUnauthorized();
    }

    public function test_authenticated_user_can_save_and_export_database_backup(): void
    {
        $this->actingAs(User::factory()->create());
        $backup = [
            'bookkeeping_income' => [[
                'id' => 'income-1',
                'amount' => 125000,
                'description' => 'Penjualan',
            ]],
            'bookkeeping_categories' => [],
            'bookkeeping_products' => [[
                'id' => 'tuna',
                'portionEnabled' => true,
                'portionStock' => 11,
                'portionsPerPack' => 3,
                'sellPricePerPortion' => 12000,
                'sellPricePerPack' => 30000,
            ]],
            'bookkeeping_stock_cuts' => [[
                'id' => 'cut-1',
                'rawQty' => 2.5,
                'portionQty' => 7,
            ]],
            'bookkeeping_stock_conversions' => [[
                'id' => 'conversion-1',
                'fromQty' => 2.5,
                'fromUnit' => 'kg',
                'toQty' => 7,
                'toUnit' => 'potong',
                'sellPrice' => 12000,
            ]],
            'bookkeeping_settings' => [
                'businessName' => 'Toko Tuna',
                'logo' => 'data:image/png;base64,logo-data',
                'phone' => '08123456789',
                'email' => 'usaha@example.com',
                'address' => 'Jalan Ikan No. 1',
            ],
        ];

        $this->putJson('/data', ['data' => $backup])
            ->assertOk()
            ->assertJsonPath('data.bookkeeping_income.0.id', 'income-1')
            ->assertJsonPath('data.bookkeeping_expense', []);

        $this->getJson('/data/backup')
            ->assertOk()
            ->assertJsonPath('data.bookkeeping_income.0.amount', 125000)
            ->assertJsonPath('data.bookkeeping_products.0.portionsPerPack', 3)
            ->assertJsonPath('data.bookkeeping_products.0.sellPricePerPack', 30000)
            ->assertJsonPath('data.bookkeeping_stock_cuts.0.portionQty', 7)
            ->assertJsonPath('data.bookkeeping_stock_conversions.0.toUnit', 'potong')
            ->assertJsonPath('data.bookkeeping_settings.businessName', 'Toko Tuna')
            ->assertJsonPath('data.bookkeeping_settings.logo', 'data:image/png;base64,logo-data')
            ->assertJsonPath('data.bookkeeping_settings.phone', '08123456789')
            ->assertJsonPath('data.bookkeeping_settings.email', 'usaha@example.com')
            ->assertJsonPath('data.bookkeeping_settings.address', 'Jalan Ikan No. 1');

        $this->assertDatabaseCount('bookkeeping_data', 1);
        $storedData = BookkeepingData::firstOrFail()->data;
        $this->assertSame($backup['bookkeeping_income'], $storedData['bookkeeping_income']);
        $this->assertSame($backup['bookkeeping_settings'], $storedData['bookkeeping_settings']);
    }

    public function test_json_restore_replaces_the_database_snapshot(): void
    {
        $this->actingAs(User::factory()->create());
        $this->putJson('/data', [
            'data' => ['bookkeeping_income' => [['id' => 'old']]],
        ])->assertOk();

        $this->putJson('/data', [
            'data' => ['bookkeeping_expense' => [['id' => 'restored']]],
        ])->assertOk()
            ->assertJsonPath('data.bookkeeping_income', [])
            ->assertJsonPath('data.bookkeeping_expense.0.id', 'restored');
    }

    public function test_legacy_data_is_imported_without_overwriting_existing_database_records(): void
    {
        $this->actingAs(User::factory()->create());
        $this->putJson('/data', [
            'data' => [
                'bookkeeping_categories' => [['id' => 'existing-category', 'name' => 'Baru']],
            ],
        ])->assertOk();

        $legacyData = [
            'bookkeeping_categories' => [
                ['id' => 'legacy-category', 'name' => 'Penjualan'],
                ['id' => 'existing-category', 'name' => 'Nilai lama'],
            ],
        ];
        $this->postJson('/data/migrate', ['data' => $legacyData])
            ->assertOk()
            ->assertJsonPath('data.bookkeeping_categories.0.name', 'Baru')
            ->assertJsonPath('data.bookkeeping_categories.1.id', 'legacy-category');
    }

    public function test_invalid_collection_data_is_rejected(): void
    {
        $this->actingAs(User::factory()->create());

        $this->putJson('/data', [
            'data' => ['bookkeeping_income' => 'not-an-array'],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('data.bookkeeping_income');
    }
}
