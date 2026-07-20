#!/usr/bin/env python3
"""Take full-page screenshots using Chrome CDP."""
import subprocess, json, urllib.request, time, base64, sys, os

PORT = 9222
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
label = sys.argv[2] if len(sys.argv) > 2 else ""
OUT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

# Find next screenshot number
existing = [f for f in os.listdir(OUT_DIR) if f.startswith("screenshot-") and f.endswith(".png")]
nums = []
for f in existing:
    try: nums.append(int(f.split("-")[1]))
    except: pass
n = max(nums) + 1 if nums else 1
suffix = f"-{label}" if label else ""
out_path = os.path.join(OUT_DIR, f"screenshot-{n}{suffix}.png")

# Launch Chrome with remote debugging
chrome = subprocess.Popen([
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    f"--remote-debugging-port={PORT}",
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,900",
    URL
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

time.sleep(3)

try:
    # Get websocket URL
    resp = urllib.request.urlopen(f"http://localhost:{PORT}/json", timeout=5)
    tabs = json.loads(resp.read())
    ws_url = tabs[0]["webSocketDebuggerUrl"]

    import websocket  # type: ignore
    ws = websocket.create_connection(ws_url, timeout=10)

    def send(method, params=None):
        msg = json.dumps({"id": 1, "method": method, "params": params or {}})
        ws.send(msg)
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == 1:
                return r.get("result", {})

    # Enable page
    send("Page.enable")
    time.sleep(1)

    # Get full page dimensions
    dims = send("Runtime.evaluate", {
        "expression": "JSON.stringify({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})",
        "returnByValue": True
    })
    d = json.loads(dims["result"]["value"])
    w, h = d["w"], d["h"]
    print(f"Page size: {w}x{h}")

    # Set viewport to full page
    send("Emulation.setDeviceMetricsOverride", {
        "width": 1440, "height": h, "deviceScaleFactor": 1,
        "mobile": False, "screenWidth": 1440, "screenHeight": h
    })
    time.sleep(0.5)

    # Take screenshot
    result = send("Page.captureScreenshot", {"format": "png", "fromSurface": True, "captureBeyondViewport": True})
    data = base64.b64decode(result["data"])
    with open(out_path, "wb") as f:
        f.write(data)
    print(f"Saved: {out_path}")
    ws.close()
except Exception as e:
    print(f"CDP failed ({e}), falling back to --screenshot")
    chrome.kill()
    subprocess.run([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless=new", "--disable-gpu", "--no-sandbox",
        f"--screenshot={out_path}",
        "--window-size=1440,900", URL
    ], capture_output=True)
    print(f"Saved: {out_path}")
finally:
    chrome.kill()
