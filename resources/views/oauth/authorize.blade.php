<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Authorize {{ $client->name }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: oklch(0.985 0.005 155);
            color: oklch(0.18 0 0);
            min-height: 100svh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .card {
            background: oklch(1 0 0);
            border: 1px solid oklch(0.92 0 0);
            border-radius: 0.5rem;
            padding: 2rem;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 1px 2px oklch(0 0 0 / 0.04), 0 4px 12px oklch(0 0 0 / 0.04);
        }
        .app-header {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .app-logo {
            width: 48px;
            height: 48px;
            border-radius: 0.5rem;
            margin: 0 auto 0.75rem;
            object-fit: contain;
        }
        .app-name {
            font-size: 1.125rem;
            font-weight: 640;
            letter-spacing: -0.015em;
        }
        .app-desc {
            font-size: 0.8125rem;
            color: oklch(0.48 0 0);
            margin-top: 0.25rem;
        }
        .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.625rem 0.75rem;
            background: oklch(0.965 0.008 155);
            border: 1px solid oklch(0.92 0 0);
            border-radius: 0.375rem;
            margin-bottom: 1.25rem;
            font-size: 0.8125rem;
        }
        .user-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: oklch(0.52 0.17 155);
            color: oklch(0.99 0 0);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6875rem;
            font-weight: 600;
            flex-shrink: 0;
        }
        .user-name { font-weight: 500; }
        .user-email { color: oklch(0.48 0 0); font-size: 0.75rem; }
        .scope-label {
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: oklch(0.48 0 0);
            margin-bottom: 0.5rem;
        }
        .scope-list {
            list-style: none;
            display: flex;
            flex-wrap: wrap;
            gap: 0.375rem;
            margin-bottom: 1.5rem;
        }
        .scope-chip {
            display: inline-flex;
            align-items: center;
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.18rem 0.5rem;
            border-radius: 999px;
            background: oklch(0.94 0.04 155);
            color: oklch(0.52 0.17 155);
            border: 1px solid oklch(0.82 0.08 155);
        }
        .actions {
            display: flex;
            gap: 0.75rem;
        }
        .btn {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            font-size: 0.875rem;
            padding: 0.5rem 0.875rem;
            border-radius: 0.25rem;
            border: 1px solid transparent;
            cursor: pointer;
            transition: background-color 120ms, border-color 120ms, color 120ms;
            text-decoration: none;
        }
        .btn:active { transform: translateY(0.5px); }
        .btn-primary {
            background: oklch(0.52 0.17 155);
            color: oklch(0.99 0 0);
            border-color: oklch(0.52 0.17 155);
        }
        .btn-primary:hover { background: oklch(0.50 0.17 155); }
        .btn-outline {
            background: transparent;
            color: oklch(0.18 0 0);
            border-color: oklch(0.85 0 0);
        }
        .btn-outline:hover { background: oklch(0.965 0.008 155); }
    </style>
</head>
<body>
    <div class="card">
        <div class="app-header">
            @if($client->application && $client->application->logo)
                <img src="{{ $client->application->logo }}" alt="" class="app-logo">
            @endif
            <div class="app-name">{{ $client->name }}</div>
            @if($client->application && $client->application->description)
                <div class="app-desc">{{ $client->application->description }}</div>
            @endif
        </div>

        <div class="user-info">
            <div class="user-avatar">{{ strtoupper(substr($user->name ?? $user->email, 0, 1)) }}</div>
            <div>
                <div class="user-name">{{ $user->name ?? $user->email }}</div>
                <div class="user-email">{{ $user->email }}</div>
            </div>
        </div>

        <div class="scope-label">Requested permissions</div>
        <ul class="scope-list">
            @foreach($scopes as $scope)
                <li class="scope-chip">{{ $scope->id }}</li>
            @endforeach
        </ul>

        <form method="POST" action="{{ route('passport.authorizations.approve') }}">
            @csrf
            <input type="hidden" name="auth_token" value="{{ $authToken }}">
            <input type="hidden" name="client_id" value="{{ $client->getKey() }}">
            <input type="hidden" name="redirect_uri" value="{{ $request->input('redirect_uri') }}">
            <input type="hidden" name="response_type" value="{{ $request->input('response_type') }}">
            <input type="hidden" name="state" value="{{ $request->input('state') }}">
            @if($request->input('scope'))
                <input type="hidden" name="scope" value="{{ $request->input('scope') }}">
            @endif
            <div class="actions">
                <button type="submit" class="btn btn-outline" form="deny-form">Deny</button>
                <button type="submit" class="btn btn-primary">Allow</button>
            </div>
        </form>
        <form id="deny-form" method="POST" action="{{ route('passport.authorizations.deny') }}">
            @csrf
            <input type="hidden" name="_method" value="DELETE">
            <input type="hidden" name="auth_token" value="{{ $authToken }}">
        </form>
    </div>
</body>
</html>
