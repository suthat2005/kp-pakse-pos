$content = [System.IO.File]::ReadAllBytes("src\components\Debts.jsx")
$len = $content.Length
Write-Output "File size: $len bytes"
$invalid_positions = @()
$i = 0
while ($i -lt $len) {
    $b = $content[$i]
    if ($b -lt 0x80) {
        $i++
    } elseif (($b -band 0xE0) -eq 0xC0) {
        if (($i + 1) -ge $len -or ($content[$i+1] -band 0xC0) -ne 0x80) {
            $invalid_positions += $i
        }
        $i += 2
    } elseif (($b -band 0xF0) -eq 0xE0) {
        if (($i + 2) -ge $len -or ($content[$i+1] -band 0xC0) -ne 0x80 -or ($content[$i+2] -band 0xC0) -ne 0x80) {
            $invalid_positions += $i
        }
        $i += 3
    } elseif (($b -band 0xF8) -eq 0xF0) {
        if (($i + 3) -ge $len -or ($content[$i+1] -band 0xC0) -ne 0x80 -or ($content[$i+2] -band 0xC0) -ne 0x80 -or ($content[$i+3] -band 0xC0) -ne 0x80) {
            $invalid_positions += $i
        }
        $i += 4
    } else {
        $invalid_positions += $i
        $i++
    }
    if ($invalid_positions.Count -ge 5) { break }
}
if ($invalid_positions.Count -eq 0) {
    Write-Output "No invalid UTF-8 sequences found"
} else {
    Write-Output "Found $($invalid_positions.Count) invalid positions"
    foreach ($pos in $invalid_positions) {
        $start = [Math]::Max(0, $pos - 10)
        $end = [Math]::Min($len - 1, $pos + 10)
        $context = $content[$start..$end] -join ','
        Write-Output "Position $pos bytes: $context"
    }
}
