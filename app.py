"""
app.py — Diseñados a su Imagen
Backend único: donaciones (Stripe) + panel de administración + API de
contenido para el sitio estático en GitHub Pages + API de Contacto.

Cómo se conecta con el sitio público:
- GitHub Pages sigue siendo 100% estático (no cambia cómo lo publicas).
- Este backend expone /api/contenido/<clave> en modo lectura, sin login,
  para que el sitio público lo consuma con fetch() (igual que ya hace el
  botón de donar). Ver dinamico.js para el código del lado del sitio.
- El panel (/panel/...) SÍ requiere login y vive en este mismo dominio de
  Render, así que el login usa sesión normal de Flask, sin líos de CORS.

Instalación:
    pip install flask flask-cors flask-login flask-sqlalchemy stripe python-dotenv

    Si usas Postgres en vez de SQLite (recomendado en producción, ver nota
    abajo sobre el disco de Render):
    pip install psycopg2-binary

Variables de entorno nuevas (además de las que ya tenías para Stripe):
    SECRET_KEY=una-cadena-larga-y-aleatoria         (para las sesiones de login)
    DATABASE_URL=sqlite:///panel.db                  (ver advertencia abajo)

⚠️ ADVERTENCIA IMPORTANTE SOBRE RENDER Y SQLITE:
    Si usas el plan gratuito de Render, el disco NO es permanente: cada vez
    que Render reinicia o redepliega tu servicio, cualquier archivo SQLite
    local (panel.db) se BORRA y pierdes usuarios y contenido guardado.
    Para producción real, usa una base de datos administrada (Render
    Postgres, o gratis en Neon.tech / Supabase) y pon esa URL en
    DATABASE_URL. Para probar en tu computadora, SQLite está perfecto.
"""

import os
import json
import urllib.request
import urllib.parse
from datetime import datetime

from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, abort
from flask_cors import CORS
from flask_login import (
    LoginManager, login_user, logout_user, login_required, current_user
)
import stripe
from dotenv import load_dotenv

from models import db, Usuario, Contenido, SECCIONES

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "cambia-esto-en-produccion")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///panel.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# CORS solo para las rutas /api/* (las que consume el sitio público estático).
# En producción, cambia origins="*" por tu dominio real de GitHub Pages.
CORS(app, resources={r"/api/*": {"origins": "*"}})

login_manager = LoginManager(app)
login_manager.login_view = "panel_login"
login_manager.login_message = "Inicia sesión para continuar."


@login_manager.user_loader
def cargar_usuario(user_id):
    return db.session.get(Usuario, int(user_id))


stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
DOMINIO_SITIO = os.environ.get("DOMINIO_SITIO", "http://localhost:5500")
MONTOS_PERMITIDOS_MXN = {50, 100, 200, 300, 500, 1000, 2000, 5000}


# ===========================================================================
# DONACIONES (sin cambios respecto a tu app_donaciones.py original)
# ===========================================================================

@app.route("/api/crear-donacion", methods=["POST"])
def crear_donacion():
    datos = request.get_json(silent=True) or {}
    monto_mxn = datos.get("monto_mxn")

    if not isinstance(monto_mxn, (int, float)) or int(monto_mxn) not in MONTOS_PERMITIDOS_MXN:
        return jsonify({"error": "Monto inválido."}), 400

    monto_mxn = int(monto_mxn)

    try:
        sesion = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "mxn",
                    "product_data": {
                        "name": "Diezmo / Ofrenda - Diseñados a su Imagen",
                        "description": "Donación a la Iglesia Cristiana Diseñados a su Imagen, Iztapalapa, CDMX",
                    },
                    "unit_amount": monto_mxn * 100,
                },
                "quantity": 1,
            }],
            success_url=f"{DOMINIO_SITIO}/donaciones.html?estado=exito",
            cancel_url=f"{DOMINIO_SITIO}/donaciones.html?estado=cancelado",
        )
        return jsonify({"checkout_url": sesion.url})

    except stripe.error.StripeError as e:
        app.logger.error(f"Error de Stripe: {e}")
        return jsonify({"error": "No se pudo iniciar el pago con Stripe."}), 502


@app.route("/api/webhook-stripe", methods=["POST"])
def webhook_stripe():
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    try:
        evento = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return jsonify({"error": "Firma inválida"}), 400

    if evento["type"] == "checkout.session.completed":
        sesion = evento["data"]["object"]
        app.logger.info(f"Donación completada: {sesion.get('amount_total')} centavos MXN")

    return jsonify({"received": True})


# ===========================================================================
# API PÚBLICA DE CONTENIDO (sin login — la consume el sitio estático)
# ===========================================================================

@app.route("/api/contenido/<clave>", methods=["GET"])
def api_leer_contenido(clave):
    if clave not in SECCIONES:
        return jsonify({"error": "Sección desconocida."}), 404
    fila = Contenido.query.filter_by(clave=clave).first()
    if not fila:
        # Todavía nadie lo ha editado: devolvemos el ejemplo vacío/plantilla
        # para que el sitio público no truene.
        return jsonify(SECCIONES[clave]["ejemplo"])
    return jsonify(json.loads(fila.valor_json))


@app.route("/api/contenido", methods=["GET"])
def api_leer_todo_el_contenido():
    """Conveniencia: trae todas las secciones en una sola llamada."""
    resultado = {}
    filas = {f.clave: f for f in Contenido.query.all()}
    for clave, meta in SECCIONES.items():
        if clave in filas:
            resultado[clave] = json.loads(filas[clave].valor_json)
        else:
            resultado[clave] = meta["ejemplo"]
    return jsonify(resultado)


# ===========================================================================
# FORMULARIO DE CONTACTO Y VERIFICACIÓN ANTIBOT (Cloudflare Turnstile)
# ===========================================================================

@app.route("/api/contacto", methods=["POST", "OPTIONS"])
def api_contacto():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    datos = request.get_json(silent=True) or {}
    nombre = datos.get("nombre")
    correo = datos.get("correo")
    mensaje = datos.get("mensaje")
    token = datos.get("token")

    # 1. Validar presencia del token
    if not token:
        return jsonify({"status": "error", "message": "Falta la verificación de seguridad antibots."}), 400

    # 2. Validar token con Cloudflare
    secret_key = os.environ.get("TURNSTILE_SECRET_KEY", "TU_SECRET_KEY_AQUI")
    cloudflare_data = urllib.parse.urlencode({
        'secret': secret_key,
        'response': token
    }).encode('utf-8')
    
    req = urllib.request.Request('https://challenges.cloudflare.com/turnstile/v0/siteverify', data=cloudflare_data)
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            if not result.get("success"):
                app.logger.warning("Intento de bot bloqueado por Turnstile.")
                return jsonify({"status": "error", "message": "Fallo la verificación antibots."}), 400
    except Exception as e:
        app.logger.error(f"Error al conectar con Cloudflare: {e}")
        return jsonify({"status": "error", "message": "Error interno al validar seguridad."}), 500

    # 3. Validar datos básicos
    if not nombre or not correo or not mensaje:
        return jsonify({"status": "error", "message": "Todos los campos son obligatorios."}), 400

    # Aquí puedes añadir la lógica para guardar en DB o enviar un correo
    app.logger.info(f"Nuevo mensaje de contacto recibido de: {nombre} ({correo})")

    return jsonify({"status": "success", "message": "Mensaje enviado correctamente."}), 200


# ===========================================================================
# PANEL DE ADMINISTRACIÓN (con login)
# ===========================================================================

@app.route("/panel/login", methods=["GET", "POST"])
def panel_login():
    if current_user.is_authenticated:
        return redirect(url_for("panel_dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        usuario = Usuario.query.filter_by(username=username).first()

        if usuario and usuario.activo and usuario.check_password(password):
            login_user(usuario)
            return redirect(url_for("panel_dashboard"))

        flash("Usuario o contraseña incorrectos.")

    return render_template("panel_login.html")


@app.route("/panel/logout")
@login_required
def panel_logout():
    logout_user()
    return redirect(url_for("panel_login"))


@app.route("/panel")
@login_required
def panel_dashboard():
    secciones_visibles = {
        clave: meta for clave, meta in SECCIONES.items()
        if current_user.puede_editar(clave)
    }
    return render_template("panel_dashboard.html", secciones=secciones_visibles)


@app.route("/panel/editar/<clave>", methods=["GET", "POST"])
@login_required
def panel_editar(clave):
    if clave not in SECCIONES or not current_user.puede_editar(clave):
        abort(403)

    fila = Contenido.query.filter_by(clave=clave).first()
    valor_actual = json.loads(fila.valor_json) if fila else SECCIONES[clave]["ejemplo"]

    if request.method == "POST":
        texto_json = request.form.get("valor_json", "")
        try:
            nuevo_valor = json.loads(texto_json)
        except json.JSONDecodeError as e:
            flash(f"Ese texto no es JSON válido: {e}")
            return render_template("panel_editar.html", clave=clave,
                                    meta=SECCIONES[clave],
                                    valor_json=texto_json)

        if not fila:
            fila = Contenido(clave=clave)
            db.session.add(fila)

        fila.valor_json = json.dumps(nuevo_valor, ensure_ascii=False, indent=2)
        fila.actualizado_en = datetime.utcnow()
        fila.actualizado_por = current_user.username
        db.session.commit()
        flash("Guardado. Los cambios ya están en vivo en el sitio.")
        return redirect(url_for("panel_dashboard"))

    return render_template(
        "panel_editar.html",
        clave=clave,
        meta=SECCIONES[clave],
        valor_json=json.dumps(valor_actual, ensure_ascii=False, indent=2),
    )


# ------------------------------ Gestión de usuarios (solo pastores) -------

@app.route("/panel/usuarios")
@login_required
def panel_usuarios():
    if current_user.rol != "pastor":
        abort(403)
    usuarios = Usuario.query.order_by(Usuario.rol.desc(), Usuario.username).all()
    return render_template("panel_usuarios.html", usuarios=usuarios)


@app.route("/panel/usuarios/crear", methods=["POST"])
@login_required
def panel_usuarios_crear():
    if current_user.rol != "pastor":
        abort(403)

    username = request.form.get("username", "").strip().lower()
    nombre_visible = request.form.get("nombre_visible", "").strip()
    password = request.form.get("password", "")
    ministerio = request.form.get("ministerio", "").strip()

    if not username or not password or not nombre_visible or not ministerio:
        flash("Faltan datos para crear al líder de ministerio.")
        return redirect(url_for("panel_usuarios"))

    if Usuario.query.filter_by(username=username).first():
        flash("Ese nombre de usuario ya existe.")
        return redirect(url_for("panel_usuarios"))

    nuevo = Usuario(username=username, nombre_visible=nombre_visible,
                     rol="lider", ministerio=ministerio, activo=True)
    nuevo.set_password(password)
    db.session.add(nuevo)
    db.session.commit()
    flash(f"Cuenta creada para {nombre_visible} ({username}).")
    return redirect(url_for("panel_usuarios"))


@app.route("/panel/usuarios/<int:usuario_id>/desactivar", methods=["POST"])
@login_required
def panel_usuarios_desactivar(usuario_id):
    if current_user.rol != "pastor":
        abort(403)
    usuario = db.session.get(Usuario, usuario_id)
    if usuario and usuario.rol != "pastor":
        usuario.activo = not usuario.activo
        db.session.commit()
    return redirect(url_for("panel_usuarios"))


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=False)
