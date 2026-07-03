# Clean up garbled files first
$soundDir = "c:\Users\Administrator\Desktop\baizaoyin\shengyin"
Get-ChildItem $soundDir -Filter "*.mp3" | ForEach-Object {
    Remove-Item $_.FullName -Force
    Write-Host "Deleted: $($_.Name)"
}
Write-Host "Cleaned up."

