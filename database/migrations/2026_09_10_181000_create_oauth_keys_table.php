<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('oauth_keys', function (Blueprint $table) {
            $table->string('kid', 64)->primary();
            $table->text('public_key');
            $table->text('private_key');
            $table->string('status', 20)->default('active')->index();
            $table->timestamp('retained_until')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oauth_keys');
    }
};
