$b = [System.IO.File]::ReadAllBytes("src\components\Debts.jsx")
Write-Output "Total bytes: $($b.Length)"
Write-Output "First 4 bytes: $($b[0]) $($b[1]) $($b[2]) $($b[3])"
# Check for non-UTF8 sequences
$hasInvalid = $false
for ($i = 0; $i -lt $b.Length; $i++) {
    if ($b[$i] -eq 0) {
        Write-Output "NULL byte found at position $i"
        $hasInvalid = $true
        break
    }
}
if (-not $hasInvalid) {
    Write-Output "No NULL bytes found"
}
# Try to detect BOM
if ($b[0] -eq 0xFF -and $b[1] -eq 0xFE) {
    Write-Output "BOM: UTF-16 LE detected!"
} elseif ($b[0] -eq 0xFE -and $b[1] -eq 0xFF) {
    Write-Output "BOM: UTF-16 BE detected!"
} elseif ($b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF) {
    Write-Output "BOM: UTF-8 BOM detected"
} else {
    Write-Output "No BOM detected (raw UTF-8 or other)"
}
