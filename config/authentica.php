<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentica OTP Gateway (authentica.sa)
    |--------------------------------------------------------------------------
    |
    | SMS / WhatsApp one-time-password delivery. We generate and verify the
    | code ourselves and only use Authentica's `/send-otp` endpoint to deliver
    | it (the endpoint accepts our own `otp`), so verification stays local and
    | the surrounding flows keep working when the gateway isn't configured.
    |
    */

    // API key from the Authentica dashboard. Sent as the `X-Authorization` header.
    'key' => env('AUTHENTICA_API_KEY'),

    // Base URL of the Authentica REST API (v2).
    'base_url' => env('AUTHENTICA_BASE_URL', 'https://api.authentica.sa/api/v2'),

    // Default delivery channel: sms | whatsapp | email.
    'channel' => env('AUTHENTICA_CHANNEL', 'sms'),

    // Optional approved message template id (required by some Authentica accounts).
    'template_id' => env('AUTHENTICA_TEMPLATE_ID'),

    // Request timeout in seconds.
    'timeout' => (int) env('AUTHENTICA_TIMEOUT', 15),

];
