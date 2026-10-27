<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        foreach (['DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => ':memory:', 'DB_URL' => '',
            'SCOUT_DRIVER' => 'null', 'SCOUT_QUEUE' => 'false',
            'APP_CONFIG_CACHE' => dirname(__DIR__).'/bootstrap/cache/phpunit-no-config.php'] as $key => $value) {
            putenv($key.'='.$value);
            $_ENV[$key] = $_SERVER[$key] = $value;
        }
        $app = parent::createApplication();
        if ($app['config']->get('database.default') !== 'sqlite'
            || $app['config']->get('database.connections.sqlite.database') !== ':memory:') {
            throw new \RuntimeException('Tests require SQLite :memory:; refusing to access an application database.');
        }
        return $app;
    }
}
