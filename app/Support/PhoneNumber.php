<?php

namespace App\Support;

final class PhoneNumber
{
    public const PATTERN = '/^\+8801[3-9]\d{8}$/';

    public static function normalize(?string $phone): string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        if (str_starts_with($digits, '880')) {
            $digits = substr($digits, 3);
        } elseif (str_starts_with($digits, '88')) {
            $digits = substr($digits, 2);
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '1')) {
            $digits = '0' . $digits;
        }

        return strlen($digits) === 11 ? '+88' . $digits : $digits;
    }

    public static function isValid(?string $phone): bool
    {
        return (bool) preg_match(self::PATTERN, self::normalize($phone));
    }

    public static function variants(?string $phone): array
    {
        $canonical = self::normalize($phone);
        $local = str_starts_with($canonical, '+88') ? substr($canonical, 3) : $canonical;

        return array_values(array_unique([$canonical, $local, '88' . $local]));
    }
}
