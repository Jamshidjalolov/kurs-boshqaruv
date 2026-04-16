Set-Location $PSScriptRoot
$logPath = Join-Path $PSScriptRoot "dev-local.log"
"[$(Get-Date -Format s)] starting dev-local" | Out-File -FilePath $logPath -Append -Encoding utf8

$postgres = Start-Process `
  -FilePath "C:\Program Files\PostgreSQL\18\bin\postgres.exe" `
  -ArgumentList @('-D', '.pgdata', '-p', '5433', '-h', '127.0.0.1') `
  -WorkingDirectory $PSScriptRoot `
  -PassThru

Start-Sleep -Seconds 3

try {
  & ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 2>&1 | Tee-Object -FilePath $logPath -Append
}
finally {
  if ($postgres -and -not $postgres.HasExited) {
    "[$(Get-Date -Format s)] stopping postgres pid=$($postgres.Id)" | Out-File -FilePath $logPath -Append -Encoding utf8
    Stop-Process -Id $postgres.Id -Force
  }
}
