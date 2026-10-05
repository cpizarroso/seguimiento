<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'Seguimiento de Trámites') }}</title>
    <link rel="icon" type="image/x-icon" href="/favicon_io/favicon.ico">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png">
    <link rel="apple-touch-icon" href="/favicon_io/apple-touch-icon.png">
    <link rel="manifest" href="/favicon_io/site.webmanifest">
    <meta name="theme-color" content="#2D6A4F">
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="bg-patuju-white text-gray-900 antialiased">
    @inertia
</body>
</html>
