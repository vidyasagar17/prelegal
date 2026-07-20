# Build and start the Prelegal container. Backend + frontend at http://localhost:8000
$ErrorActionPreference = "Stop"

$Image = "prelegal:latest"
$Container = "prelegal"
$Root = Split-Path -Parent $PSScriptRoot

docker build -t $Image $Root
docker rm -f $Container 2>$null | Out-Null
docker run -d --name $Container -p 8000:8000 $Image

Write-Host "Prelegal is running at http://localhost:8000"
