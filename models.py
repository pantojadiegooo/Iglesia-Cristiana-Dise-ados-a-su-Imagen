from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# Instancia global que usa app.py
db = SQLAlchemy()

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    nombre_visible = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    rol = db.Column(db.String(20), default="lider")
    ministerio = db.Column(db.String(120), nullable=True)
    activo = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def puede_editar(self, clave):
        # Lógica por defecto: pastors pueden todo; líderes pueden todo por ahora
        if self.rol == "pastor":
            return True
        # Ajusta esta lógica según ministerio/clave en el futuro
        return True

class Contenido(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    clave = db.Column(db.String(80), unique=True, nullable=False)
    valor_json = db.Column(db.Text, nullable=False)
    actualizado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_por = db.Column(db.String(120), nullable=True)

# Ejemplo mínimo de SECCIONES para que la app no falle al arrancar.
SECCIONES = {
    "inicio": {"ejemplo": {"titulo": "Título de ejemplo", "contenido": "Texto de ejemplo"}},
    "donaciones": {"ejemplo": {"mensaje": "Gracias por donar"}},
}
