Param(
  [string]$Message = "Hello",
  [switch]$Prod,
  [string]$BaseUrl = $env:N8N_BASE_URL
)

if (-not $BaseUrl -or $BaseUrl -eq "") { $BaseUrl = "http://localhost:5678" }

$path = if ($Prod) { "/webhook/my-webhook" } else { "/webhook-test/my-webhook" }
$url  = "$BaseUrl$path"

Write-Host "POST $url" -ForegroundColor Cyan
$body = @{ message = $Message } | ConvertTo-Json -Compress

try {
  $res = Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body $body
  $res | ConvertTo-Json -Depth 6
}
catch {
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.ReadToEnd()
  } else {
    $_.Exception.Message
  }
  exit 1
}


