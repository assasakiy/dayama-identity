<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('trusted_url');
            $table->string('dashboard_url');
            $table->boolean('is_active')->default(true)->index();
            $table->string('access_mode', 20)->default('open')->index();
            $table->timestamps();
        });

        Schema::create('account_application_user', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('application_id');
            $table->uuid('user_id');
            $table->uuid('granted_by')->nullable();
            $table->timestamps();
            $table->foreign('application_id')->references('id')->on('account_applications')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('account_users')->cascadeOnDelete();
            $table->foreign('granted_by')->references('id')->on('account_users')->nullOnDelete();
            $table->unique(['application_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_application_user');
        Schema::dropIfExists('account_applications');
    }
};
