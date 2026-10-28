<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Servicio no disponible · {{ config('app.name', 'Seguimiento de Trámites') }}</title>
    <link rel="icon" type="image/x-icon" href="/favicon/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
    <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png">
    <meta name="theme-color" content="#107C41">
    <meta name="robots" content="noindex">
    <style>
        :root {
            --green: #107c41;
            --green-dark: #0c5c30;
            --gold: #f2c811;
            --blue: #0078d4;
            --red: #c42b1c;
            --bg: #f3f2f1;
            --surface: #ffffff;
            --surface-2: #faf9f8;
            --border: #e1dfdd;
            --text: #242424;
            --muted: #605e5c;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #111111;
                --surface: #1f1f1f;
                --surface-2: #262626;
                --border: #3a3a3a;
                --text: #f3f2f1;
                --muted: #b3b0ad;
            }
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--bg);
            color: var(--text);
            font-family: "Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        .card {
            width: 100%;
            max-width: 520px;
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 14px;
            background: var(--surface);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
        }

        .accent { height: 4px; background: var(--green); }

        .body { padding: 32px; }

        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 24px;
        }

        .brand img {
            width: 36px;
            height: 36px;
            padding: 3px;
            border-radius: 8px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }

        .brand-name { font-size: 14px; font-weight: 600; line-height: 1.2; }
        .brand-sub { font-size: 11px; color: var(--muted); }

        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            margin-bottom: 18px;
            border-radius: 12px;
            background: #fff8d6;
            color: #8a6700;
        }

        @media (prefers-color-scheme: dark) {
            .icon { background: rgba(242, 200, 17, 0.12); color: var(--gold); }
        }

        h1 {
            margin: 0 0 12px;
            font-size: 22px;
            line-height: 1.3;
            font-weight: 600;
        }

        p { margin: 0 0 14px; font-size: 14px; line-height: 1.65; }

        .muted { color: var(--muted); }

        .actions { margin-top: 24px; }

        .button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border: 0;
            border-radius: 6px;
            background: var(--green);
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
        }

        .button:hover { background: var(--green-dark); }

        .button:focus-visible {
            outline: 2px solid var(--blue);
            outline-offset: 2px;
        }

        .footer {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 14px 32px;
            border-top: 1px solid var(--border);
            background: var(--surface-2);
            font-size: 11px;
            color: var(--muted);
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 2px 8px;
            border: 1px solid var(--border);
            border-radius: 4px;
            font-weight: 600;
        }

        .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--muted); }

        .badge-warning { border-color: rgba(242, 200, 17, 0.4); color: #8a6700; }
        .badge-warning .dot { background: var(--gold); }
        .badge-success { border-color: rgba(16, 124, 65, 0.25); color: var(--green); }
        .badge-success .dot { background: var(--green); }
        .badge-info { border-color: rgba(0, 120, 212, 0.25); color: var(--blue); }
        .badge-info .dot { background: var(--blue); }

        @media (prefers-color-scheme: dark) {
            .badge-warning { color: var(--gold); }
            .badge-success { color: #6fd394; }
            .badge-info { color: #7cc0f5; }
        }

        @media (max-width: 420px) {
            .body { padding: 24px; }
            .footer { padding: 12px 24px; }
        }
    </style>
</head>
<body>
    <main class="card" role="main">
        <div class="accent"></div>

        <div class="body">
            <div class="brand">
                <img src="/favicon/android-chrome-192x192.png" alt="">
                <div>
                    <div class="brand-name">Seguimiento</div>
                    <div class="brand-sub">Gestión de trámites</div>
                </div>
            </div>

            <div class="icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>

            <h1>No podemos mostrar la información en este momento</h1>

            <p>
                El sistema está teniendo un problema temporal para acceder a sus datos.
                Tu información está segura y no se ha perdido nada.
            </p>

            <p class="muted">
                Espera unos minutos y vuelve a intentarlo. Si el problema continúa,
                comunícate con el área de sistemas e indícale la hora en que ocurrió.
            </p>

            <div class="actions">
                <button type="button" class="button" onclick="window.location.reload()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-3-6.7"></path>
                        <polyline points="21 3 21 9 15 9"></polyline>
                    </svg>
                    Volver a intentar
                </button>
            </div>
        </div>

        <footer class="footer">
            <span>{{ config('app.name', 'Seguimiento de Trámites') }}</span>
            <span class="badge badge-{{ $variante }}">
                <span class="dot"></span>
                {{ $etiqueta }}
            </span>
        </footer>
    </main>
</body>
</html>
