<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        $appUsers = DB::table('account_application_user')->get();
        Schema::dropIfExists('account_application_user');

        Schema::create('account_applications_new', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('base_url');
            $table->string('launch_url');
            $table->string('access_mode', 20)->default('authenticated')->index();
            $table->string('status', 20)->default('active')->index();
            $table->timestamps();
        });

        DB::statement("
            INSERT INTO account_applications_new (id, code, name, base_url, launch_url, access_mode, status, created_at, updated_at)
            SELECT
                id,
                `key`,
                name,
                trusted_url,
                dashboard_url,
                CASE WHEN access_mode = 'open' THEN 'authenticated' ELSE access_mode END,
                CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END,
                created_at,
                updated_at
            FROM account_applications
        ");

        Schema::dropIfExists('account_applications');
        Schema::rename('account_applications_new', 'account_applications');

        Schema::create('account_application_user', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('application_id');
            $table->uuid('user_id');
            $table->uuid('granted_by')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revocation_reason')->nullable();
            $table->timestamps();
            $table->foreign('application_id')->references('id')->on('account_applications')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('account_users')->cascadeOnDelete();
            $table->foreign('granted_by')->references('id')->on('account_users')->nullOnDelete();
            $table->unique(['application_id', 'user_id']);
        });

        foreach ($appUsers as $row) {
            DB::table('account_application_user')->insert([
                'id' => $row->id ?? (string) Str::uuid(),
                'application_id' => $row->application_id,
                'user_id' => $row->user_id,
                'granted_by' => $row->granted_by,
                'status' => 'active',
                'granted_at' => $row->created_at,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        Schema::table('account_users', function (Blueprint $table) {
            $table->dropIndex('account_users_person_id_index');
            $table->dropColumn('person_id');
        });

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        throw new RuntimeException('This migration cannot be reversed safely.');
    }
};
