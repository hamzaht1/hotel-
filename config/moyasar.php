<?php

return [
    'secret_key' => env('MOYASAR_SECRET_KEY', ''),
    'publishable_key' => env('MOYASAR_PUBLISHABLE_KEY', ''),
    'currency' => env('MOYASAR_CURRENCY', 'SAR'),
    'base_url' => env('MOYASAR_BASE_URL', 'https://api.moyasar.com/v1'),
];
