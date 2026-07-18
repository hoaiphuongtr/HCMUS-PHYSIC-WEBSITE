<#
  find-legacy-dump.ps1 — locate the legacy MariaDB dump needed to migrate your
  real content (departments, categories, posts, users) into the new site.

  The migration (backend/initialScript/migrate-legacy/run.ts) expects the dump
  extracted to:
      backend/initialScript/migrate-legacy/dump/legacy.sql
  The original export is usually a file like phys_db_YYYYMMDD.sql.gz.

  Run:  powershell -ExecutionPolicy Bypass -File deploy\find-legacy-dump.ps1
#>

$ErrorActionPreference = 'SilentlyContinue'
$RepoRoot = Split-Path $PSScriptRoot -Parent

# folders to search (add your own if the dump might be elsewhere)
$roots = @(
  "$env:USERPROFILE\Downloads",
  "$env:USERPROFILE\Desktop",
  "$env:USERPROFILE\Documents",
  $RepoRoot
) | Where-Object { Test-Path $_ } | Select-Object -Unique

# file-name patterns that signal a legacy DB dump
$patterns = @('legacy.sql', 'phys*sql*', '*phys_db*', 'dump.sql', '*.sql.gz')

Write-Host "Searching for the legacy DB dump in:" -ForegroundColor Cyan
$roots | ForEach-Object { Write-Host "  $_" }

$found = foreach ($root in $roots) {
  foreach ($pat in $patterns) {
    Get-ChildItem -Path $root -Filter $pat -Recurse -File -ErrorAction SilentlyContinue
  }
}
$found = $found | Sort-Object FullName -Unique

if ($found) {
  Write-Host "`nCandidate dump files:" -ForegroundColor Green
  $found |
    Select-Object @{n='Size_MB';e={[math]::Round($_.Length/1MB,1)}}, LastWriteTime, FullName |
    Sort-Object Size_MB -Descending |
    Format-Table -AutoSize
} else {
  Write-Host "`nNo legacy dump (.sql.gz / phys_db* / legacy.sql) found in those folders." -ForegroundColor Yellow
  Write-Host "You'll need the original phys_db_*.sql.gz export from the old faculty site." -ForegroundColor Yellow
}

# is the extracted dump already staged where the migration expects it?
$expected = Join-Path $RepoRoot 'backend\initialScript\migrate-legacy\dump\legacy.sql'
Write-Host "`nMigration expects the extracted SQL at:" -ForegroundColor Cyan
Write-Host "  $expected"
if (Test-Path $expected) {
  $mb = [math]::Round((Get-Item $expected).Length/1MB,1)
  Write-Host "  PRESENT ($mb MB) — ready to migrate." -ForegroundColor Green
} else {
  Write-Host "  MISSING — extract your phys_db_*.sql.gz to this path before migrating." -ForegroundColor Yellow
}
