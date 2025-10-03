# Test script for analyze-resume endpoint
$uri = "http://localhost:3001/api/analyze-resume"
$filePath = "test-resume.txt"

try {
    # Read file as bytes
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    # Create multipart form data properly
    $LF = "`r`n"
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test-resume.txt`"",
        "Content-Type: text/plain",
        "",
        [System.Text.Encoding]::UTF8.GetString($fileBytes),
        "--$boundary--"
    )
    $body = $bodyLines -join $LF
    
    Write-Host "Sending request to: $uri"
    Write-Host "Body length: $($body.Length)"
    
    $response = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType "multipart/form-data; boundary=$boundary" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch [System.Net.WebException] {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response Body:"
    if ($_.Exception.Response) {
        $responseStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseStream)
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody
        $reader.Close()
        $responseStream.Close()
    }
} catch {
    Write-Host "Other Error: $($_.Exception.Message)"
    Write-Host "Error Details: $($_.Exception)"
}