"""Inicia una tienda local aislada con cuentas ficticias para probar los tres roles."""

import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener


ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:8088"
ENV_FILE = ROOT / ".env.demo"
ADMIN = ("admin.demo@skinmarket.example", "DemoAdmin!2026")
CLIENT = ("cliente.demo@skinmarket.example", "DemoCliente!2026")
SELLER = ("vendedor.demo@skinmarket.example", "DemoVendedor!2026")
HTTP = build_opener(ProxyHandler({}))
COMPOSE = [
    "docker", "compose", "--project-name", "skinmarket-demo",
    "--env-file", str(ENV_FILE), "-f", "compose.yaml", "-f", "compose.demo.yaml",
]


def local_environment():
    demo = {
        "BOOTSTRAP_ADMIN_EMAIL": ADMIN[0],
        "BOOTSTRAP_ADMIN_PASSWORD": ADMIN[1],
        "CORS_ORIGINS": URL,
        "COOKIE_SECURE": "false",
    }
    try:
        with ENV_FILE.open("x", encoding="utf-8") as file:
            for name in ("DB_PASSWORD", "MYSQL_ROOT_PASSWORD", "JWT_SECRET"):
                file.write(f"{name}={secrets.token_urlsafe(32)}\n")
    except FileExistsError:
        pass
    env = os.environ.copy()
    for name in ("DB_PASSWORD", "MYSQL_ROOT_PASSWORD", "JWT_SECRET"):
        env.pop(name, None)
    env.update(demo)
    return env


class Api:
    def __init__(self):
        self.token = None

    def call(self, method, route, body=None, expected=(200,)):
        headers = {"Content-Type": "application/json", "X-Requested-With": "SkinMarket"}
        if self.token:
            headers["Authorization"] = "Bearer " + self.token
        request = Request(URL + "/api/v1" + route, method=method, headers=headers,
                          data=json.dumps(body).encode() if body is not None else None)
        try:
            response = HTTP.open(request, timeout=20)
        except HTTPError as error:
            response = error
        with response:
            raw = response.read()
            data = json.loads(raw) if raw else None
            if response.status not in expected:
                message = (data or {}).get("message", "")
                raise RuntimeError(f"{method} {route}: HTTP {response.status}. {message}")
            return response.status, data

    def login(self, credentials, name=None):
        email, password = credentials
        body = {"email": email, "password": password}
        status, session = self.call("POST", "/auth/login", body, expected=(200, 401))
        if status == 401 and name:
            _, session = self.call("POST", "/auth/register", {**body, "name": name}, expected=(201,))
        if session is None or "accessToken" not in session:
            raise RuntimeError(f"No se pudo autenticar la cuenta de demostración {email}.")
        self.token = session["accessToken"]
        return session["user"]


def load_accounts():
    admin, client, seller = Api(), Api(), Api()
    if admin.login(ADMIN)["role"] != "ADMIN":
        raise RuntimeError("La cuenta de demostración administradora no tiene el rol ADMIN.")
    if client.login(CLIENT, "Cliente Demostración")["role"] != "CLIENTE":
        raise RuntimeError("La cuenta de demostración cliente cambió de rol.")
    account = seller.login(SELLER, "Vendedor Demostración")
    if account["role"] == "CLIENTE":
        _, inventory = seller.call("GET", "/inventory")
        if not inventory:
            _, products = seller.call("GET", "/products")
            product = next((row for row in products if row["stock"] > 0 and not row["resale"]
                            and row["price"] <= account["balance"]), None)
            if not product:
                raise RuntimeError("El catálogo de demostración no tiene una skin disponible.")
            seller.call("PUT", f"/cart/{product['id']}", {"quantity": 1})
            seller.call("POST", "/orders", {"requestKey": "demo-vendedor-inventario"}, expected=(201,))

        status, application = seller.call("GET", "/seller-application", expected=(200, 204))
        if status == 204 or application["status"] == "RECHAZADA":
            seller.call("POST", "/seller-application", {
                "reason": "Quiero publicar skins de mi inventario.",
                "studies": False, "country": "Chile", "region": "Metropolitana", "city": "Santiago",
            }, expected=(201,))
        admin.call("PUT", f"/admin/seller-applications/{account['id']}", {"approved": True})
    if seller.login(SELLER)["role"] != "VENDEDOR":
        raise RuntimeError("No se pudo habilitar el rol VENDEDOR.")


def main():
    action = sys.argv[1:]
    if action not in ([], ["--stop"]):
        raise SystemExit("Uso: python scripts/demo-local.py [--stop]")
    env = local_environment()
    command = ["stop"] if action else ["up", "-d", "--build", "--wait", "--wait-timeout", "360"]
    subprocess.run([*COMPOSE, *command], cwd=ROOT, env=env, check=True)
    if not action:
        load_accounts()
        print(f"SkinMarket Pro tiene las tres cuentas disponibles en {URL}.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, URLError, RuntimeError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"No se pudo completar la demostración: {error}") from None
