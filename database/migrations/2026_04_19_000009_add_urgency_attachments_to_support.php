<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('support_messages', function (Blueprint $table) {
            $table->boolean('is_urgent')->default(false)->after('status');
            $table->string('source')->default('support')->after('is_urgent');
            $table->boolean('is_read')->default(false)->after('source');
            $table->timestamp('replied_at')->nullable()->after('reply');
        });

        Schema::create('support_message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_message_id')->constrained('support_messages')->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedInteger('size')->nullable();
            $table->timestamps();

            $table->index('support_message_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_message_attachments');
        Schema::table('support_messages', function (Blueprint $table) {
            $table->dropColumn(['is_urgent', 'source', 'is_read', 'replied_at']);
        });
    }
};
