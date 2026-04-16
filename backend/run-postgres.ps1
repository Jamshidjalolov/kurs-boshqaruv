Set-Location $PSScriptRoot
$logPath = Join-Path $PSScriptRoot ".pgdata\postgres-run.log"
"[$(Get-Date -Format s)] starting postgres" | Out-File -FilePath $logPath -Append -Encoding utf8
& "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D ".pgdata" -p 5433 -h 127.0.0.1 2>&1 | Tee-Object -FilePath $logPath -Append
