@echo off
echo Starting Cloudflare Tunnel in background...
start /B cloudflared.exe service install
start /B cloudflared.exe tunnel run
echo Tunnel service started. You can close this window.
timeout /t 5
