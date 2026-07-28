<?php

return [
    'secret_key' => env('TAP_SECRET_KEY', ''),
    'publishable_key' => env('TAP_PUBLISHABLE_KEY', ''),
    'currency' => env('TAP_CURRENCY', 'SAR'),
    'base_url' => env('TAP_BASE_URL', 'https://api.tap.company/v2'),
];
