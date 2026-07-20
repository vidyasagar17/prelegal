# Stop and remove the Prelegal container.
$ErrorActionPreference = "Stop"

$Container = "prelegal"

docker rm -f $Container 2>$null | Out-Null

Write-Host "Prelegal stopped."
