Add-Type -Assembly System.IO.Compression.FileSystem
$docxPath = "C:\Users\kunal\OneDrive\Desktop\Projects\vibecoded\Thermal Plant Monitoring and Fault Detection\Thermal_Plant_Monitoring_Platform_PRD_v1.1.docx"
$copyPath = "C:\Users\kunal\OneDrive\Desktop\Projects\vibecoded\Thermal Plant Monitoring and Fault Detection\prd_copy.docx"

# Copy the file first to avoid lock issues
Copy-Item $docxPath $copyPath -Force

$zip = [System.IO.Compression.ZipFile]::OpenRead($copyPath)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xml = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

[xml]$doc = $xml
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $doc.SelectNodes('//w:p', $ns)
$output = @()
foreach ($p in $paragraphs) {
    $texts = $p.SelectNodes('.//w:t', $ns)
    $line = ''
    foreach ($t in $texts) {
        $line += $t.InnerText
    }
    if ($line) {
        $output += $line
    }
}
$output -join "`n" | Out-File -FilePath "C:\Users\kunal\OneDrive\Desktop\Projects\vibecoded\Thermal Plant Monitoring and Fault Detection\prd_text.txt" -Encoding UTF8
Remove-Item $copyPath -Force
Write-Host "Extraction complete"
