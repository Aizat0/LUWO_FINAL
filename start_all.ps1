$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCommand = 'python'
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCommand = 'py'
} else {
    Write-Host 'Python was not found. Install Python and add it to PATH.' -ForegroundColor Red
    Read-Host 'Press Enter to exit'
    exit 1
}

$services = @(
    @{
        Title = 'LUWO Auth - 8001'
        Directory = Join-Path $projectRoot 'luwo_service1'
        Command = "$pythonCommand -m uvicorn main:auth_app --host 127.0.0.1 --port 8001"
    },
    @{
        Title = 'LUWO Education - 8002'
        Directory = Join-Path $projectRoot 'luwo_service2\mysite'
        Command = "$pythonCommand manage.py runserver 127.0.0.1:8002"
    },
    @{
        Title = 'LUWO Assignments - 8003'
        Directory = Join-Path $projectRoot 'luwo_service3'
        Command = "$pythonCommand -m uvicorn main:luwo_app --host 127.0.0.1 --port 8003"
    },
    @{
        Title = 'LUWO Frontend - 5173'
        Directory = Join-Path $projectRoot 'frontend'
        Command = "$pythonCommand server.py"
    }
)

foreach ($service in $services) {
    if (-not (Test-Path -LiteralPath $service.Directory)) {
        throw "Directory not found: $($service.Directory)"
    }

    $windowCommand = @"
`$Host.UI.RawUI.WindowTitle = '$($service.Title)'
Set-Location -LiteralPath '$($service.Directory)'
Write-Host '$($service.Title)' -ForegroundColor Magenta
Write-Host 'Press Ctrl+C to stop this service' -ForegroundColor DarkGray
$($service.Command)
if (`$LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host 'The service stopped with an error. This window will stay open.' -ForegroundColor Red
    Read-Host 'Press Enter to close'
}
"@

    Start-Process powershell.exe -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy', 'Bypass',
        '-Command', $windowCommand
    )
    Start-Sleep -Milliseconds 700
}

Write-Host 'All services were started in separate windows.' -ForegroundColor Green
Write-Host 'Website: http://127.0.0.1:5173' -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process 'http://127.0.0.1:5173'
