Set-Location $PSScriptRoot
$logPath = Join-Path $PSScriptRoot "backend-run.log"
"[$(Get-Date -Format s)] starting backend" | Out-File -FilePath $logPath -Append -Encoding utf8
& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 2>&1 | Tee-Object -FilePath $logPath -Append
