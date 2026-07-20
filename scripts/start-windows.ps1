# Build and start the Prelegal container. Backend + frontend at http://localhost:8000
$ErrorActionPreference = "Stop"

$Image = "prelegal:latest"
$Container = "prelegal"
$Root = Split-Path -Parent $PSScriptRoot

# The AI chat needs an OpenAI key. Prefer the environment, else read the
# project-root .env. The key is passed at runtime, never baked into the image.
$OpenAiKey = $env:OPENAI_API_KEY
$EnvFile = Join-Path $Root ".env"
if (-not $OpenAiKey -and (Test-Path $EnvFile)) {
    $line = Select-String -Path $EnvFile -Pattern '^\s*openai_api_key\s*=' | Select-Object -First 1
    if ($line) { $OpenAiKey = ($line.Line -split '=', 2)[1].Trim().Trim('"').Trim("'") }
}
if (-not $OpenAiKey) { Write-Host "Warning: no OpenAI key found; the AI chat will not work." }

docker build -t $Image $Root
docker rm -f $Container 2>$null | Out-Null
docker run -d --name $Container -p 8000:8000 -e OPENAI_API_KEY=$OpenAiKey $Image

Write-Host "Prelegal is running at http://localhost:8000"
