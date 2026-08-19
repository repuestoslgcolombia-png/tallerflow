$body = @{
    messages = @(
        @{
            role = "user"
            content = "registra un cliente rápido con nombre Juan, apellido Pérez, teléfono 3214567890"
        }
    )
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/assistant/chat" `
      -Method POST `
      -Headers @{"Content-Type"="application/json"} `
      -Body $body `
      -TimeoutSec 30
    
    Write-Host "✅ Status: $($response.StatusCode)"
    Write-Host "Response (first 2000 chars):" 
    $response.Content.Substring(0, [Math]::Min(2000, $response.Content.Length))
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Response content:"
        [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd()
    }
}
