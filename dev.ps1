$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPython = Join-Path $projectRoot "venv\Scripts\python.exe"
$frontendRoot = Join-Path $projectRoot "frontend"

if (-not (Test-Path -LiteralPath $backendPython)) {
    Write-Error "Ambiente virtual nao encontrado em: $backendPython"
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendRoot "node_modules"))) {
    Write-Error "Dependencias do frontend nao encontradas. Execute 'npm install' dentro da pasta frontend."
    exit 1
}

Write-Host "Iniciando MovieMatch..." -ForegroundColor Cyan
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor DarkGray
Write-Host "Frontend: http://localhost:5173" -ForegroundColor DarkGray
Write-Host "Use Ctrl+C para encerrar os dois servidores.`n" -ForegroundColor Yellow

$backend = $null
$frontend = $null

try {
    $backend = Start-Process `
        -FilePath $backendPython `
        -ArgumentList "-u", "manage.py", "runserver" `
        -WorkingDirectory $projectRoot `
        -NoNewWindow `
        -PassThru

    $frontend = Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList "run", "dev" `
        -WorkingDirectory $frontendRoot `
        -NoNewWindow `
        -PassThru

    while (-not $backend.HasExited -and -not $frontend.HasExited) {
        Start-Sleep -Milliseconds 500
    }

    if ($backend.HasExited) {
        Write-Warning "O backend foi encerrado (codigo $($backend.ExitCode))."
    }
    if ($frontend.HasExited) {
        Write-Warning "O frontend foi encerrado (codigo $($frontend.ExitCode))."
    }
}
finally {
    Write-Host "`nEncerrando servidores..." -ForegroundColor Yellow

    foreach ($server in @($backend, $frontend)) {
        if ($null -ne $server -and -not $server.HasExited) {
            & taskkill.exe /PID $server.Id /T /F 2>$null | Out-Null
        }
    }
}
