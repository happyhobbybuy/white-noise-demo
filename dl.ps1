$soundDir = "c:\Users\Administrator\Desktop\baizaoyin\shengyin"
New-Item -ItemType Directory -Force -Path $soundDir | Out-Null

# Step 1: Delete all existing files
Get-ChildItem $soundDir -Filter "*.mp3" | ForEach-Object {
    Remove-Item $_.FullName -Force
}

$sounds = @(
    @("scene_01", "https://assets.mixkit.co/active_storage/sfx/2402/2402-preview.mp3"),
    @("scene_02", "https://assets.mixkit.co/active_storage/sfx/2406/2406-preview.mp3"),
    @("scene_03", "https://assets.mixkit.co/active_storage/sfx/2401/2401-preview.mp3"),
    @("scene_04", "https://assets.mixkit.co/active_storage/sfx/2437/2437-preview.mp3"),
    @("scene_05", "https://assets.mixkit.co/active_storage/sfx/2400/2400-preview.mp3"),
    @("scene_06", "https://assets.mixkit.co/active_storage/sfx/2414/2414-preview.mp3"),
    @("scene_07", "https://assets.mixkit.co/active_storage/sfx/2658/2658-preview.mp3"),
    @("scene_08", "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3"),
    @("scene_09", "https://assets.mixkit.co/active_storage/sfx/2431/2431-preview.mp3"),
    @("scene_10", "https://assets.mixkit.co/active_storage/sfx/2451/2451-preview.mp3"),
    @("scene_11", "https://assets.mixkit.co/active_storage/sfx/2407/2407-preview.mp3"),
    @("scene_12", "https://assets.mixkit.co/active_storage/sfx/2392/2392-preview.mp3"),
    @("scene_13", "https://assets.mixkit.co/active_storage/sfx/2396/2396-preview.mp3")
)

$ok = 0
foreach ($item in $sounds) {
    $name = $item[0]
    $url = $item[1]
    $fp = Join-Path $soundDir "$name.mp3"
    try {
        Invoke-WebRequest -Uri $url -OutFile $fp -TimeoutSec 20 -ErrorAction Stop
        $sz = (Get-Item $fp).Length
        if ($sz -gt 2000) {
            Write-Host "[OK] $name => $sz bytes"
            $ok++
        } else {
            Remove-Item $fp -Force -ErrorAction SilentlyContinue
            Write-Host "[SKIP] $name too small"
        }
    } catch {
        Write-Host "[FAIL] $name"
    }
}

Write-Host "Downloaded: $ok files"
