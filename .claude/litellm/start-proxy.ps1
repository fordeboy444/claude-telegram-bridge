$ErrorActionPreference = 'Stop'

$Root    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Dir     = Join-Path (Join-Path $Root '.claude') 'litellm'
$Config  = Join-Path $Dir 'config.yaml'
$LogFile = Join-Path $Dir 'litellm.out.log'
$ErrFile = Join-Path $Dir 'litellm.err.log'
$PidFile = Join-Path $Dir 'litellm.pid'
$Health  = 'http://127.0.0.1:4000/health/liveness'
$WaitSec = 25

function Test-ProxyUp {
    try {
        $resp = Invoke-WebRequest -Uri $Health -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        return ($resp.StatusCode -eq 200)
    } catch { return $false }
}

if (Test-ProxyUp) {
    Write-Output 'LiteLLM proxy already running at 127.0.0.1:4000'
    exit 0
}

# Port held but /health/liveness not answering: don't pile a second litellm onto a bad port.
$held = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue
if ($held) {
    $pids = ($held | Select-Object -ExpandProperty OwningProcess -Unique) -join ','
    [Console]::Error.WriteLine("Port 4000 LISTENing (pid $pids) but /health/liveness silent. Not starting LiteLLM. Inspect: Get-Process -Id $pids")
    exit 4
}

if (-not (Test-Path -LiteralPath $Config -PathType Leaf)) {
    [Console]::Error.WriteLine("LiteLLM config not found: $Config")
    exit 5
}

# Resolve litellm.exe: PATH first, then the known pip-user install location.
$exe = $null
$cmd = Get-Command litellm.exe -ErrorAction SilentlyContinue
if ($cmd) { $exe = $cmd.Source }
if (-not $exe) {
    $known = Join-Path $env:APPDATA 'Python\Python313\Scripts\litellm.exe'
    if (Test-Path -LiteralPath $known -PathType Leaf) { $exe = $known }
}
if (-not $exe) {
    [Console]::Error.WriteLine('litellm.exe not found on PATH or %APPDATA%\Python\Python313\Scripts\. Install: pip install --user litellm')
    exit 2
}

# Cold-start lever: skip building the model cost map at boot (children inherit env).
$env:LITELLM_LOCAL_MODEL_COST_MAP = 'True'
# LiteLLM prints Unicode during startup; redirected PowerShell streams default to
# the Windows code page and otherwise crash the child before it binds port 4000.
$env:PYTHONUTF8 = '1'
$env:PYTHONIOENCODING = 'utf-8'

# NOTE: -RedirectStandardOutput/Error cannot combine with -WindowStyle Hidden in PS 5.1;
# with redirects the child is windowless anyway (UseShellExecute=$false).
$p = Start-Process -FilePath $exe `
        -ArgumentList @('--config', $Config, '--host', '127.0.0.1', '--port', '4000') `
        -WorkingDirectory $Dir `
        -RedirectStandardOutput $LogFile `
        -RedirectStandardError $ErrFile `
        -PassThru

Set-Content -LiteralPath $PidFile -Value $p.Id -Encoding ascii

$deadline = (Get-Date).AddSeconds($WaitSec)
while ((Get-Date) -lt $deadline) {
    if (Test-ProxyUp) {
        Write-Output "LiteLLM proxy started (pid $($p.Id), logs: $LogFile / $ErrFile)"
        exit 0
    }
    if ($p.HasExited) {
        [Console]::Error.WriteLine("litellm exited during startup (exit $($p.ExitCode)). See $ErrFile")
        exit 2
    }
    Start-Sleep -Milliseconds 500
}
[Console]::Error.WriteLine("LiteLLM not ready after $WaitSec s (pid $($p.Id) still starting). It may finish on its own; check $ErrFile. Next session start will find it up.")
exit 3
