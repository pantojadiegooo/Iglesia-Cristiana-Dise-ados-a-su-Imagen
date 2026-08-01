"""
app_donaciones.py
Backend para procesar donaciones con tarjeta usando Stripe Checkout.

Por qué así y no "capturar la tarjeta directamente":
- Tu servidor NUNCA recibe el número de tarjeta. Stripe aloja el formulario
  de pago en su propio dominio (checkout.stripe.com), certificado PCI-DSS
  nivel 1. Tú solo creas la "sesión" (monto + descripción) y rediriges ahí.
- Esto es legal, seguro y realista para tener listo hoy/mañana.
  Un backend que reciba números de tarjeta en tu propio servidor NO es algo
  que deba construirse sin una certificación PCI-DSS formal.

Instalación:
    pip install flask flask-cors stripe python-dotenv

Variables de entorno (crea un archivo .env, NUNCA subas esta clave a GitHub):
    STRIPE_SECRET_KEY=sk_live_xxxxxxxx   (o sk_test_xxxx mientras pruebas)
    DOMINIO_SITIO=https://pantojadiegooo.github.io/Iglesia-Cristiana-Dise-ados-a-su-Imagen

Ejecutar:
    python app_donaciones.py
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
DOMINIO_SITIO = os.environ.get("DOMINIO_SITIO", "http://localhost:5500")

app = Flask(__name__)
CORS(app)  # limita esto a tu dominio real en producción, ver nota abajo

MONTOS_PERMITIDOS_MXN = {50, 100, 200, 300, 500, 1000, 2000, 5000}


@app.route("/api/crear-donacion", methods=["POST"])
def crear_donacion():
    datos = request.get_json(silent=True) or {}
    monto_mxn = datos.get("monto_mxn")

    # Validación estricta: nunca confíes en el monto tal cual llega del navegador
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
                    # Stripe usa centavos: $300.00 MXN -> 30000
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
    """
    Opcional pero recomendado: Stripe te notifica aquí cuando el pago se
    completa de verdad (no confíes solo en el redirect del navegador).
    Configura este endpoint en el Dashboard de Stripe > Developers > Webhooks.
    """
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

    try:
        evento = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return jsonify({"error": "Firma inválida"}), 400

    if evento["type"] == "checkout.session.completed":
        sesion = evento["data"]["object"]
        # Aquí puedes: guardar el registro en tu base de datos, enviar un
        # correo/WhatsApp de agradecimiento, etc. sesion["amount_total"] trae
        # el monto en centavos.
        app.logger.info(f"Donación completada: {sesion.get('amount_total')} centavos MXN")

    return jsonify({"received": True})


if __name__ == "__main__":
    # En tu PC-servidor, corre detrás de HTTPS real (ver nota abajo) antes
    # de usarlo con clientes reales — Stripe exige HTTPS para llaves live.
    app.run(host="0.0.0.0", port=5000, debug=False)
