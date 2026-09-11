<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('person_id')->nullable()->index();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('is_primary_super_admin')->default(false);
            $table->string('status')->default('active')->index();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('account_user_profiles', function (Blueprint $table) {
            $table->uuid('user_id')->primary();
            $table->string('display_name');
            $table->string('avatar_url')->nullable();
            $table->text('bio')->nullable();
            $table->string('phone')->nullable();
            $table->string('locale', 10)->default('id');
            $table->string('theme', 20)->default('system');
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('account_users')->cascadeOnDelete();
        });

        Schema::create('account_user_emails', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('email')->unique();
            $table->timestamp('verified_at')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('account_users')->cascadeOnDelete();
        });

        Schema::create('account_connected_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('provider');
            $table->string('provider_user_id');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('account_users')->cascadeOnDelete();
            $table->unique(['provider', 'provider_user_id']);
        });

        Schema::create('account_login_histories', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('successful');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('account_scope_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('account_scopes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('scope_type_id');
            $table->uuid('reference_id')->nullable();
            $table->string('label');
            $table->string('key')->nullable();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->foreign('scope_type_id')->references('id')->on('account_scope_types')->restrictOnDelete();
            $table->unique(['scope_type_id', 'reference_id']);
        });

        Schema::create('account_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->string('description')->nullable();
            $table->unsignedInteger('rank')->default(0);
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        Schema::create('account_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->string('module')->default('account');
            $table->string('action')->default('view');
            $table->string('description')->nullable();
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        Schema::create('account_role_has_permissions', function (Blueprint $table) {
            $table->uuid('permission_id');
            $table->uuid('role_id');
            $table->primary(['permission_id', 'role_id']);
            $table->foreign('permission_id')->references('id')->on('account_permissions')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('account_roles')->cascadeOnDelete();
        });

        Schema::create('account_model_has_roles', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->string('model_type');
            $table->uuid('model_id');
            $table->index(['model_id', 'model_type'], 'account_model_has_roles_model_id_model_type_index');
            $table->primary(['role_id', 'model_id', 'model_type'], 'account_model_has_roles_role_model_type_primary');
            $table->foreign('role_id')->references('id')->on('account_roles')->cascadeOnDelete();
        });

        Schema::create('account_model_has_permissions', function (Blueprint $table) {
            $table->uuid('permission_id');
            $table->string('model_type');
            $table->uuid('model_id');
            $table->index(['model_id', 'model_type'], 'account_model_has_permissions_model_id_model_type_index');
            $table->primary(['permission_id', 'model_id', 'model_type'], 'account_model_has_permissions_permission_model_type_primary');
            $table->foreign('permission_id')->references('id')->on('account_permissions')->cascadeOnDelete();
        });

        Schema::create('account_role_user', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('role_id');
            $table->uuid('scope_id');
            $table->uuid('assigned_by')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('account_users')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('account_roles')->cascadeOnDelete();
            $table->foreign('scope_id')->references('id')->on('account_scopes')->cascadeOnDelete();
            $table->unique(['user_id', 'role_id', 'scope_id']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('account_role_user');
        Schema::dropIfExists('account_model_has_permissions');
        Schema::dropIfExists('account_model_has_roles');
        Schema::dropIfExists('account_role_has_permissions');
        Schema::dropIfExists('account_permissions');
        Schema::dropIfExists('account_roles');
        Schema::dropIfExists('account_scopes');
        Schema::dropIfExists('account_scope_types');
        Schema::dropIfExists('account_login_histories');
        Schema::dropIfExists('account_connected_accounts');
        Schema::dropIfExists('account_user_emails');
        Schema::dropIfExists('account_user_profiles');
        Schema::dropIfExists('account_users');
    }
};
