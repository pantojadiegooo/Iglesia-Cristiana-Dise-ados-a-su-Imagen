"""
crear_pastor.py — Crea el primer usuario "pastor" del panel.

Necesario porque el panel solo permite crear nuevos usuarios desde una
cuenta pastor ya existente (chicken-and-egg problem la primera vez).

Uso:
    python crear_pastor.py

Pide usuario, nombre y contraseña por consola y crea la cuenta con
rol "pastor" (acceso total al panel).
"""

import getpass

from app import app
from models import db, Usuario

with app.app_context():
    db.create_all()

    username = input("Usuario (para iniciar sesión): ").strip().lower()
    if Usuario.query.filter_by(username=username).first():
        print(f"Ya existe un usuario con el nombre '{username}'.")
        raise SystemExit(1)

    nombre_visible = input("Nombre completo: ").strip()
    password = getpass.getpass("Contraseña: ")
    password_confirmar = getpass.getpass("Confirma la contraseña: ")

    if password != password_confirmar:
        print("Las contraseñas no coinciden.")
        raise SystemExit(1)

    if len(password) < 8:
        print("La contraseña debe tener al menos 8 caracteres.")
        raise SystemExit(1)

    pastor = Usuario(
        username=username,
        nombre_visible=nombre_visible,
        rol="pastor",
        activo=True,
    )
    pastor.set_password(password)
    db.session.add(pastor)
    db.session.commit()

    print(f"\nCuenta pastor creada: {username}")
