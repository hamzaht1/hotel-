<?php

use Illuminate\Foundation\Vite;
use Tests\TestCase;

uses(TestCase::class)->in('Feature');

uses()->beforeEach(function () {
    app()->instance(Vite::class, new class extends Vite {
        public function __invoke($entrypoints, $buildDirectory = null): \Illuminate\Support\HtmlString
        {
            return new \Illuminate\Support\HtmlString('');
        }
    });
})->in('Feature');
