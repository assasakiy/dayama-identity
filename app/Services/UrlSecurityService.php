<?php

namespace App\Services;

use App\Models\Application;

class UrlSecurityService
{
    public static function isValidUrl(string $url): bool
    {
        if (preg_match('/[\x00-\x1F\x7F\\\\]/', $url)) {
            return false;
        }

        $parts = parse_url($url);
        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            return false;
        }

        if (isset($parts['user']) || isset($parts['pass'])) {
            return false;
        }

        $scheme = strtolower($parts['scheme']);
        $host = strtolower($parts['host']);

        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        if ($scheme === 'http') {
            if (app()->isProduction()) {
                return false;
            }

            if (! self::isDevAllowedHost($host)) {
                return false;
            }
        }

        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    public static function isValidReturnUrl(string $returnUrl, ?Application $application = null): bool
    {
        if (preg_match('/[\x00-\x1F\x7F\\\\]/', $returnUrl)) {
            return false;
        }

        if (str_starts_with($returnUrl, '/') && ! str_starts_with($returnUrl, '//')) {
            return true;
        }

        if (! self::isValidUrl($returnUrl)) {
            return false;
        }

        $parsedReturn = parse_url($returnUrl);
        $returnHost = strtolower($parsedReturn['host'] ?? '');

        if ($application) {
            $base = parse_url($application->base_url);
            $launch = parse_url($application->launch_url);

            $allowedHosts = array_filter([
                strtolower($base['host'] ?? ''),
                strtolower($launch['host'] ?? ''),
            ]);

            return in_array($returnHost, $allowedHosts, true);
        }

        return Application::where('status', 'active')->get()->contains(function (Application $app) use ($returnHost) {
            $baseHost = strtolower(parse_url($app->base_url, PHP_URL_HOST) ?? '');
            $launchHost = strtolower(parse_url($app->launch_url, PHP_URL_HOST) ?? '');

            return in_array($returnHost, array_filter([$baseHost, $launchHost]), true);
        });
    }

    private static function isDevAllowedHost(string $host): bool
    {
        if (in_array($host, ['localhost', '127.0.0.1', '::1', '[::1]'], true)) {
            return true;
        }

        return (bool) preg_match('/\.(test|local|internal)$/', $host);
    }
}
