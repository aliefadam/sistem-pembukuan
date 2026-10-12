<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->id();
            $table->string('type', 16);
            $table->string('name');
            $table->timestamps();
            $table->unique(['type', 'name']);
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('category_name')->default('');
            $table->string('unit', 32)->default('Pcs');
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('sell_price', 15, 2)->default(0);
            $table->unsignedInteger('min_stock')->default(0);
            $table->unsignedInteger('stock')->default(0);
            $table->string('status', 16)->default('active')->index();
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table): void {
            $table->id();
            $table->string('number')->unique();
            $table->string('type', 16)->index();
            $table->date('date')->index();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('category_name')->default('');
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->string('source_type', 32)->nullable()->index();
            $table->string('source_id')->nullable();
            $table->timestamps();
            $table->index(['type', 'date']);
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('stock_ins', function (Blueprint $table): void {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('qty');
            $table->decimal('cost_price', 15, 2);
            $table->date('date')->index();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_outs', function (Blueprint $table): void {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('qty');
            $table->date('date')->index();
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_opnames', function (Blueprint $table): void {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->integer('system_qty');
            $table->integer('actual_qty');
            $table->integer('diff');
            $table->text('note')->nullable();
            $table->date('date')->index();
            $table->timestamps();
        });

        Schema::create('business_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('business_name')->default('');
            $table->string('logo')->nullable();
            $table->string('phone')->default('');
            $table->string('email')->default('');
            $table->text('address')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor_name');
            $table->string('action', 64);
            $table->string('module', 64);
            $table->text('detail');
            $table->timestamps();
            $table->index(['module', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('business_settings');
        Schema::dropIfExists('stock_opnames');
        Schema::dropIfExists('stock_outs');
        Schema::dropIfExists('stock_ins');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
