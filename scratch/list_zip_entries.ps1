Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipItems = Get-ChildItem "c:\Users\sutha\OneDrive\Desktop\*.zip"
foreach ($zipItem in $zipItems) {
    if ($zipItem.Length -gt 1MB) {
        Write-Host "ZIP: $($zipItem.Name) ($($zipItem.Length) bytes)"
        try {
            $zip = [System.IO.Compression.ZipFile]::OpenRead($zipItem.FullName)
            $count = 0
            foreach ($entry in $zip.Entries) {
                if ($count -lt 15) {
                    Write-Host "  [$count] $($entry.FullName)"
                    $count++
                } else {
                    break
                }
            }
            $zip.Dispose()
        } catch {
            Write-Host "  Error: $_"
        }
        Write-Host "--------------------------------"
    }
}
