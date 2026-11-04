$ErrorActionPreference = 'Stop'
$paRoot = Split-Path -Parent $PSScriptRoot
$paTheme = Join-Path $paRoot 'wordpress/pratika-amollar-child'
$paVersion = [regex]::Match((Get-Content -LiteralPath (Join-Path $paTheme 'style.css') -Raw), '(?m)^Version:\s*([\d.]+)').Groups[1].Value
if (-not $paVersion) { throw 'Missing theme version' }
$paOutput = Join-Path $paRoot "wordpress/releases/pratika-amollar-child-$paVersion.zip"
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $paOutput) { Remove-Item -LiteralPath $paOutput }
$paZip = [System.IO.Compression.ZipFile]::Open($paOutput, 'Create')
try {
    Get-ChildItem -LiteralPath $paTheme -File -Recurse | Sort-Object FullName | ForEach-Object {
        $paRelative = [System.IO.Path]::GetRelativePath($paTheme, $_.FullName).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($paZip, $_.FullName, ('pratika-amollar-child/' + $paRelative), 'Optimal') | Out-Null
    }
} finally { $paZip.Dispose() }
$paZip = [System.IO.Compression.ZipFile]::OpenRead($paOutput)
try {
    $paRequired = @('style.css', 'functions.php', 'header.php', 'footer.php', 'inc/parent-contract.json', 'inc/compatibility.php', 'inc/config.php', 'inc/components.php', 'inc/chrome.php', 'adapters/header.php', 'adapters/footer.php', 'template-parts/header.php', 'template-parts/footer.php', 'assets/css/identity.css', 'assets/css/woocommerce.css', 'assets/js/navigation.js', 'assets/brand/logo-pratika-amollar.png', 'assets/fonts/manrope-variable.woff2', 'assets/fonts/dm-serif-display-regular.woff2', 'README.md')
    foreach ($paName in $paRequired) {
        if (-not $paZip.GetEntry('pratika-amollar-child/' + $paName)) { throw "Missing ZIP entry: $paName" }
    }
    foreach ($paEntry in $paZip.Entries) {
        if ($paEntry.FullName.Contains('..') -or $paEntry.FullName.Contains('\') -or -not $paEntry.FullName.StartsWith('pratika-amollar-child/')) { throw 'Unsafe ZIP path' }
        $paSource = Join-Path $paTheme $paEntry.FullName.Substring('pratika-amollar-child/'.Length)
        $paStream = $paEntry.Open()
        try {
            $paHash = [System.Security.Cryptography.SHA256]::Create()
            try { $paActual = [Convert]::ToHexString($paHash.ComputeHash($paStream)) } finally { $paHash.Dispose() }
        } finally { $paStream.Dispose() }
        if ($paActual -ne (Get-FileHash -LiteralPath $paSource -Algorithm SHA256).Hash) { throw "Corrupt ZIP entry: $($paEntry.FullName)" }
    }
    $paCount = $paZip.Entries.Count
} finally { $paZip.Dispose() }
$paChecksum = (Get-FileHash -LiteralPath $paOutput -Algorithm SHA256).Hash.ToLowerInvariant()
"$paChecksum  pratika-amollar-child-$paVersion.zip" | Set-Content -LiteralPath ($paOutput + '.sha256') -Encoding utf8
Write-Output "ZIP validado: $paCount arquivos; SHA-256 $paChecksum"
