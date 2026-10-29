import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_endpoints():
    print("Testing /api/health...")
    req = urllib.request.urlopen('http://127.0.0.1:8000/api/health')
    health = json.loads(req.read().decode('utf-8'))
    print("Health response:", health)
    assert health['status'] == 'healthy'
    assert health['app'] == 'EcoTrack'

    print("\nTesting /api/assistant/chat (EN)...")
    data = json.dumps({'message': 'How can I save money on electricity?', 'language': 'en'}).encode('utf-8')
    post_req = urllib.request.Request('http://127.0.0.1:8000/api/assistant/chat', data=data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(post_req)
    reply_en = json.loads(resp.read().decode('utf-8'))
    print("AI Reply (EN):", reply_en['reply'][:150])

    print("\nTesting /api/assistant/chat (HI)...")
    data_hi = json.dumps({'message': 'बिजली बिल कैसे कम करें?', 'language': 'hi'}).encode('utf-8')
    post_req_hi = urllib.request.Request('http://127.0.0.1:8000/api/assistant/chat', data=data_hi, headers={'Content-Type': 'application/json'})
    resp_hi = urllib.request.urlopen(post_req_hi)
    reply_hi = json.loads(resp_hi.read().decode('utf-8'))
    print("AI Reply (HI):", reply_hi['reply'][:150])

    print("\nTesting /api/assistant/chat (KN)...")
    data_kn = json.dumps({'message': 'ಇಂಗಾಲ ಕಡಿಮೆ ಮಾಡುವುದು ಹೇಗೆ?', 'language': 'kn'}).encode('utf-8')
    post_req_kn = urllib.request.Request('http://127.0.0.1:8000/api/assistant/chat', data=data_kn, headers={'Content-Type': 'application/json'})
    resp_kn = urllib.request.urlopen(post_req_kn)
    reply_kn = json.loads(resp_kn.read().decode('utf-8'))
    print("AI Reply (KN):", reply_kn['reply'][:150])

    print("\nTesting /api/assistant/chat Default Greeting...")
    data_def = json.dumps({'message': 'hello who are you', 'language': 'en'}).encode('utf-8')
    post_req_def = urllib.request.Request('http://127.0.0.1:8000/api/assistant/chat', data=data_def, headers={'Content-Type': 'application/json'})
    resp_def = urllib.request.urlopen(post_req_def)
    reply_def = json.loads(resp_def.read().decode('utf-8'))
    print("AI Greeting:", reply_def['reply'][:150])

    print("\nTesting Vite Frontend on http://127.0.0.1:5173...")
    frontend_req = urllib.request.urlopen('http://127.0.0.1:5173')
    html = frontend_req.read().decode('utf-8')
    assert '<title>EcoTrack' in html
    print("Frontend Title verified in HTML: EcoTrack!")
    print("\nALL VERIFICATIONS PASSED!")

if __name__ == '__main__':
    test_endpoints()
