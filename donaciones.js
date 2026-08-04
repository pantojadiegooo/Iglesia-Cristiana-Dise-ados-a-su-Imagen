<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Diezmos y Ofrendas | Diseñados a su Imagen</title>
<meta name="description" content="Formas de dar tus diezmos y ofrendas a la Iglesia Cristiana Diseñados a su Imagen en Iztapalapa, CDMX: transferencia, QR o tarjeta.">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
<link rel="stylesheet" href="estilos.css" />
<link rel="stylesheet" href="seguridad.css" />
</head>
<body class="donaciones-body">

  <nav class="nav-conocenos">
    <a href="index.html" class="logo-nav">DISEÑADOS A SU IMAGEN</a>
    <a href="index.html" class="volver"><i class="fas fa-arrow-left"></i> Volver al inicio</a>
  </nav>

  <section class="hero-don">
    <div class="hero-mesh"></div>
    <div class="hero-vignette"></div>
    <canvas id="hero-particulas"></canvas>
    <div class="hero-don-texto">
      <p class="mensaje-comunidad">Siembra con un corazón alegre</p>
      <h1>Diezmos y <span>Ofrendas</span></h1>
      <p class="hero-don-verso">"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre." — 2 Corintios 9:7</p>
    </div>
  </section>

  <section class="page-section">
    <div class="inner">
      <div class="metodos-grid">

        <!-- MÉTODO 1: Transferencia -->
        <div class="metodo-card reveal">
          <h2><i class="fas fa-building-columns"></i> Transferencia</h2>
          <p class="metodo-desc">Copia los datos y transfiere directo desde tu app bancaria.</p>

          <div class="dato-banco">
            <div class="dato-banco-texto">
              <span class="dato-banco-label">Cuenta BBVA</span>
              <span class="dato-banco-valor" id="valor-bbva">2948317593</span>
            </div>
            <button class="btn-copiar" data-copiar="valor-bbva">Copiar</button>
          </div>

          <div class="dato-banco">
            <div class="dato-banco-texto">
              <span class="dato-banco-label">CLABE interbancaria</span>
              <span class="dato-banco-valor" id="valor-clabe">012180029483175933</span>
            </div>
            <button class="btn-copiar" data-copiar="valor-clabe">Copiar</button>
          </div>

          <div class="qr-wrap">
            <!-- TODO: sube tu QR real de CoDi/BBVA a /qr-donaciones.png -->
            <img src="qr-donaciones.png" alt="Código QR para donar por transferencia" data-fallback="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CLABE:012180029483175933">
            <p>Escanea con tu app bancaria (CoDi) para transferir sin escribir los datos a mano.</p>
          </div>
        </div>

        <!-- MÉTODO 2: Tarjeta (Stripe Checkout) -->
        <div class="metodo-card metodo-card--tarjeta reveal">
          <h2><i class="fas fa-credit-card"></i> Tarjeta débito/crédito</h2>
          <p class="metodo-desc">Pago seguro procesado por Stripe. Nosotros nunca vemos ni guardamos tu número de tarjeta.</p>

          <div class="monto-opciones" id="monto-opciones">
            <button class="monto-btn" data-monto="100">$100</button>
            <button class="monto-btn activo" data-monto="300">$300</button>
            <button class="monto-btn" data-monto="500">$500</button>
            <button class="monto-btn" data-monto="1000">$1000</button>
          </div>

          <label class="monto-libre" id="monto-libre-wrap">
            <span>$</span>
            <input type="number" id="monto-libre-input" placeholder="Otro monto (MXN)" min="10" step="1" inputmode="numeric">
          </label>

          <button class="btn-stripe" id="btn-donar-stripe">
            <i class="fas fa-lock"></i> Donar $300 MXN
          </button>
          <p class="stripe-msg" id="stripe-msg"></p>
        </div>

      </div>

      <div class="transparencia reveal">
        <strong>Transparencia:</strong> el 100% de tus diezmos y ofrendas se destina al sostenimiento de la iglesia, sus ministerios (Hijas del Rey, Jóvenes, Reunión de Varones) y proyectos de ayuda a la comunidad de Iztapalapa.
      </div>

      <p class="versiculo-siembra reveal">
        "Traed todos los diezmos al alfolí y haya alimento en mi casa; y probadme ahora en esto, dice Jehová de los ejércitos, si no os abriré las ventanas de los cielos, y derramaré sobre vosotros bendición hasta que sobreabunde."
        <span>— Malaquías 3:10</span>
      </p>
    </div>
  </section>

  <div class="footer-mini">© 2026 Diseñados a su Imagen – Todos los Derechos Reservados.</div>


  <script src="imagenes-fallback.js" defer></script>
  <script src="particulas.js" defer></script>
  <script src="donaciones.js" defer></script>
  <script src="animaciones.js" defer></script>
</body>
</html>
