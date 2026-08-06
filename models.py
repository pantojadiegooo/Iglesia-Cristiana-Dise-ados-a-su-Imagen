"""
models.py — Diseñados a su Imagen

Modelos de base de datos para el panel de administración:
- Usuario: cuentas del panel (pastores y líderes de ministerio).
- Contenido: contenido editable del sitio, guardado como JSON por sección.
- SECCIONES: catálogo de qué secciones existen, quién puede editarlas y
  cuál es el valor de ejemplo/plantilla que se usa si aún nadie ha
  guardado nada para esa clave.

app.py importa: db, Usuario, Contenido, SECCIONES
"""

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Usuario(db.Model, UserMixin):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    nombre_visible = db.Column(db.String(120), nullable=False)
    # rol: "pastor" (acceso total, incluida gestión de usuarios) o "lider"
    # (solo puede editar las secciones de su ministerio).
    rol = db.Column(db.String(20), nullable=False, default="lider")
    ministerio = db.Column(db.String(80), nullable=True)
    activo = db.Column(db.Boolean, nullable=False, default=True)
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def puede_editar(self, clave_seccion):
        """Los pastores editan todo. Los líderes solo las secciones cuyo
        'ministerio' (definido en SECCIONES) coincide con el suyo, o las
        secciones sin ministerio asignado (abiertas a cualquier líder)."""
        if self.rol == "pastor":
            return True
        meta = SECCIONES.get(clave_seccion)
        if not meta:
            return False
        ministerio_seccion = meta.get("ministerio")
        return ministerio_seccion is None or ministerio_seccion == self.ministerio

    def __repr__(self):
        return f"<Usuario {self.username} ({self.rol})>"


class Contenido(db.Model):
    __tablename__ = "contenido"

    id = db.Column(db.Integer, primary_key=True)
    clave = db.Column(db.String(80), unique=True, nullable=False, index=True)
    valor_json = db.Column(db.Text, nullable=False, default="{}")
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    actualizado_por = db.Column(db.String(80), nullable=True)

    def __repr__(self):
        return f"<Contenido {self.clave}>"


# ===========================================================================
# Catálogo de secciones editables desde el panel.
#
# "ejemplo" es lo que /api/contenido/<clave> devuelve cuando todavía nadie
# ha guardado nada para esa clave (así el sitio público nunca se rompe).
# "ministerio" limita qué líder puede editar la sección (None = cualquiera).
# ===========================================================================
SECCIONES = {
    "versiculo_dia": {
        "titulo": "Versículo del día",
        "descripcion": "Texto y referencia que aparecen en el inicio.",
        "ministerio": None,
        "ejemplo": {
            "texto": "Todo lo puedo en Cristo que me fortalece.",
            "referencia": "Filipenses 4:13",
        },
    },
    "avisos": {
        "titulo": "Avisos importantes",
        "descripcion": "Lista de tarjetas de avisos que se muestran en el inicio.",
        "ministerio": None,
        "ejemplo": [
            {
                "titulo": "Bienvenido",
                "texto": "Aquí aparecerán los avisos de la iglesia.",
                "vigente_hasta": "",
            }
        ],
    },
    "enlaces_predicas": {
        "titulo": "Prédicas / enlaces de Zoom",
        "descripcion": "Lista de enlaces a prédicas o transmisiones recientes.",
        "ministerio": None,
        "ejemplo": [
            {
                "titulo": "Prédica más reciente",
                "url": "",
                "fecha": "",
            }
        ],
    },
}
