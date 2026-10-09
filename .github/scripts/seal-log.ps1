$ErrorActionPreference = 'Stop'
$logPath = Join-Path $env:RUNNER_TEMP 'akscreen-build.log'
if (!(Test-Path -LiteralPath $logPath)) { return }
Add-Type -AssemblyName System.Security.Cryptography.Pkcs
$certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPem([IO.File]::ReadAllText((Join-Path $PSScriptRoot '../build-diagnostics.crt')))
$content = [System.Security.Cryptography.Pkcs.ContentInfo]::new([IO.File]::ReadAllBytes($logPath))
$algorithm = [System.Security.Cryptography.Pkcs.AlgorithmIdentifier]::new([System.Security.Cryptography.Oid]::new('2.16.840.1.101.3.4.1.42'))
$envelope = [System.Security.Cryptography.Pkcs.EnvelopedCms]::new($content, $algorithm)
$envelope.Encrypt([System.Security.Cryptography.Pkcs.CmsRecipient]::new($certificate))
[IO.File]::WriteAllBytes((Join-Path $env:RUNNER_TEMP 'akscreen-build.p7m'), $envelope.Encode())
$certificate.Dispose()
Write-Output 'Diagnóstico cifrado; el registro original no se publica.'
