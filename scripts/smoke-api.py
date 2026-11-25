"""Pruebas reales contra Docker/MySQL. Crea datos identificados como QA; no usa Internet."""
import concurrent.futures
import http.cookiejar
import json
from pathlib import Path
import secrets
import urllib.error
import urllib.request

env = dict(line.split('=', 1) for line in Path('.env').read_text().splitlines() if '=' in line and not line.startswith('#'))
base = 'http://localhost:8080/api/v1'
checks = []
class Client:
    def __init__(self):
        self.token = None
        self.cookies = http.cookiejar.CookieJar()
        self.http = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
    def call(self, method, path, body=None, expected=200, csrf=True):
        headers = {'Content-Type': 'application/json'}
        if csrf: headers['X-Requested-With'] = 'SkinMarket'
        if self.token: headers['Authorization'] = 'Bearer ' + self.token
        request = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, method=method, headers=headers)
        try: response = self.http.open(request, timeout=40)
        except urllib.error.HTTPError as error: response = error
        data = response.read()
        assert response.status == expected, f'{method} {path}: {response.status} != {expected}: {data[:200]!r}'
        checks.append(f'{method} {path}: {expected}')
        return json.loads(data) if data else None
    def login(self, email, password):
        result = self.call('POST', '/auth/login', {'email': email, 'password': password})
        self.token = result['accessToken']
        return result

admin = Client()
admin.login(env['BOOTSTRAP_ADMIN_EMAIL'], env['BOOTSTRAP_ADMIN_PASSWORD'])
anonymous = Client()
anonymous.call('GET', '/products')
anonymous.call('GET', '/admin/users', expected=401)
anonymous.call('POST', '/auth/refresh', expected=403, csrf=False)
suffix = secrets.token_hex(5)
password = secrets.token_urlsafe(15)
clients = []
for n in range(2):
    client = Client()
    result = client.call('POST', '/auth/register', {'name': 'QA Cliente ' + str(n), 'email': f'qa-{suffix}-{n}@example.com', 'password': password, 'role': 'ADMIN'}, 201)
    client.token = result['accessToken']
    assert result['user']['role'] == 'CLIENTE' and 'password' not in result['user']
    clients.append(client)
client = clients[0]
profile = {'name': 'QA Perfil', 'avatar': 'shield', 'bio': 'Prueba de persistencia',
           'showEmail': False, 'showHeaderBalance': False, 'birthDate': '1999-05-08',
           'location': 'Santiago, Chile', 'showBirthDate': False, 'showLocation': False, 'showHeaderName': False}
anonymous.call('PUT', '/me/profile', profile, 401)
client.call('PUT', '/me/profile', {**profile, 'avatar': 'invalid'}, 400)
client.call('PUT', '/me/profile', {**profile, 'role': 'ADMIN'})
stored = client.call('GET', '/me')
assert stored['role'] == 'CLIENTE' and all(stored[key] == value for key, value in profile.items())
client.call('GET', '/admin/users', expected=403)
client.call('POST', '/auth/register', {'name': 'QA Cliente', 'email': f'qa-{suffix}-0@example.com', 'password': password}, 409)
client.call('POST', '/auth/login', {'email': f'qa-{suffix}-0@example.com', 'password': 'incorrecta'}, 401)
client.call('POST', '/orders', {'requestKey': 'empty'}, 409)
product = {'name': 'QA AK | Transacción ' + suffix, 'category': 'Rifles', 'rarity': 'Covert', 'color': '#eb4b4b', 'price': 10, 'stock': 1, 'collection': 'QA', 'wear': 'Factory New', 'image': 'https://example.com/qa.png', 'featured': False}
client.call('POST', '/products', product, 403)
admin.call('POST', '/products', {**product, 'stock': -1}, 400)
created = admin.call('POST', '/products', product, 201)
pid = created['id']
admin.call('GET', '/products/' + pid)
admin.call('PUT', '/products/' + pid, {**product, 'price': 11})
client.call('PUT', '/cart/' + pid, {'quantity': -1}, 400)
client.call('PUT', '/cart/' + pid, {}, 400)
client.call('POST', '/wallet/top-up', {'amount': -5}, 400)
client.call('POST', '/wallet/top-up', {'amount': 0.01})
for c in clients: c.call('PUT', '/cart/' + pid, {'quantity': 1})
def buy(c):
    # Cada respuesta es válida: exactamente una compra debe ganar el último stock.
    try: return c.call('POST', '/orders', {'requestKey': suffix, 'total': 0}, 201)
    except AssertionError as error:
        if '409 != 201' not in str(error): raise
        return None
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results = list(pool.map(buy, clients))
assert sum(result is not None for result in results) == 1
winner_index = next(i for i, value in enumerate(results) if value is not None)
winner = clients[winner_index]; loser = clients[1-winner_index]; order = results[winner_index]
assert order['total'] == 11
assert winner.call('POST', '/orders', {'requestKey': suffix}, 201)['id'] == order['id']
assert len(winner.call('GET', '/orders')) == 1
assert len(winner.call('GET', '/inventory')) == 1
loser.call('GET', '/orders/' + order['id'], expected=403)
assert admin.call('GET', '/products/' + pid)['stock'] == 0
assert loser.call('GET', '/me')['balance'] in [12500, 12500.01]
admin.call('DELETE', '/products/' + pid, expected=204)
admin.call('GET', '/products/' + pid, expected=404)
assert winner.call('GET', '/orders')[0]['items'][0]['name'] == product['name']
refreshed = winner.call('POST', '/auth/refresh')
winner.token = refreshed['accessToken']
winner.call('GET', '/me')
winner.call('POST', '/auth/logout', expected=204)
winner.call('POST', '/auth/refresh', expected=401)
user = admin.call('POST', '/admin/users', {'name': 'QA Gestión', 'email': f'qa-managed-{suffix}@example.com', 'role': 'CLIENTE', 'password': password, 'blocked': False}, 201)
admin.call('PUT', '/admin/users/' + user['id'], {**user, 'blocked': True})
admin.call('DELETE', '/admin/users/' + user['id'], expected=204)
admin.call('GET', '/admin/users/' + user['id'], expected=404)
loser.call('GET', '/seller/orders', expected=403)
loser.call('GET', '/seller-application', expected=204)
form = {'reason': 'Quiero obtener acceso al panel de vendedor.', 'studies': True,
        'institution': 'Instituto de prueba', 'country': 'Chile', 'region': 'Metropolitana',
        'city': 'Santiago', 'postalCode': '8320000'}
application = loser.call('POST', '/seller-application', form, 201)
assert application['status'] == 'PENDIENTE' and 'skins' not in application
assert application['studies'] is True and application['postalCode'] == '8320000'
review = '/admin/seller-applications/' + application['userId']
loser.call('PUT', review, {'approved': True}, 403)
admin.call('GET', '/admin/seller-applications')
admin.call('PUT', review, {'approved': False, 'note': 'Detalla las skins.'})
assert loser.call('GET', '/seller-application')['status'] == 'RECHAZADA'
loser.call('POST', '/seller-application', form, 201)
assert admin.call('PUT', review, {'approved': True})['status'] == 'APROBADA'
assert loser.call('GET', '/me')['role'] == 'VENDEDOR'
assert any(row['id'] == order['id'] for row in loser.call('GET', '/seller/orders'))
assert loser.call('GET', '/seller/orders/' + order['id'])['id'] == order['id']
loser.call('GET', '/products')
loser.call('GET', '/cart', expected=403)
loser.call('GET', '/admin/users', expected=403)
loser.call('POST', '/products', product, 403)
for service in ['usuarios', 'productos', 'pedidos']:
    assert 'paths' in anonymous.call('GET', f'/{service}/openapi')
Path('tmp/api-smoke-results.json').write_text(json.dumps({'checks': len(checks), 'results': checks, 'concurrent_last_stock': 'passed', 'database': 'MySQL 8.4'}, indent=2), encoding='utf-8')
print(f'OK: {len(checks)} comprobaciones HTTP, compra concurrente, idempotencia y persistencia MySQL.')
