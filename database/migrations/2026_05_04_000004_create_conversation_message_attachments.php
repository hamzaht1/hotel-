<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_message_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->timestamps();

            $table->index('conversation_message_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_message_attachments');
    }
};
