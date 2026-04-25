<?php

return [
    'secret_key' => env('TAP_SECRET_KEY', ''),
    'public_key' => env('TAP_PUBLIC_KEY', ''),
    'currency' => env('TAP_CURRENCY', 'SAR'),
    'base_url' => env('TAP_BASE_URL', 'https://api.tap.company/v2'),
];
