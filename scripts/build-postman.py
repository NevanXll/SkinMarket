"""Genera colección Postman reproducible, sin credenciales ni tokens reales."""
import json
from pathlib import Path


product = {'name': 'AK-47 | Producto de prueba', 'category': 'Rifles', 'rarity': 'Covert', 'price': 25, 'stock': 3, 'collection': 'Colección QA', 'wear': 'Factory New', 'image': 'https://example.com/skin.png', 'color': '#eb4b4b', 'featured': False}
user = {'name': 'Usuario de prueba', 'email': '{{managed_email}}', 'password': '{{client_password}}', 'role': 'CLIENTE', 'blocked': False}
groups = {}
def add(group, name, method, path, status=200, body=None, auth=True, save=None):
    headers = [{'key': 'Content-Type', 'value': 'application/json'}, {'key': 'X-Requested-With', 'value': 'SkinMarket'}]
    if auth: headers.append({'key': 'Authorization', 'value': 'Bearer {{access_token}}'})
    script = [f'pm.test("HTTP {status}", () => pm.response.to.have.status({status}));']
    if save: script.append(save)
    request = {'method': method, 'header': headers, 'url': '{{base_url}}' + path}
    if body is not None: request['body'] = {'mode': 'raw', 'raw': json.dumps(body, ensure_ascii=False, indent=2), 'options': {'raw': {'language': 'json'}}}
    groups.setdefault(group, []).append({'name': name, 'request': request, 'event': [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': script}}]})

save_token = 'if (pm.response.code < 300) pm.environment.set("access_token", pm.response.json().accessToken);'
add('1 Autenticación', 'Registrar CLIENTE', 'POST', '/auth/register', 201, {'name': 'Cliente Postman', 'email': '{{client_email}}', 'password': '{{client_password}}'}, False, save_token)
add('1 Autenticación', 'Login CLIENTE', 'POST', '/auth/login', body={'email': '{{client_email}}', 'password': '{{client_password}}'}, auth=False, save=save_token)
add('1 Autenticación', 'Mi perfil', 'GET', '/me')
add('1 Autenticación', 'Actualizar mi perfil', 'PUT', '/me/profile',
    body={'name': 'Cliente Postman', 'avatar': 'shield', 'bio': 'Coleccionista',
          'birthDate': '1999-05-08', 'location': 'Santiago, Chile', 'showEmail': False,
          'showHeaderBalance': True, 'showBirthDate': False, 'showLocation': False, 'showHeaderName': True})
add('1 Autenticación', 'Renovar por cookie', 'POST', '/auth/refresh', auth=False, save=save_token)
add('1 Autenticación', 'Logout', 'POST', '/auth/logout', 204, auth=False)
add('2 Catálogo', 'Listar catálogo', 'GET', '/products', auth=False, save='if (pm.response.code === 200 && pm.response.json().length) pm.environment.set("product_id", pm.response.json()[0].id);')
add('2 Catálogo', 'Detalle', 'GET', '/products/{{product_id}}', auth=False)
add('2 Catálogo', 'Producto inexistente', 'GET', '/products/id-inexistente', 404, auth=False)
add('3 Compra CLIENTE', 'Login CLIENTE', 'POST', '/auth/login', body={'email': '{{client_email}}', 'password': '{{client_password}}'}, auth=False, save=save_token)
add('3 Compra CLIENTE', 'Añadir al carrito', 'PUT', '/cart/{{product_id}}', body={'quantity': 1})
add('3 Compra CLIENTE', 'Consultar carrito', 'GET', '/cart')
save_wallet_price = 'if (pm.response.code === 200) pm.environment.set("wallet_price", pm.response.json().find(p => p.id === "pack-500").priceUsd);'
add('3 Compra CLIENTE', 'Consultar paquetes de recarga', 'GET', '/wallet/packages', save=save_wallet_price)
add('3 Compra CLIENTE', 'Recargar saldo virtual', 'POST', '/wallet/packages/pack-500/top-up',
    body={'expectedPrice': '{{wallet_price}}', 'requestKey': '{{$guid}}'})
add('3 Compra CLIENTE', 'Comprar', 'POST', '/orders', 201, {'requestKey': '{{$guid}}'}, save='if (pm.response.code === 201) pm.environment.set("order_id", pm.response.json().id);')
add('3 Compra CLIENTE', 'Mis compras', 'GET', '/orders')
add('3 Compra CLIENTE', 'Detalle compra', 'GET', '/orders/{{order_id}}')
add('3 Compra CLIENTE', 'Inventario', 'GET', '/inventory')
add('3 Compra CLIENTE', 'Cliente sin permiso ADMIN', 'GET', '/admin/users', 403)
add('4 Administración', 'Login ADMIN', 'POST', '/auth/login', body={'email': '{{admin_email}}', 'password': '{{admin_password}}'}, auth=False, save=save_token)
add('4 Administración', 'Crear producto', 'POST', '/products', 201, product, save='if (pm.response.code === 201) pm.environment.set("managed_product_id", pm.response.json().id);')
add('4 Administración', 'Editar producto', 'PUT', '/products/{{managed_product_id}}', body={**product, 'price': 30})
add('4 Administración', 'Eliminar producto', 'DELETE', '/products/{{managed_product_id}}', 204)
add('4 Administración', 'Listar usuarios', 'GET', '/admin/users')
add('4 Administración', 'Crear usuario', 'POST', '/admin/users', 201, user, save='if (pm.response.code === 201) pm.environment.set("managed_user_id", pm.response.json().id);')
add('4 Administración', 'Detalle usuario', 'GET', '/admin/users/{{managed_user_id}}')
add('4 Administración', 'Editar y bloquear usuario', 'PUT', '/admin/users/{{managed_user_id}}', body={**user, 'blocked': True})
add('4 Administración', 'Eliminar usuario sin compras', 'DELETE', '/admin/users/{{managed_user_id}}', 204)
add('4 Administración', 'Pedidos administrativos', 'GET', '/admin/orders')
add('4 Administración', 'Consultar precio vigente de recarga', 'GET', '/wallet/packages', save=save_wallet_price)
add('4 Administración', 'Editar precio de recarga de 500 USD', 'PUT', '/admin/wallet/packages/pack-500', body={'priceUsd': 249.99})
add('4 Administración', 'Restaurar precio anterior de recarga', 'PUT', '/admin/wallet/packages/pack-500', body={'priceUsd': '{{wallet_price}}'})
add('5 Validaciones', 'Precio negativo', 'POST', '/products', 400, {**product, 'price': -1})
add('5 Validaciones', 'Stock fraccionario', 'POST', '/products', 400, {**product, 'stock': 1.5})
add('5 Validaciones', 'Registro inválido', 'POST', '/auth/register', 400, {'name': 'A', 'email': 'invalid', 'password': '123'}, False)
add('5 Validaciones', 'Cantidad negativa', 'PUT', '/cart/{{product_id}}', 400, {'quantity': -1})
add('5 Validaciones', 'Recarga negativa', 'POST', '/wallet/top-up', 400, {'amount': -1})
add('5 Validaciones', 'Endpoint sin token', 'GET', '/admin/users', 401, auth=False)
add('6 Vendedor', 'Enviar solicitud como cliente', 'POST', '/seller-application', 201,
    {'reason': 'Quiero obtener acceso al panel de vendedor.', 'studies': True,
     'country': 'Chile', 'region': 'Metropolitana', 'city': 'Santiago', 'postalCode': '8320000'},
    save='if (pm.response.code === 201) pm.environment.set("applicant_id", pm.response.json().userId);')
add('6 Vendedor', 'Consultar mi solicitud', 'GET', '/seller-application')
add('6 Vendedor', 'Login ADMIN', 'POST', '/auth/login',
    body={'email': '{{admin_email}}', 'password': '{{admin_password}}'}, auth=False, save=save_token)
add('6 Vendedor', 'Listar solicitudes', 'GET', '/admin/seller-applications')
add('6 Vendedor', 'Aprobar solicitud', 'PUT', '/admin/seller-applications/{{applicant_id}}',
    body={'approved': True, 'note': 'Solicitud revisada.'})
add('6 Vendedor', 'Login VENDEDOR', 'POST', '/auth/login',
    body={'email': '{{client_email}}', 'password': '{{client_password}}'}, auth=False, save=save_token)
add('6 Vendedor', 'Consultar skins adquiridas y publicaciones', 'GET', '/seller/listings',
    save='const lot = pm.response.json().inventory?.[0]; if (lot) { pm.environment.set("seller_order_id", lot.orderId); pm.environment.set("seller_product_id", lot.productId); }')
add('6 Vendedor', 'Publicar una skin adquirida', 'POST', '/seller/listings', 201,
    {'orderId': '{{seller_order_id}}', 'productId': '{{seller_product_id}}', 'price': 25, 'quantity': 1},
    save='if (pm.response.code === 201) pm.environment.set("seller_listing_id", pm.response.json().id);')
add('6 Vendedor', 'Ajustar precio de una publicación', 'PUT', '/seller/listings/{{seller_listing_id}}',
    body={'price': 27, 'quantity': 1})
add('6 Vendedor', 'Pausar una publicación', 'PUT', '/seller/listings/{{seller_listing_id}}',
    body={'price': 27, 'quantity': 0})
add('6 Vendedor', 'Listar mis ventas', 'GET', '/seller/orders',
    save='if (pm.response.code === 200 && pm.response.json().length) pm.environment.set("order_id", pm.response.json()[0].id);')
add('6 Vendedor', 'Detalle de una venta realizada', 'GET', '/seller/orders/{{order_id}}')
collection = {'info': {'name': 'SkinMarket Full Stack', 'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', 'description': 'Requiere servidor activo y entorno privado. Ejecutar por grupos. Los cambios de compra son persistentes y el saldo es virtual.'}, 'item': [{'name': name, 'item': items} for name, items in groups.items()]}
values = {'base_url': 'http://localhost:8080/api/v1', 'client_email': '', 'client_password': '', 'admin_email': '', 'admin_password': '', 'managed_email': '', 'access_token': '', 'product_id': '', 'managed_product_id': '', 'managed_user_id': '', 'order_id': '', 'applicant_id': '', 'wallet_price': '', 'seller_order_id': '', 'seller_product_id': '', 'seller_listing_id': ''}
environment = {'name': 'SkinMarket local ejemplo', 'values': [{'key': k, 'value': v, 'type': 'secret' if 'password' in k or k == 'access_token' else 'default', 'enabled': True} for k,v in values.items()], '_postman_variable_scope': 'environment'}
target = Path('docs/postman'); target.mkdir(parents=True, exist_ok=True)
for name, content in [('SkinMarket.postman_collection.json', collection), ('SkinMarket.postman_environment.json', environment)]:
    (target/name).write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Colección: {sum(map(len, groups.values()))} solicitudes; entorno sin secretos.')
