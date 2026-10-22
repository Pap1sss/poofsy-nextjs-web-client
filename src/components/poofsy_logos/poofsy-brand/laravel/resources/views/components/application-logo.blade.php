{{--
  Poofsy logo for Laravel-rendered views (Breeze/Jetstream use <x-application-logo />).
  Usage: <x-application-logo class="w-40" />            full logo
         <x-application-logo variant="icon" class="w-10" />  mascot only
--}}
@props(['variant' => 'full', 'alt' => 'Poofsy'])

@php
    $assets = [
        'full' => ['images/poofsy-logo.svg', 497, 359],
        'icon' => ['images/poofsy-icon.svg', 239, 239],
    ];
    [$src, $w, $h] = $assets[$variant] ?? $assets['full'];
@endphp

<img
    src="{{ asset($src) }}"
    width="{{ $w }}"
    height="{{ $h }}"
    alt="{{ $alt }}"
    {{ $attributes->merge(['style' => 'height:auto;max-width:100%']) }}
>
