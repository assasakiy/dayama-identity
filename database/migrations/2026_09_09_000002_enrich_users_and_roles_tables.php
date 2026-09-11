<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('account_users', function (Blueprint $table) {
            if (! Schema::hasColumn('account_users', 'username')) {
                $table->string('username')->nullable()->unique()->after('name');
            }
            if (! Schema::hasColumn('account_users', 'is_protected')) {
                $table->boolean('is_protected')->default(false)->after('is_primary_super_admin');
            }
            if (! Schema::hasColumn('account_users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('remember_token');
            }
        });

        Schema::table('account_roles', function (Blueprint $table) {
            if (! Schema::hasColumn('account_roles', 'display_name')) {
                $table->string('display_name')->nullable()->after('guard_name');
            }
            if (! Schema::hasColumn('account_roles', 'slug')) {
                $table->string('slug')->nullable()->after('display_name');
            }
            if (! Schema::hasColumn('account_roles', 'color')) {
                $table->string('color', 30)->nullable()->default('#7c3aed')->after('slug');
            }
            if (! Schema::hasColumn('account_roles', 'icon')) {
                $table->string('icon', 50)->nullable()->default('shield')->after('color');
            }
            if (! Schema::hasColumn('account_roles', 'is_system')) {
                $table->boolean('is_system')->default(false)->after('icon');
            }
            if (! Schema::hasColumn('account_roles', 'status')) {
                $table->string('status', 20)->default('active')->after('is_system');
            }
            if (! Schema::hasColumn('account_roles', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('status');
            }
        });

        Schema::table('account_user_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('account_user_profiles', 'nickname')) {
                $table->string('nickname')->nullable()->after('display_name');
            }
            if (! Schema::hasColumn('account_user_profiles', 'banner')) {
                $table->string('banner')->nullable()->after('avatar_url');
            }
            if (! Schema::hasColumn('account_user_profiles', 'website')) {
                $table->string('website')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('account_user_profiles', 'social_links')) {
                $table->json('social_links')->nullable()->after('website');
            }
        });
    }

    public function down(): void
    {
        Schema::table('account_users', function (Blueprint $table) {
            $table->dropColumn(['username', 'is_protected', 'last_login_at']);
        });

        Schema::table('account_roles', function (Blueprint $table) {
            $table->dropColumn(['display_name', 'slug', 'color', 'icon', 'is_system', 'status', 'sort_order']);
        });

        Schema::table('account_user_profiles', function (Blueprint $table) {
            $table->dropColumn(['nickname', 'banner', 'website', 'social_links']);
        });
    }
};
