Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipItems = Get-ChildItem "c:\Users\sutha\OneDrive\Desktop\*.zip"
foreach ($zipItem in $zipItems) {
    Write-Host "Checking ZIP: $($zipItem.FullName)"
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($zipItem.FullName)
        $entry = $zip.Entries | Where-Object { $_.FullName -like "*POS.jsx" -or $_.Name.Equals("POS.jsx", [System.StringComparison]::OrdinalIgnoreCase) }
        if ($entry) {
            Write-Host "Found entry: $($entry.FullName) inside $($zipItem.Name)"
            $targetPath = "c:\Users\sutha\OneDrive\Desktop\kp pakse pos\src\components\POS.jsx"
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $targetPath, $true)
            Write-Host "Extracted successfully to $targetPath"
            $zip.Dispose()
            break
        }
        $zip.Dispose()
    } catch {
        Write-Host "Error reading ZIP: $_"
    }
}
