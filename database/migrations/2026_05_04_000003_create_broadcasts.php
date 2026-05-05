<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_name');
            $table->string('target_type'); // all, plan, city
            $table->json('target_filter')->nullable(); // {plan_id?, city?}
            $table->string('subject');
            $table->text('body');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->unsignedInteger('recipient_count')->default(0);
            $table->timestamps();
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->foreignId('broadcast_id')->nullable()->after('source')->constrained('broadcasts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['broadcast_id']);
            $table->dropColumn('broadcast_id');
        });
        Schema::dropIfExists('broadcasts');
    }
};
