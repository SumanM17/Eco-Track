"""Local server runner and endpoint probe for CarbonKatha."""

import json
import os
import sys
import time
import urllib.error
import urllib.request
import subprocess

# Ensure UTF-8 console output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 72)
print("STARTING CARBONKATHA LOCAL SERVER")
print("=" * 72)

# Start uvicorn as a subprocess
python_exe = os.path.join(os.path.abspath(".venv"), "Scripts", "python.exe")
server_cmd = [python_exe, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"]

print(f"Launching server: {' '.join(server_cmd)}")
proc = subprocess.Popen(server_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

# Wait 3 seconds for server to bind
time.sleep(3)

try:
    # 1. Probe Root UI
    print("Testing GET http://127.0.0.1:8000/ ...")
    with urllib.request.urlopen("http://127.0.0.1:8000/") as resp:
        content = resp.read().decode("utf-8")
        assert resp.status == 200
        assert "CarbonKatha" in content
        print(f"  -> SUCCESS! HTTP {resp.status} - Green-Beach UI is live!")

    # 2. Probe System Status API
    print("Testing GET http://127.0.0.1:8000/api/system/status ...")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/system/status") as resp:
        status_data = json.loads(resp.read().decode("utf-8"))
        assert resp.status == 200
        print(f"  -> SUCCESS! AI Status: {status_data}")

    # 3. Probe NLP Parse API
    print("Testing POST http://127.0.0.1:8000/api/parse/ (Hindi sample) ...")
    req_body = json.dumps({"text": "मैंने एसी 4 घंटे चलाया और ऑटो से 6 किमी गया", "language": "hi"}).encode("utf-8")
    req = urllib.request.Request("http://127.0.0.1:8000/api/parse/", data=req_body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        parse_data = json.loads(resp.read().decode("utf-8"))
        assert resp.status == 200
        print(f"  -> SUCCESS! Parsed {len(parse_data['activities'])} activities using '{parse_data['parser']}' engine.")
        for act in parse_data["activities"]:
            print(f"     • {act['item']}: {act['value']} {act['unit']} ({act['category']})")

    # 4. Probe Database Corpus API
    print("Testing GET http://127.0.0.1:8000/api/voice/corpus ...")
    with urllib.request.urlopen("http://127.0.0.1:8000/api/voice/corpus") as resp:
        corpus = json.loads(resp.read().decode("utf-8"))
        print(f"  -> SUCCESS! Retrieved {len(corpus)} database training exemplars.")

    print("=" * 72)
    print("SERVER VERIFICATION COMPLETE: ALL SYSTEMS RUNNING AT http://localhost:8000")
    print("=" * 72)

finally:
    # Terminate probe process
    proc.terminate()
    try:
        proc.wait(timeout=2)
    except Exception:
        proc.kill()
