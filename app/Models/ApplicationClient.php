<?php

namespace App\Models;

use Laravel\Passport\Client;

class ApplicationClient extends Client
{
    protected $table = 'oauth_clients';

    protected $fillable = [
        'name',
        'redirect_uris',
        'grant_types',
        'revoked',
        'application_id',
    ];

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function skipsAuthorization($user, array $scopes): bool
    {
        return (bool) ($this->application?->is_first_party ?? false);
    }
}
