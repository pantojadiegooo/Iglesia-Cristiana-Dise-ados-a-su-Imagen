"""
app.py — Diseñados a su Imagen
Backend Flask:
- Donaciones con Stripe
- API pública de contenido
- Formulario de contacto con Cloudflare Turnstile
- Panel de administración con login
"""

import os
import json
import urllib.request
import urllib.parse
from datetime import datetime

from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, abort
from flask_cors import CORS
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user,
)
import stripe
from dotenv import load_dotenv

from models import db, Usuario, Contenido, SECCIONES


load_dotenv()

app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "cambia-esto-en-produccion",
)

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "sqlite:///panel.db",
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


# ============================================================
# CORS
# ============================================================

ORIGEN_FRONTEND = "https://iglesia-cristiana-dise-ados-a-su-im.vercel.app"

CORS(
    app,
    resources={
        r"/api/contacto": {
            "origins": ORIGEN_FRONTEND,
            "methods": ["POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        },
        r"/api/crear-donacion": {
            "origins": ORIGEN_FRONTEND,
            "methods": ["POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        },
        r"/api/contenido": {
            "origins": ORIGEN_FRONTEND,
            "methods": ["GET", "OPTIONS"],
        },
        r"/api/contenido/.*": {
            "origins": ORIGEN_FRONTEND,
            "methods": ["GET", "OPTIONS"],
        },
    },
)


# ============================================================
# LOGIN
# ============================================================

login_manager = LoginManager(app)
login_manager.login_view = "panel_login"
login_manager.login_message = "Inicia sesión para continuar."


@login_manager.user_loader
def cargar_usuario(user_id):
    return db.session.get(Usuario, int(user_id))


# ============================================================
# CONFIGURACIÓN
# ============================================================

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

DOMINIO_SITIO = os.environ.get(
    "DOMINIO_SITIO",
    "http://localhost:5500",
)

DISCORD_WEBHOOK_URL = os.environ.get(
    "DISCORD_WEBHOOK_URL",
    "",
)

MONTO_MINIMO_MXN = 10
MONTO_MAXIMO_MXN = 50000


# ============================================================
# DONACIONES
# ============================================================

@app.route("/api/crear-donacion", methods=["POST"])
def crear_donacion():

    datos = request.get_json(silent=True) or {}
    monto_mxn_crudo = datos.get("monto_mxn")

    try:
        monto_mxn = int(float(monto_mxn_crudo))
    except (TypeError, ValueError):
        return jsonify({
            "error": (
                f"Monto inválido. Debe estar entre "
                f"${MONTO_MINIMO_MXN} y ${MONTO_MAXIMO_MXN} MXN."
            )
        }), 400

    if not (MONTO_MINIMO_MXN <= monto_mxn <= MONTO_MAXIMO_MXN):
        return jsonify({
            "error": (
                f"Monto inválido. Debe estar entre "
                f"${MONTO_MINIMO_MXN} y ${MONTO_MAXIMO_MXN} MXN."
            )
        }), 400

    try:
        sesion = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "mxn",
                        "product_data": {
                            "name": "Diezmo / Ofrenda - Diseñados a su Imagen",
                            "description": (
                                "Donación a la Iglesia Cristiana "
                                "Diseñados a su Imagen, Iztapalapa, CDMX"
                            ),
                        },
                        "unit_amount": monto_mxn * 100,
                    },
                    "quantity": 1,
                }
            ],
            success_url=(
                f"{DOMINIO_SITIO}/donaciones.html?estado=exito"
            ),
            cancel_url=(
                f"{DOMINIO_SITIO}/donaciones.html?estado=cancelado"
            ),
        )

        return jsonify({
            "checkout_url": sesion.url
        })

    except stripe.error.StripeError as e:
        app.logger.error(f"Error de Stripe: {e}")

        return jsonify({
            "error": "No se pudo iniciar el pago con Stripe."
        }), 502


# ============================================================
# WEBHOOK STRIPE
# ============================================================

@app.route("/api/webhook-stripe", methods=["POST"])
def webhook_stripe():

    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    try:
        evento = stripe.Webhook.construct_event(
            payload,
            sig_header,
            webhook_secret,
        )

    except (
        ValueError,
        stripe.error.SignatureVerificationError,
    ):
        return jsonify({
            "error": "Firma inválida"
        }), 400

    if evento["type"] == "checkout.session.completed":

        sesion = evento["data"]["object"]

        app.logger.info(
            "Donación completada: "
            f"{sesion.get('amount_total')} centavos MXN"
        )

    return jsonify({
        "received": True
    })


# ============================================================
# API PÚBLICA DE CONTENIDO
# ============================================================

@app.route("/api/contenido/<clave>", methods=["GET"])
def api_leer_contenido(clave):

    if clave not in SECCIONES:
        return jsonify({
            "error": "Sección desconocida."
        }), 404

    fila = Contenido.query.filter_by(
        clave=clave
    ).first()

    if not fila:
        return jsonify(
            SECCIONES[clave]["ejemplo"]
        )

    return jsonify(
        json.loads(fila.valor_json)
    )


@app.route("/api/contenido", methods=["GET"])
def api_leer_todo_el_contenido():

    resultado = {}

    filas = {
        f.clave: f
        for f in Contenido.query.all()
    }

    for clave, meta in SECCIONES.items():

        if clave in filas:
            resultado[clave] = json.loads(
                filas[clave].valor_json
            )
        else:
            resultado[clave] = meta["ejemplo"]

    return jsonify(resultado)


# ============================================================
# DISCORD
# ============================================================

def enviar_notificacion_discord(
    nombre,
    correo,
    mensaje,
):

    if not DISCORD_WEBHOOK_URL:
        return

    payload = {
        "embeds": [
            {
                "title": "Nuevo mensaje de contacto",
                "color": 0xD4AF37,
                "fields": [
                    {
                        "name": "Nombre",
                        "value": nombre[:1000],
                        "inline": False,
                    },
                    {
                        "name": "Correo",
                        "value": correo[:1000],
                        "inline": False,
                    },
                    {
                        "name": "Mensaje",
                        "value": mensaje[:1000],
                        "inline": False,
                    },
                ],
            }
        ]
    }

    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        DISCORD_WEBHOOK_URL,
        data=data,
        headers={
            "Content-Type": "application/json"
        },
    )

    try:
        urllib.request.urlopen(
            req,
            timeout=5,
        )

    except Exception as e:
        app.logger.error(
            f"No se pudo notificar a Discord: {e}"
        )


# ============================================================
# FORMULARIO DE CONTACTO
# ============================================================

@app.route("/api/contacto", methods=["POST"])
def api_contacto():

    datos = request.get_json(
        silent=True
    ) or {}

    nombre = datos.get("nombre")
    correo = datos.get("correo")
    mensaje = datos.get("mensaje")
    token = datos.get("token")

    # --------------------------------------------------------
    # 1. Validar Turnstile
    # --------------------------------------------------------

    if not token:
        return jsonify({
            "status": "error",
            "message": (
                "Falta la verificación de seguridad antibots."
            ),
        }), 400

    secret_key = os.environ.get(
        "TURNSTILE_SECRET_KEY"
    )

    if not secret_key:
        app.logger.error(
            "TURNSTILE_SECRET_KEY no está configurada."
        )

        return jsonify({
            "status": "error",
            "message": "Error interno de configuración.",
        }), 500

    cloudflare_data = urllib.parse.urlencode({
        "secret": secret_key,
        "response": token,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data=cloudflare_data,
    )

    try:

        with urllib.request.urlopen(req) as response:

            resultado = json.loads(
                response.read().decode("utf-8")
            )

            if not resultado.get("success"):

                app.logger.warning(
                    "Intento de bot bloqueado por Turnstile."
                )

                return jsonify({
                    "status": "error",
                    "message": (
                        "Falló la verificación antibots."
                    ),
                }), 400

    except Exception as e:

        app.logger.error(
            f"Error al conectar con Cloudflare: {e}"
        )

        return jsonify({
            "status": "error",
            "message": (
                "Error interno al validar seguridad."
            ),
        }), 500

    # --------------------------------------------------------
    # 2. Validar formulario
    # --------------------------------------------------------

    if not nombre or not correo or not mensaje:

        return jsonify({
            "status": "error",
            "message": (
                "Todos los campos son obligatorios."
            ),
        }), 400

    # --------------------------------------------------------
    # 3. Procesar mensaje
    # --------------------------------------------------------

    app.logger.info(
        f"Nuevo mensaje de contacto recibido de: "
        f"{nombre} ({correo})"
    )

    enviar_notificacion_discord(
        nombre,
        correo,
        mensaje,
    )

    return jsonify({
        "status": "success",
        "message": "Mensaje enviado correctamente.",
    }), 200


# ============================================================
# PANEL DE ADMINISTRACIÓN
# ============================================================

@app.route("/panel/login", methods=["GET", "POST"])
def panel_login():

    if current_user.is_authenticated:
        return redirect(
            url_for("panel_dashboard")
        )

    if request.method == "POST":

        username = request.form.get(
            "username",
            "",
        ).strip()

        password = request.form.get(
            "password",
            "",
        )

        usuario = Usuario.query.filter_by(
            username=username
        ).first()

        if (
            usuario
            and usuario.activo
            and usuario.check_password(password)
        ):

            login_user(usuario)

            return redirect(
                url_for("panel_dashboard")
            )

        flash(
            "Usuario o contraseña incorrectos."
        )

    return render_template(
        "panel_login.html"
    )


@app.route("/panel/logout")
@login_required
def panel_logout():

    logout_user()

    return redirect(
        url_for("panel_login")
    )


@app.route("/panel")
@login_required
def panel_dashboard():

    secciones_visibles = {
        clave: meta
        for clave, meta in SECCIONES.items()
        if current_user.puede_editar(clave)
    }

    return render_template(
        "panel_dashboard.html",
        secciones=secciones_visibles,
    )


@app.route("/panel/editar/<clave>", methods=["GET", "POST"])
@login_required
def panel_editar(clave):

    if (
        clave not in SECCIONES
        or not current_user.puede_editar(clave)
    ):
        abort(403)

    fila = Contenido.query.filter_by(
        clave=clave
    ).first()

    valor_actual = (
        json.loads(fila.valor_json)
        if fila
        else SECCIONES[clave]["ejemplo"]
    )

    if request.method == "POST":

        texto_json = request.form.get(
            "valor_json",
            "",
        )

        try:
            nuevo_valor = json.loads(
                texto_json
            )

        except json.JSONDecodeError as e:

            flash(
                f"Ese texto no es JSON válido: {e}"
            )

            return render_template(
                "panel_editar.html",
                clave=clave,
                meta=SECCIONES[clave],
                valor_json=texto_json,
            )

        if not fila:

            fila = Contenido(
                clave=clave
            )

            db.session.add(fila)

        fila.valor_json = json.dumps(
            nuevo_valor,
            ensure_ascii=False,
            indent=2,
        )

        fila.actualizado_en = datetime.utcnow()
        fila.actualizado_por = (
            current_user.username
        )

        db.session.commit()

        flash(
            "Guardado. Los cambios ya están "
            "en vivo en el sitio."
        )

        return redirect(
            url_for("panel_dashboard")
        )

    return render_template(
        "panel_editar.html",
        clave=clave,
        meta=SECCIONES[clave],
        valor_json=json.dumps(
            valor_actual,
            ensure_ascii=False,
            indent=2,
        ),
    )


# ============================================================
# USUARIOS
# ============================================================

@app.route("/panel/usuarios")
@login_required
def panel_usuarios():

    if current_user.rol != "pastor":
        abort(403)

    usuarios = Usuario.query.order_by(
        Usuario.rol.desc(),
        Usuario.username,
    ).all()

    return render_template(
        "panel_usuarios.html",
        usuarios=usuarios,
    )


@app.route(
    "/panel/usuarios/crear",
    methods=["POST"],
)
@login_required
def panel_usuarios_crear():

    if current_user.rol != "pastor":
        abort(403)

    username = request.form.get(
        "username",
        "",
    ).strip().lower()

    nombre_visible = request.form.get(
        "nombre_visible",
        "",
    ).strip()

    password = request.form.get(
        "password",
        "",
    )

    ministerio = request.form.get(
        "ministerio",
        "",
    ).strip()

    if (
        not username
        or not password
        or not nombre_visible
        or not ministerio
    ):

        flash(
            "Faltan datos para crear "
            "al líder de ministerio."
        )

        return redirect(
            url_for("panel_usuarios")
        )

    if Usuario.query.filter_by(
        username=username
    ).first():

        flash(
            "Ese nombre de usuario ya existe."
        )

        return redirect(
            url_for("panel_usuarios")
        )

    nuevo = Usuario(
        username=username,
        nombre_visible=nombre_visible,
        rol="lider",
        ministerio=ministerio,
        activo=True,
    )

    nuevo.set_password(password)

    db.session.add(nuevo)
    db.session.commit()

    flash(
        f"Cuenta creada para "
        f"{nombre_visible} ({username})."
    )

    return redirect(
        url_for("panel_usuarios")
    )


@app.route(
    "/panel/usuarios/<int:usuario_id>/desactivar",
    methods=["POST"],
)
@login_required
def panel_usuarios_desactivar(usuario_id):

    if current_user.rol != "pastor":
        abort(403)

    usuario = db.session.get(
        Usuario,
        usuario_id,
    )

    if usuario and usuario.rol != "pastor":

        usuario.activo = not usuario.activo

        db.session.commit()

    return redirect(
        url_for("panel_usuarios")
    )


# ============================================================
# INICIO
# ============================================================

if __name__ == "__main__":

    with app.app_context():
        db.create_all()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
    )
