# Test script for analyze-resume endpoint with a PDF file
$uri = "http://localhost:3001/api/analyze-resume"

# Create a simple PDF content (this is a minimal PDF structure)
$pdfContent = @"
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test Resume Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF
"@

try {
    # Convert string to bytes
    $pdfBytes = [System.Text.Encoding]::UTF8.GetBytes($pdfContent)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    # Create multipart form data
    $LF = "`r`n"
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"resume`"; filename=`"test-resume.pdf`"",
        "Content-Type: application/pdf",
        "",
        [System.Text.Encoding]::UTF8.GetString($pdfBytes),
        "--$boundary--"
    )
    $body = $bodyLines -join $LF
    
    Write-Host "Sending PDF request to: $uri"
    Write-Host "Body length: $($body.Length)"
    
    $response = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType "multipart/form-data; boundary=$boundary"
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}