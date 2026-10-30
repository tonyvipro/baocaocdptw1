$ErrorActionPreference = 'Stop'
$profilePath = Join-Path $env:TEMP ('bds-compare-' + [guid]::NewGuid())
$chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$browserProcess = Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--remote-debugging-port=9337', ('--user-data-dir=' + $profilePath), '--no-first-run', 'about:blank') -WindowStyle Hidden -PassThru
$socket = New-Object Net.WebSockets.ClientWebSocket
$script:messageId = 0
$script:browserErrors = @()
function Invoke-Cdp($method, $params = @{}) {
    $script:messageId++
    $id = $script:messageId
    $payload = @{ id=$id; method=$method; params=$params } | ConvertTo-Json -Depth 20 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
    $socket.SendAsync([ArraySegment[byte]]::new($bytes), [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
    do {
        $stream = New-Object IO.MemoryStream
        do {
            $buffer = New-Object byte[] 65536
            $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
            $stream.Write($buffer, 0, $received.Count)
        } while (!$received.EndOfMessage)
        $response = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
        if ($response.method -eq 'Runtime.exceptionThrown') {
            $script:browserErrors += $response.params.exceptionDetails.exception.description
            Write-Host $response.params.exceptionDetails.exception.description
        }
        $stream.Dispose()
    } while ($response.id -ne $id)
    if ($response.error) { throw ($response.error | ConvertTo-Json) }
    return $response.result
}
function Evaluate($expression) {
    $result = Invoke-Cdp 'Runtime.evaluate' @{ expression=$expression; returnByValue=$true; awaitPromise=$true }
    if ($result.exceptionDetails) { throw ($result.exceptionDetails | ConvertTo-Json -Depth 10) }
    return $result.result.value
}
try {
    for ($attempt=0; $attempt -lt 30; $attempt++) {
        try { $targets = Invoke-RestMethod 'http://localhost:9337/json/list'; break } catch { Start-Sleep -Milliseconds 300 }
    }
    $target = $targets | Where-Object type -eq 'page' | Select-Object -First 1
    $socket.ConnectAsync([uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
    Invoke-Cdp 'Runtime.enable' | Out-Null
    Invoke-Cdp 'Page.enable' | Out-Null
    Invoke-Cdp 'Page.navigate' @{url='http://localhost:3000'} | Out-Null
    $ready = Evaluate "(async()=>{for(let i=0;i<100;i++){if(document.querySelectorAll('button[title*=`"so sánh`"]').length>=2)return true;await new Promise(r=>setTimeout(r,500));}return false;})()"
    if (!$ready) {
        Write-Output (Evaluate 'document.body.innerText')
        Write-Output (Evaluate 'location.href')
        Write-Output (Evaluate "JSON.stringify([...document.querySelectorAll('button')].map(b=>b.title))")
        throw 'Property cards did not load.'
    }
    Evaluate "(()=>{const buttons=document.querySelectorAll('button[title*=`"so sánh`"]');buttons[0].click();buttons[1].click();return true;})()" | Out-Null
    Evaluate 'new Promise(r=>setTimeout(()=>r(true),500))' | Out-Null
    foreach ($width in @(390, 820, 1365)) {
        Invoke-Cdp 'Emulation.setDeviceMetricsOverride' @{width=$width;height=900;deviceScaleFactor=1;mobile=$false} | Out-Null
        $valid = Evaluate "(()=>{const panel=document.querySelector('#compare-drawer');return !!panel?.querySelector('table')&&panel.querySelectorAll('thead th').length===3&&panel.getBoundingClientRect().width<=innerWidth;})()"
        if (!$valid) { throw "Comparison layout failed at width $width" }
        $shot = Invoke-Cdp 'Page.captureScreenshot' @{format='png'}
        [IO.File]::WriteAllBytes((Join-Path $PSScriptRoot "compare-$width.png"), [Convert]::FromBase64String($shot.data))
    }
    $toggle = Evaluate "(()=>{const p=document.querySelector('#compare-drawer');p.querySelector('input[type=checkbox]').click();return true;})()"
    Evaluate 'new Promise(r=>setTimeout(()=>r(true),200))' | Out-Null
    $filtered = Evaluate "(()=>{const p=document.querySelector('#compare-drawer');return [...p.querySelectorAll('tbody tr')].every(tr=>new Set([...tr.querySelectorAll('td')].map(td=>td.innerText)).size>1);})()"
    if (!$filtered) { throw 'Differences filter failed' }
    Evaluate "document.querySelector('#compare-drawer button[aria-expanded]').click()" | Out-Null
    Evaluate 'new Promise(r=>setTimeout(()=>r(true),200))' | Out-Null
    if (!(Evaluate "!document.querySelector('#comparison-content')")) { throw 'Collapse failed' }
    if ($script:browserErrors.Count) { throw ($script:browserErrors -join "`n") }
    Write-Output 'PASS: comparison renders at 390, 820, 1365 px; differences filter and collapse work; no runtime exceptions.'
} finally {
    if ($socket.State -eq [Net.WebSockets.WebSocketState]::Open) {
        try { Invoke-Cdp 'Browser.close' | Out-Null } catch {}
    }
    $socket.Dispose()
}
