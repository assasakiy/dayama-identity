<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('action', 100)->index();
            $table->string('target_type', 100)->nullable()->index();
            $table->string('target_id', 100)->nullable()->index();
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent()->index();

            $table->foreign('user_id')->references('id')->on('account_users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_audit_logs');
    }
};
