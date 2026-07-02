Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipItems = Get-ChildItem "c:\Users\sutha\OneDrive\Desktop\*.zip"
foreach ($zipItem in $zipItems) {
    Write-Host "Searching ZIP: $($zipItem.FullName)"
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($zipItem.FullName)
        foreach ($entry in $zip.Entries) {
            if ($entry.FullName.EndsWith("POS.jsx") -or $entry.FullName.Contains("POS.jsx")) {
                Write-Host "  -> MATCH FOUND: $($entry.FullName)"
            }
        }
        $zip.Dispose()
    } catch {
        Write-Host "  Error: $_"
    }
}
