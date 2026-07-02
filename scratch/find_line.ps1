$content = [System.IO.File]::ReadAllText("src\components\Debts.jsx", [System.Text.Encoding]::GetEncoding(28591))
$lines = $content.Split("`n")
$bytePos = 0
for ($lineNum = 0; $lineNum -lt $lines.Count; $lineNum++) {
    $lineBytes = [System.Text.Encoding]::GetEncoding(28591).GetByteCount($lines[$lineNum]) + 1
    if ($bytePos + $lineBytes -gt 10562) {
        $offsetInLine = 10562 - $bytePos
        Write-Output "Invalid byte is on line $($lineNum + 1), offset $offsetInLine"
        Write-Output "Line content (raw): $($lines[$lineNum])"
        # Show surrounding lines
        $startL = [Math]::Max(0, $lineNum - 2)
        $endL = [Math]::Min($lines.Count - 1, $lineNum + 2)
        for ($j = $startL; $j -le $endL; $j++) {
            Write-Output "LINE $($j+1): $($lines[$j])"
        }
        break
    }
    $bytePos += $lineBytes
}
