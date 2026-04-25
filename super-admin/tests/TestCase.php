<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;

abstract class TestCase extends BaseTestCase
{
    /**
     * Both apps share one Postgres database in production. Tests run against a
     * sqlite :memory: DB, so we need to apply both migration sets. RefreshDatabase
     * runs the super-admin migrations during parent::setUp(); right after, we
     * also apply the main-app migrations to add columns / tables introduced
     * there (reviews, request_tags, support_messages, plan flags, etc).
     */
    protected function setUp(): void
    {
        parent::setUp();

        $mainPath = realpath(base_path('../database/migrations'));
        if ($mainPath !== false && is_dir($mainPath)) {
            Artisan::call('migrate', [
                '--path' => $mainPath,
                '--realpath' => true,
                '--force' => true,
            ]);
        }
    }
}
