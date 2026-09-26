<?php

namespace ElioBlocks\Tests\Unit\WordPress\Cache;

use Brain\Monkey;
use Brain\Monkey\Functions;
use ElioBlocks\Contracts\Cache\CacheInterface;
use ElioBlocks\Settings\PluginSettings;
use ElioBlocks\WordPress\Cache\TransientCache;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class TransientCacheTest extends TestCase
{
    /** @var PluginSettings&MockObject */
    private PluginSettings $settings;
    private TransientCache $cache;

    protected function setUp(): void
    {
        parent::setUp();
        Monkey\setUp();

        $this->settings = $this->createMock(PluginSettings::class);
        $this->cache    = new TransientCache('eb_', $this->settings);
    }

    protected function tearDown(): void
    {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_get_returns_false_when_cache_disabled(): void
    {
        $this->settings->method('isCacheEnabled')->willReturn(false);

        $result = $this->cache->get('some-key');

        $this->assertFalse($result);
    }

    public function test_set_returns_false_when_cache_disabled(): void
    {
        $this->settings->method('isCacheEnabled')->willReturn(false);

        $result = $this->cache->set('some-key', 'value');

        $this->assertFalse($result);
    }

    public function test_get_calls_get_transient_with_prefix(): void
    {
        $this->settings->method('isCacheEnabled')->willReturn(true);
        Functions\expect('get_transient')
            ->once()
            ->with('eb_my-key')
            ->andReturn('cached-value');

        $result = $this->cache->get('my-key');

        $this->assertSame('cached-value', $result);
    }

    public function test_set_uses_ttl_from_settings_when_zero(): void
    {
        $this->settings->method('isCacheEnabled')->willReturn(true);
        $this->settings->method('getCacheTime')->willReturn(1800);

        Functions\expect('set_transient')
            ->once()
            ->with('eb_k', 'v', 1800)
            ->andReturn(true);

        $result = $this->cache->set('k', 'v', CacheInterface::TTL_FROM_SETTINGS);

        $this->assertTrue($result);
    }

    public function test_set_uses_explicit_ttl_when_provided(): void
    {
        $this->settings->method('isCacheEnabled')->willReturn(true);
        $this->settings->expects($this->never())->method('getCacheTime');

        Functions\expect('set_transient')
            ->once()
            ->with('eb_k', 'v', 60)
            ->andReturn(true);

        $this->cache->set('k', 'v', 60);
    }

    public function test_key_builds_deterministic_md5(): void
    {
        Functions\expect('wp_json_encode')
            ->twice()
            ->andReturnUsing(fn($v) => json_encode($v));

        $k1 = $this->cache->key('weather_forecast', 48.85, 2.35, 'open-meteo', 'metric');
        $k2 = $this->cache->key('weather_forecast', 48.85, 2.35, 'open-meteo', 'metric');

        $this->assertSame($k1, $k2);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $k1);
    }

    public function test_key_falls_back_when_json_encode_fails(): void
    {
        Functions\expect('wp_json_encode')->once()->andReturn(false);

        $key = $this->cache->key('a', 'b');

        $this->assertMatchesRegularExpression('/^[a-f0-9]{32}$/', $key);
    }
}
