<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('account_applications', function (Blueprint $table) {
            $table->boolean('include_roles_claim')->default(false)->after('is_first_party');
        });
    }

    public function down(): void
    {
        Schema::table('account_applications', function (Blueprint $table) {
            $table->dropColumn('include_roles_claim');
        });
    }
};
