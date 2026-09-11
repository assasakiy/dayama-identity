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

        Schema::create('account_role_user_temp', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('role_id');
            $table->uuid('assigned_by')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revocation_reason')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('account_users')->cascadeOnDelete();
            $table->foreign('role_id')->references('id')->on('account_roles')->cascadeOnDelete();
            $table->unique(['user_id', 'role_id'], 'account_role_user_user_id_role_id_unique');
        });

        if (Schema::hasTable('account_role_user')) {
            $rows = DB::table('account_role_user')
                ->whereNull('revoked_at')
                ->orderBy('created_at')
                ->get();

            $inserted = [];
            foreach ($rows as $row) {
                $key = $row->user_id.':'.$row->role_id;
                if (! isset($inserted[$key])) {
                    $inserted[$key] = true;
                    DB::table('account_role_user_temp')->insert([
                        'id' => $row->id ?? (string) Str::uuid(),
                        'user_id' => $row->user_id,
                        'role_id' => $row->role_id,
                        'assigned_by' => $row->assigned_by ?? null,
                        'revoked_at' => null,
                        'revocation_reason' => null,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }
            }

            Schema::drop('account_role_user');
        }

        Schema::rename('account_role_user_temp', 'account_role_user');

        Schema::dropIfExists('account_scopes');
        Schema::dropIfExists('account_scope_types');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        throw new RuntimeException('Scope removal cannot be rolled back automatically.');
    }
};
