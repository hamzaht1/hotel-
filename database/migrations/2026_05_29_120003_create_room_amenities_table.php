<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Default bilingual labels + emoji per preset amenity key. Used to
     * promote each entry from the legacy `rooms.amenities` JSON column into
     * a row of the new normalised table before the column is dropped.
     */
    private array $presetLabels = [
        'wifi'              => ['ar' => 'واي فاي',         'en' => 'WiFi',                'icon' => '📶'],
        'tv'                => ['ar' => 'تلفاز',           'en' => 'TV',                  'icon' => '📺'],
        'minibar'           => ['ar' => 'ميني بار',         'en' => 'Mini Bar',            'icon' => '🍷'],
        'safe'              => ['ar' => 'خزنة',            'en' => 'Safe',                'icon' => '🔐'],
        'air_conditioning'  => ['ar' => 'تكييف',           'en' => 'Air Conditioning',    'icon' => '❄️'],
        'balcony'           => ['ar' => 'شرفة',            'en' => 'Balcony',             'icon' => '🪟'],
        'sea_view'          => ['ar' => 'إطلالة بحرية',     'en' => 'Sea View',            'icon' => '🌊'],
        'room_service'      => ['ar' => 'خدمة الغرف',      'en' => 'Room Service',        'icon' => '🛎️'],
        'jacuzzi'           => ['ar' => 'جاكوزي',          'en' => 'Jacuzzi',             'icon' => '🛁'],
        'kitchen'           => ['ar' => 'مطبخ',            'en' => 'Kitchen',             'icon' => '🍴'],
    ];

    public function up(): void
    {
        Schema::create('room_amenities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('key', 100);
            $table->string('label_ar');
            $table->string('label_en');
            $table->string('icon', 10)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['room_id', 'sort_order']);
        });

        // Backfill rows from the legacy JSON amenities column so we can drop
        // it without losing per-tenant data.
        DB::table('rooms')->select('id', 'amenities')->orderBy('id')->each(function ($room) {
            $items = json_decode($room->amenities ?? '[]', true) ?: [];
            $now = now();
            $sort = 0;
            foreach ($items as $item) {
                if (!is_string($item)) {
                    continue;
                }
                $preset = $this->presetLabels[$item] ?? null;
                DB::table('room_amenities')->insert([
                    'room_id'    => $room->id,
                    'key'        => $item,
                    'label_ar'   => $preset['ar'] ?? $item,
                    'label_en'   => $preset['en'] ?? $item,
                    'icon'       => $preset['icon'] ?? null,
                    'sort_order' => $sort++,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('amenities');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->json('amenities')->nullable()->after('capacity');
        });

        Schema::dropIfExists('room_amenities');
    }
};
