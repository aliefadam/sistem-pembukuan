<?php

namespace App\Http\Controllers;

use App\Models\BookkeepingData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookkeepingDataController extends Controller
{
    private const RECORD_ID = 1;

    private const COLLECTION_KEYS = [
        'bookkeeping_income',
        'bookkeeping_expense',
        'bookkeeping_categories',
        'bookkeeping_products',
        'bookkeeping_stock_in',
        'bookkeeping_stock_out',
        'bookkeeping_stock_opname',
        'bookkeeping_stock_conversions',
        'bookkeeping_stock_cuts',
        'bookkeeping_users',
        'bookkeeping_logs',
    ];

    public function show(): JsonResponse
    {
        $record = BookkeepingData::query()->find(self::RECORD_ID);

        return response()->json(['data' => $record?->data]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],
        ]);
        $data = $this->normalize($validated['data']);

        $record = BookkeepingData::query()->updateOrCreate(
            ['id' => self::RECORD_ID],
            ['data' => $data],
        );

        return response()->json(['data' => $record->data]);
    }

    public function migrateLegacyData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],
        ]);
        $data = $this->normalize($validated['data']);

        $record = DB::transaction(function () use ($data): BookkeepingData {
            $existing = BookkeepingData::query()
                ->whereKey(self::RECORD_ID)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                $merged = $this->mergeLegacyData($existing->data, $data);
                if ($merged !== $existing->data) {
                    $existing->update(['data' => $merged]);
                }

                return $existing->fresh() ?? $existing;
            }

            return BookkeepingData::query()->create([
                'id' => self::RECORD_ID,
                'data' => $data,
            ]);
        });

        return response()->json(['data' => $record->data]);
    }

    private function mergeLegacyData(array $current, array $legacy): array
    {
        foreach (self::COLLECTION_KEYS as $key) {
            $existingItems = $current[$key] ?? [];
            $legacyItems = $legacy[$key] ?? [];
            $knownIds = [];

            foreach ($existingItems as $item) {
                if (is_array($item) && array_key_exists('id', $item)) {
                    $knownIds[(string) $item['id']] = true;
                }
            }

            foreach ($legacyItems as $item) {
                if (! is_array($item) || ! array_key_exists('id', $item)) {
                    $existingItems[] = $item;

                    continue;
                }

                $id = (string) $item['id'];
                if (isset($knownIds[$id])) {
                    continue;
                }

                $knownIds[$id] = true;
                $existingItems[] = $item;
            }

            $current[$key] = $existingItems;
        }

        $settingsKey = 'bookkeeping_settings';
        $existingSettings = $current[$settingsKey] ?? [];
        foreach ($legacy[$settingsKey] ?? [] as $key => $value) {
            if (! isset($existingSettings[$key]) || $existingSettings[$key] === '') {
                $existingSettings[$key] = $value;
            }
        }
        $current[$settingsKey] = $existingSettings;

        return $current;
    }

    private function normalize(array $input): array
    {
        if (isset($input['data']) && is_array($input['data'])) {
            $input = $input['data'];
        }

        $data = [];
        foreach (self::COLLECTION_KEYS as $key) {
            if (array_key_exists($key, $input) && ! is_array($input[$key])) {
                throw ValidationException::withMessages([
                    "data.{$key}" => "Data {$key} harus berupa array.",
                ]);
            }

            $data[$key] = $input[$key] ?? [];
            foreach ($data[$key] as $index => $item) {
                if (! is_array($item) || array_is_list($item)) {
                    throw ValidationException::withMessages([
                        "data.{$key}.{$index}" => 'Setiap item data harus berupa object JSON.',
                    ]);
                }
            }
        }

        $settingsKey = 'bookkeeping_settings';
        if (array_key_exists($settingsKey, $input) && ! is_array($input[$settingsKey])) {
            throw ValidationException::withMessages([
                "data.{$settingsKey}" => 'Pengaturan usaha harus berupa object.',
            ]);
        }

        $data[$settingsKey] = array_merge([
            'businessName' => '',
            'logo' => '',
            'phone' => '',
            'email' => '',
            'address' => '',
        ], $input[$settingsKey] ?? []);

        return $data;
    }
}
