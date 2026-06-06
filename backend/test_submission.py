import json
import urllib.request

def test():
    # Login as engineer
    login_data = json.dumps({'email': 'dummyengg@gmail.com', 'password': 'enggpass'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        print("Engg login:", response.status, res_data)
        
        if 'token' in res_data:
            token = res_data['token']
            submit_data = json.dumps({
                'date': '2026-06-07', 'plantId': 1, 'powerGenerated': 100, 
                'auxiliaryPower': 10, 'waterConsumption': 100, 'coalConsumption': 10, 
                'co2Emissions': 10, 'flyAsh': 10
            }).encode('utf-8')
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            }
            req2 = urllib.request.Request('http://127.0.0.1:5000/api/submissions', data=submit_data, headers=headers)
            try:
                with urllib.request.urlopen(req2) as response2:
                    print("Engg submit:", response2.status, json.loads(response2.read().decode('utf-8')))
            except urllib.error.HTTPError as e:
                print("Engg submit error:", e.code, e.read().decode('utf-8'))

test()
