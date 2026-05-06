<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Bindings to Flush Between Requests
    |--------------------------------------------------------------------------
    |
    | Octane keeps the application instance alive between requests, so any
    | bindings made via `app()->instance(key, value)` would otherwise leak
    | state across requests. List those keys here so Octane forgets them
    | after each request — without this, a tenant_id bound by one request
    | could be used by the next one and surface the wrong tenant's data.
    |
    */

    'flush' => [
        'current_tenant',
        'current_tenant_id',
    ],

];
