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
        Schema::table('account_users', function (Blueprint $table) {
            $table->unsignedBigInteger('auth_version')->default(1);
        });
        Schema::table('account_role_user', function (Blueprint $table) {
            $table->uuid('scope_id')->nullable()->change();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revocation_reason')->nullable();
            $table->string('scope_key', 36)->virtualAs("coalesce(scope_id, 'unscoped')");
            $table->unique(['user_id', 'role_id', 'scope_key'], 'account_assignment_normalized_unique');
        });
        DB::table('account_role_user')->update([
            'revoked_at' => now(),
            'revocation_reason' => 'Ownership correction: requires explicit Account-local reassignment.',
        ]);
        DB::table('account_users')->increment('auth_version');
        DB::table('account_scopes')->update(['is_active' => false]);
        DB::table('account_scope_types')->whereNotIn('key', ['root', 'foundation', 'institution'])->update(['is_active' => false]);
        foreach (['root' => 'Root', 'foundation' => 'Foundation', 'institution' => 'Institution'] as $key => $name) {
            DB::table('account_scope_types')->updateOrInsert(['key' => $key], [
                'id' => DB::table('account_scope_types')->where('key', $key)->value('id') ?? (string) Str::uuid(),
                'name' => $name, 'is_active' => true, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        DB::table('account_scopes')->insert([
            'id' => '00000000-0000-4000-8000-000000000001',
            'scope_type_id' => DB::table('account_scope_types')->where('key', 'root')->value('id'),
            'key' => 'root', 'label' => 'Root', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        throw new RuntimeException('Ownership correction cannot be rolled back automatically; revoked assignments must not regain access.');
    }
};
