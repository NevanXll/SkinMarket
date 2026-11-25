"""Crea ZIP de entrega sin secretos, dependencias descargadas ni datos privados."""
from pathlib import Path
import sys
import zipfile
ROOT = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT/'entrega/FullStack'
out.mkdir(parents=True,exist_ok=True)
excluded = {'node_modules','target','.git','tmp','dist','.codex-remote-attachments','legacy','entrega','__pycache__'}
docs = {'README.md','Arquitectura_API.md','ERS_SkinMarket_FullStack.md','Manual_Usuario.md','Informe_Testing.md','React_Verificacion.md','Guion_Demostracion.md','Documentacion_APIs.xlsx'}
def allowed(path):
    relative=path.relative_to(ROOT)
    if any(part in excluded for part in relative.parts): return False
    if path.name.startswith('.env') and path.name != '.env.example': return False
    if path.suffix in {'.log','.pem','.key','.docx'}: return False
    if relative.parts[0]=='docs' and len(relative.parts)==2 and path.name not in docs:return False
    if relative.parts[0]=='output' and path.name not in {'SkinMarket_ERS_FullStack.pdf','SkinMarket_Arquitectura_API.pdf','SkinMarket_Manual_Usuario.pdf','SkinMarket_Informe_Testing.pdf'}:return False
    if relative.parts[0]=='scripts' and path.name not in {'build-postman.py','build-fullstack-pdf.py','capture-ui.cjs','smoke-api.py','package-fullstack.py','import-catalog.mjs','demo-local.py'}:return False
    return True
roots = ['src','public','tests','backend','deploy','database','docs','output/pdf','scripts','coverage']
files=[]
for root in roots:
    files.extend(p for p in (ROOT/root).rglob('*') if p.is_file() and allowed(p))
files.extend(p for p in ROOT.iterdir() if p.is_file() and p.name in {'index.html','package.json','package-lock.json','vite.config.js','karma.conf.cjs','README.md','.gitignore','.dockerignore','.env.example','Dockerfile','compose.yaml','compose.demo.yaml'})
files=sorted(set(files))
def package(name, selection, extra, replacements=None):
    target=out/name
    replacements = replacements or {}
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in selection:
            relative = p.relative_to(ROOT).as_posix()
            if relative not in replacements:
                z.write(p,relative)
        for relative, content in replacements.items():
            z.writestr(relative, content)
        z.writestr('LEEME_ENTREGA.md',extra)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        assert not any(Path(n).name=='.env' or 'node_modules/' in n or '/target/' in n for n in z.namelist())
    print(target.name,round(target.stat().st_size/1024/1024,2),'MB')
package('SkinMarket_FullStack.zip',files,'Proyecto completo. Crear .env privado desde .env.example y ejecutar docker compose up -d --build. Ver README.md para la ejecución local y el enlace publicado.\n')
frontend=[p for p in files if p.relative_to(ROOT).parts[0] not in {'backend','database','deploy','scripts'} and p.name not in {'compose.yaml','compose.demo.yaml','Dockerfile','.env.example'}]
frontend.append(ROOT/'scripts/import-catalog.mjs')
package('SkinMarket_Frontend.zip',frontend,'Frontend React. Requiere backend activo. npm ci y npm run dev. Vite envía la API a localhost:8081,8082,8083. Para producción, npm run build y configurar un proxy /api/v1 en el servidor. Las pruebas usan npm test.\n')
backend=[p for p in files if p.relative_to(ROOT).parts[0] in {'backend','database','deploy'} or p.name in {'compose.yaml','.env.example','.dockerignore'}]
backend.extend(p for p in files if 'postman' in p.parts or p.name in {'Arquitectura_API.md','ERS_SkinMarket_FullStack.md','SkinMarket_ERS_FullStack.pdf','SkinMarket_Arquitectura_API.pdf','Documentacion_APIs.xlsx'})
backend_compose = (ROOT/'compose.yaml').read_text(encoding='utf-8').replace(
    '    build: { context: ., dockerfile: Dockerfile }',
    '    image: nginx:alpine\n    volumes: ["./deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro"]'
).replace('  web:\n', '  api-proxy:\n')
backend_readme = '''# SkinMarket Pro Backend

Servicios Spring Boot para autenticación y usuarios, productos, pedidos y postulaciones a vendedor. Usa Java 21 y MySQL 8.4.

1. Crea `.env` a partir de `.env.example` y establece credenciales y secretos propios.
2. Ejecuta `docker compose up -d --build`.
3. Consulta la API en `http://localhost:8080/api/v1` y las interfaces Swagger en `/api/v1/{usuarios,productos,pedidos}/swagger-ui.html`.

Para ejecutar pruebas con Java 21, abre la carpeta `backend` y ejecuta `./mvnw test` o `mvnw.cmd test` en Windows.

La [arquitectura](docs/Arquitectura_API.md), la [planilla de endpoints](docs/Documentacion_APIs.xlsx), Postman y el respaldo SQL están incluidos. La interfaz React está en [SkinMarket](https://github.com/NevanXll/SkinMarket).
'''
package('SkinMarket_Backend.zip',backend,'Consulta README.md para iniciar los servicios y el proxy de la API.\n',
        {'compose.yaml': backend_compose, 'README.md': backend_readme, '.gitignore': (ROOT/'.gitignore').read_text(encoding='utf-8')})
