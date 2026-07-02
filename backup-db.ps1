# backup-db.ps1
# Set source path to db_shared.json
$Source = Join-Path $PSScriptRoot "db_shared.json"

# Read backup destination from config or use a default path inside user profile (e.g. Google Drive/Dropbox)
$BackupDir = Join-Path $Home "Google Drive\My Drive\POS_Backups"
if (-not (Test-Path $BackupDir)) {
    $BackupDir = Join-Path $Home "Dropbox\POS_Backups"
}
if (-not (Test-Path $BackupDir)) {
    $BackupDir = Join-Path $PSScriptRoot "backups"
}

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

if (Test-Path $Source) {
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Destination = Join-Path $BackupDir "db_shared-$Timestamp.json"
    Copy-Item -Path $Source -Destination $Destination -Force
    Write-Host "Backup successful: $Destination"
} else {
    Write-Warning "Source file db_shared.json not found!"
}
