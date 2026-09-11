<?php

namespace App\Services;

class QrCodeService
{
    private static array $exp = [];

    private static array $log = [];

    private static bool $initialized = false;

    private static function initGf(): void
    {
        if (self::$initialized) {
            return;
        }

        self::$exp = array_fill(0, 512, 0);
        self::$log = array_fill(0, 256, 0);

        $x = 1;
        for ($i = 0; $i < 255; $i++) {
            self::$exp[$i] = $x;
            self::$log[$x] = $i;
            $x <<= 1;
            if ($x & 0x100) {
                $x ^= 0x11D;
            }
        }
        for ($i = 255; $i < 512; $i++) {
            self::$exp[$i] = self::$exp[$i - 255];
        }

        self::$initialized = true;
    }

    private static function gfMul(int $x, int $y): int
    {
        if ($x === 0 || $y === 0) {
            return 0;
        }

        return self::$exp[self::$log[$x] + self::$log[$y]];
    }

    private static function rsPoly(int $eccCount): array
    {
        $poly = [1];
        for ($i = 0; $i < $eccCount; $i++) {
            $next = [1];
            $factor = self::$exp[$i];
            $temp = [];
            foreach ($poly as $c) {
                $temp[] = self::gfMul($c, $factor);
            }
            $temp[] = 0;
            $res = [0];
            foreach ($poly as $c) {
                $res[] = $c;
            }
            $len = max(count($temp), count($res));
            $temp = array_pad($temp, -$len, 0);
            $res = array_pad($res, -$len, 0);
            $poly = [];
            for ($j = 0; $j < $len; $j++) {
                $poly[] = $temp[$j] ^ $res[$j];
            }
            while (count($poly) > 1 && $poly[0] === 0) {
                array_shift($poly);
            }
        }

        return $poly;
    }

    private static function rsEncode(array $data, int $eccCount): array
    {
        $poly = self::rsPoly($eccCount);
        $remainder = array_fill(0, $eccCount, 0);

        foreach ($data as $byte) {
            $factor = $byte ^ $remainder[0];
            array_shift($remainder);
            $remainder[] = 0;
            for ($i = 0; $i < $eccCount; $i++) {
                $remainder[$i] ^= self::gfMul($poly[$i + 1] ?? 0, $factor);
            }
        }

        return $remainder;
    }

    public static function generateSvg(string $text, int $size = 200): string
    {
        self::initGf();

        $rawBytes = array_values(unpack('C*', $text));
        $len = count($rawBytes);

        if ($len <= 78) {
            $version = 4;
            $matrixSize = 33;
            $dataCap = 80;
            $eccPerBlock = 18;
            $blocks = 2;
            $alignPos = [6, 26];
        } else {
            $version = 6;
            $matrixSize = 41;
            $dataCap = 136;
            $eccPerBlock = 28;
            $blocks = 2;
            $alignPos = [6, 34];
        }

        $bits = [];
        $bits = array_merge($bits, [0, 1, 0, 0]);
        for ($i = 7; $i >= 0; $i--) {
            $bits[] = ($len >> $i) & 1;
        }
        foreach ($rawBytes as $b) {
            for ($i = 7; $i >= 0; $i--) {
                $bits[] = ($b >> $i) & 1;
            }
        }
        $remBits = ($dataCap * 8) - count($bits);
        $termLen = min(4, max(0, $remBits));
        for ($i = 0; $i < $termLen; $i++) {
            $bits[] = 0;
        }
        while (count($bits) % 8 !== 0) {
            $bits[] = 0;
        }
        $padBytes = [0xEC, 0x11];
        $padIdx = 0;
        while (count($bits) < $dataCap * 8) {
            $b = $padBytes[$padIdx % 2];
            for ($i = 7; $i >= 0; $i--) {
                $bits[] = ($b >> $i) & 1;
            }
            $padIdx++;
        }

        $bytes = [];
        for ($i = 0; $i < count($bits); $i += 8) {
            $val = 0;
            for ($j = 0; $j < 8; $j++) {
                $val = ($val << 1) | $bits[$i + $j];
            }
            $bytes[] = $val;
        }

        $blockDataLen = (int) ($dataCap / $blocks);
        $dataBlocks = [];
        $eccBlocks = [];
        for ($b = 0; $b < $blocks; $b++) {
            $d = array_slice($bytes, $b * $blockDataLen, $blockDataLen);
            $dataBlocks[] = $d;
            $eccBlocks[] = self::rsEncode($d, $eccPerBlock);
        }

        $finalBytes = [];
        for ($i = 0; $i < $blockDataLen; $i++) {
            for ($b = 0; $b < $blocks; $b++) {
                $finalBytes[] = $dataBlocks[$b][$i];
            }
        }
        for ($i = 0; $i < $eccPerBlock; $i++) {
            for ($b = 0; $b < $blocks; $b++) {
                $finalBytes[] = $eccBlocks[$b][$i];
            }
        }

        $finalBits = [];
        foreach ($finalBytes as $b) {
            for ($i = 7; $i >= 0; $i--) {
                $finalBits[] = ($b >> $i) & 1;
            }
        }

        $matrix = array_fill(0, $matrixSize, array_fill(0, $matrixSize, null));
        $reserved = array_fill(0, $matrixSize, array_fill(0, $matrixSize, false));

        $finders = [[0, 0], [$matrixSize - 7, 0], [0, $matrixSize - 7]];
        foreach ($finders as [$r, $c]) {
            for ($dr = 0; $dr < 7; $dr++) {
                for ($dc = 0; $dc < 7; $dc++) {
                    $val = ($dr === 0 || $dr === 6 || $dc === 0 || $dc === 6 || ($dr >= 2 && $dr <= 4 && $dc >= 2 && $dc <= 4)) ? 1 : 0;
                    $matrix[$r + $dr][$c + $dc] = $val;
                    $reserved[$r + $dr][$c + $dc] = true;
                }
            }
        }

        $sepFinder = [
            [0, 7, 8, 1], [7, 0, 1, 8],
            [$matrixSize - 8, 0, 1, 8], [$matrixSize - 8, 7, 8, 1],
            [0, $matrixSize - 8, 8, 1], [7, $matrixSize - 8, 1, 8],
        ];
        for ($r = 0; $r < $matrixSize; $r++) {
            for ($c = 0; $c < $matrixSize; $c++) {
                if (($r < 8 && ($c === 7 || $c === $matrixSize - 8)) ||
                    ($r === 7 && ($c < 8 || $c >= $matrixSize - 8)) ||
                    ($r === $matrixSize - 8 && $c < 8) ||
                    ($r >= $matrixSize - 8 && $c === 7)) {
                    $matrix[$r][$c] = 0;
                    $reserved[$r][$c] = true;
                }
            }
        }

        foreach ($alignPos as $ar) {
            foreach ($alignPos as $ac) {
                if ($reserved[$ar][$ac]) {
                    continue;
                }
                for ($dr = -2; $dr <= 2; $dr++) {
                    for ($dc = -2; $dc <= 2; $dc++) {
                        $val = (abs($dr) === 2 || abs($dc) === 2 || ($dr === 0 && $dc === 0)) ? 1 : 0;
                        $matrix[$ar + $dr][$ac + $dc] = $val;
                        $reserved[$ar + $dr][$ac + $dc] = true;
                    }
                }
            }
        }

        for ($i = 8; $i < $matrixSize - 8; $i++) {
            $val = ($i % 2 === 0) ? 1 : 0;
            if (! $reserved[6][$i]) {
                $matrix[6][$i] = $val;
                $reserved[6][$i] = true;
            }
            if (! $reserved[$i][6]) {
                $matrix[$i][6] = $val;
                $reserved[$i][6] = true;
            }
        }

        $matrix[4 * $version + 9][8] = 1;
        $reserved[4 * $version + 9][8] = true;

        for ($i = 0; $i < 9; $i++) {
            $reserved[8][$i] = true;
            $reserved[$i][8] = true;
            $reserved[8][$matrixSize - 1 - $i] = true;
            $reserved[$matrixSize - 1 - $i][8] = true;
        }

        if ($version >= 7) {
            for ($i = 0; $i < 6; $i++) {
                for ($j = 0; $j < 3; $j++) {
                    $reserved[$matrixSize - 11 + $j][$i] = true;
                    $reserved[$i][$matrixSize - 11 + $j] = true;
                }
            }
        }

        $bitIdx = 0;
        $right = $matrixSize - 1;
        $up = true;

        while ($right > 0) {
            if ($right === 6) {
                $right--;
            }
            $cols = [$right, $right - 1];
            $rows = $up ? range($matrixSize - 1, 0) : range(0, $matrixSize - 1);

            foreach ($rows as $r) {
                foreach ($cols as $c) {
                    if (! $reserved[$r][$c]) {
                        $bit = $finalBits[$bitIdx] ?? 0;
                        $bitIdx++;
                        $masked = $bit ^ ((($r + $c) % 2 === 0) ? 1 : 0);
                        $matrix[$r][$c] = $masked;
                    }
                }
            }
            $up = ! $up;
            $right -= 2;
        }

        $fmtBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
        $matrix[8][0] = $fmtBits[0];
        $matrix[8][1] = $fmtBits[1];
        $matrix[8][2] = $fmtBits[2];
        $matrix[8][3] = $fmtBits[3];
        $matrix[8][4] = $fmtBits[4];
        $matrix[8][5] = $fmtBits[5];
        $matrix[8][7] = $fmtBits[6];
        $matrix[8][8] = $fmtBits[7];
        $matrix[7][8] = $fmtBits[8];
        $matrix[5][8] = $fmtBits[9];
        $matrix[4][8] = $fmtBits[10];
        $matrix[3][8] = $fmtBits[11];
        $matrix[2][8] = $fmtBits[12];
        $matrix[1][8] = $fmtBits[13];
        $matrix[0][8] = $fmtBits[14];

        for ($i = 0; $i < 7; $i++) {
            $matrix[$matrixSize - 1 - $i][8] = $fmtBits[$i];
        }
        for ($i = 0; $i < 8; $i++) {
            $matrix[8][$matrixSize - 8 + $i] = $fmtBits[7 + $i];
        }

        $quietZone = 4;
        $totalSize = $matrixSize + ($quietZone * 2);
        $path = '';

        for ($r = 0; $r < $matrixSize; $r++) {
            for ($c = 0; $c < $matrixSize; $c++) {
                if ($matrix[$r][$c] === 1) {
                    $x = $c + $quietZone;
                    $y = $r + $quietZone;
                    $path .= "M{$x},{$y}h1v1h-1z ";
                }
            }
        }

        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '.$totalSize.' '.$totalSize.'" width="'.$size.'" height="'.$size.'">'
            .'<rect width="100%" height="100%" fill="#ffffff"/>'
            .'<path d="'.trim($path).'" fill="#000000"/>'
            .'</svg>';
    }
}
