Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipItems = Get-ChildItem "c:\Users\sutha\OneDrive\Desktop\*.zip"
foreach ($zipItem in $zipItems) {
    if ($zipItem.Name -like "*2026*" -or $zipItem.Name -like "*ใช้งาน*") {
        Write-Host "Searching inside ZIP: $($zipItem.Name)"
        try {
            $zip = [System.IO.Compression.ZipFile]::OpenRead($zipItem.FullName)
            $entries = $zip.Entries | Where-Object { $_.FullName -like "*pos*" -or $_.FullName -like "*POS*" }
            foreach ($e in $entries) {
                Write-Host "  Found entry: $($e.FullName)"
            }
            $zip.Dispose()
        } catch {
            Write-Host "  Error reading ZIP: $_"
        }
    }
}
