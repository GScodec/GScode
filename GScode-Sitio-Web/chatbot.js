/* Asistente automático GScode. Sin API, cookies ni almacenamiento. */
(() => {
  'use strict';
  const PHONE = '527443768542';
  const root = document.createElement('div');
  root.id = 'gs-chat';
  root.innerHTML = `
    <button class="gs-launch" type="button" aria-expanded="false" aria-controls="gs-panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H5l-4 3 1.7-6A8 8 0 1 1 20 11Z"/><path d="M7 10h8M7 14h5"/></svg><span>¿Te ayudamos?</span></button>
    <section id="gs-panel" class="gs-panel" role="dialog" aria-label="Asistente automático GScode" hidden>
      <header class="gs-head"><span class="gs-avatar" aria-hidden="true">GS</span><div><strong>Asistente GScode</strong><small><i></i> Respuestas automáticas</small></div><button class="gs-close" type="button" aria-label="Cerrar chat">×</button></header>
      <div class="gs-intro">Computadoras y páginas web · Acapulco</div>
      <div class="gs-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación"></div>
      <div class="gs-actions" aria-label="Opciones de respuesta"></div>
      <div class="gs-tools"><button type="button" data-tool="menu">Menú principal</button><button type="button" data-tool="reset">Borrar chat</button></div>
      <form class="gs-form"><label class="gs-sr" for="gs-message">Escribe tu mensaje</label><input id="gs-message" autocomplete="off" maxlength="1000" placeholder="Escribe tu pregunta…" required><button type="submit" aria-label="Enviar mensaje">↑</button></form>
      <p class="gs-note">Sin envíos automáticos. Tú confirmas en WhatsApp.</p>
    </section>`;
  document.body.append(root);
  const panel = root.querySelector('.gs-panel');
  const launch = root.querySelector('.gs-launch');
  const log = root.querySelector('.gs-log');
  const actions = root.querySelector('.gs-actions');
  const input = root.querySelector('input');
  const close = root.querySelector('.gs-close');
  let stage = null;
  let quote = {};
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const scroll = () => { log.scrollTop = log.scrollHeight; };
  const message = (text, user = false) => {
    const el = document.createElement('p');
    el.className = user ? 'gs-msg gs-user' : 'gs-msg gs-bot';
    el.textContent = text;
    log.append(el);
    // Keep the widget lightweight during long sessions.
    while (log.children.length > 60) log.firstElementChild.remove();
    scroll();
  };
  const choices = items => {
    actions.replaceChildren();
    items.forEach(([label, callback]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => { message(label, true); callback(); });
      actions.append(b);
    });
    // Options change the log height; scroll after the browser applies that layout.
    requestAnimationFrame(scroll);
  };
  const whatsapp = text => {
    const a = document.createElement('a');
    a.className = 'gs-wa'; a.textContent = 'Continuar en WhatsApp ↗';
    a.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer'; actions.prepend(a);
    requestAnimationFrame(scroll);
  };
  // Solo datos confirmados del negocio; los campos desconocidos no se completan.
  const business = {
    name: 'GScode', phone: PHONE, location: 'Acapulco, Guerrero',
    website: null, hours: null, email: null
  };
  const greeting = '¡Hola! 👋 Bienvenido a GScode. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?';
  const homeChoices = () => choices([
    ['Ayuda con mi computadora', () => begin('computer')],
    ['Necesito una página web', () => begin('web')],
    ['Solicitar presupuesto', startQuote],
    ['Preguntas frecuentes', faq],
    ['Hablar con el equipo', contact]
  ]);
  const home = () => {
    stage = null; quote = {}; input.value = ''; input.maxLength = 1000;
    input.placeholder = 'Cuéntame qué necesitas…';
    message('Claro, empecemos de nuevo. ¿En qué podemos ayudarte?'); homeChoices();
  };
  const ask = (next, question, options = [], placeholder = 'Escribe tu respuesta…') => {
    stage = next; input.maxLength = next === 'name' ? 80 : 1000;
    input.placeholder = placeholder; message(question);
    choices(options.map(label => [label, () => accept(label)]));
  };
  const questionFor = () => {
    switch (stage) {
      case 'category': return '¿Necesitas ayuda con una computadora o con una página web?';
      case 'device': return '¿Qué tipo de equipo utilizas?';
      case 'details': return quote.category === 'web' ? '¿Qué te gustaría lograr con tu página web?' : '¿Qué problema presenta tu equipo o qué te gustaría mejorar?';
      case 'existing': return '¿Ya tienes una página web o comenzarías desde cero?';
      case 'mode': return '¿Cómo prefieres recibir atención?';
      case 'name': return '¿Con qué nombre te gustaría presentar la solicitud? Es opcional.';
      default: return '';
    }
  };
  function startQuote() {
    if (quote.details && quote.service) { askMode(); return; }
    ask('category', 'Con gusto. Para orientarte antes de preparar el presupuesto, ¿necesitas ayuda con una computadora o con una página web?', ['Computadora', 'Página web', 'Otra consulta']);
  }
  function begin(category, details = '') {
    quote = {category, details};
    if (category === 'computer') ask('device', 'Te ayudo a encontrar el servicio adecuado. ¿Qué tipo de equipo utilizas?', ['Laptop', 'Computadora de escritorio', 'Otro / no estoy seguro']);
    else if (category === 'web') {
      if (details) askExisting();
      else ask('details', 'Creamos páginas empresariales, landing pages y ofrecemos rediseño y mantenimiento web. ¿Qué te gustaría lograr con tu página?', ['Presentar mi negocio', 'Recibir solicitudes de clientes', 'Mejorar mi sitio actual', 'Necesito orientación']);
    } else {
      quote.category = 'other'; ask('details', 'Cuéntame brevemente qué necesitas para que el equipo pueda orientarte.');
    }
  }
  const askExisting = () => ask('existing', questionForExisting, ['Comenzar desde cero', 'Ya tengo una página', 'No estoy seguro']);
  const questionForExisting = '¿Ya tienes una página web o comenzarías desde cero?';
  const askMode = () => ask('mode', '¿Cómo prefieres recibir atención? El equipo confirmará la modalidad según tu caso.', ['Local en Acapulco', 'A distancia / en línea', 'Que el equipo me oriente']);
  const askName = () => ask('name', 'La solicitud se enviará solo si tú la confirmas en WhatsApp. ¿Con qué nombre te gustaría presentarla? Es opcional.', ['Continuar sin nombre'], 'Tu nombre (opcional)…');
  const requestText = (human = false) => {
    const lines = [quote.name ? `Hola, soy ${quote.name}.` : 'Hola, vengo del sitio de GScode.', human ? 'Me gustaría consultar con una persona del equipo.' : 'Me gustaría solicitar un presupuesto.'];
    for (const [key, label] of [['service','Servicio sugerido'],['device','Equipo'],['details','Necesidad'],['existing','Situación del sitio'],['mode','Modalidad solicitada']]) {
      if (quote[key]) lines.push(`${label}: ${quote[key]}`);
    }
    lines.push('Solicitud preparada desde el asistente virtual de GScode.');
    return lines.join('\n\n');
  };
  function contact() {
    message('Con gusto. Puedes hablar con el equipo al 744 376 8542. Revisa el mensaje en WhatsApp y envíalo cuando quieras; todavía no hemos enviado nada.');
    choices(stage ? [['Continuar aquí', resume], ['Empezar de nuevo', home]] : [['Ver servicios', home]]);
    whatsapp(requestText(true));
  }
  const summary = () => {
    stage = 'summary'; input.maxLength = 1000; input.placeholder = '¿Quieres cambiar algo?';
    message(`Así quedaría tu solicitud:\n\n${requestText().replace('\n\nSolicitud preparada desde el asistente virtual de GScode.', '')}\n\nAún no se ha enviado. El equipo confirmará el precio, la disponibilidad y los tiempos; no se ha reservado ni contratado ningún servicio.`);
    choices([['Editar detalles', () => ask('edit', '¿Qué detalles quieres incluir en la solicitud?')], ['Cambiar modalidad', askMode], ['Cambiar nombre', askName], ['Empezar de nuevo', home]]);
    whatsapp(requestText());
  };
  const recommend = () => {
    stage = 'recommend'; input.maxLength = 1000; input.placeholder = 'Escribe una duda…';
    const t = normalize(quote.details || '');
    let explanation;
    if (quote.category === 'web') {
      quote.service = quote.existing === 'Ya tengo una página' ? 'Rediseño / mantenimiento web' : 'Desarrollo de página web';
      if (/tienda|pago|carrito|reserva|sistema|integracion/.test(t)) {
        explanation = 'Para esas funciones, el equipo necesita revisar el alcance y confirmar qué puede incluir en tu proyecto. Podemos preparar la consulta con lo que nos contaste.';
      } else explanation = quote.existing === 'Ya tengo una página' ? 'Podemos valorar un rediseño o mantenimiento para mejorar tu sitio según el objetivo que nos contaste.' : 'Una página empresarial o una landing page podría ayudarte con ese objetivo. El equipo te propondrá el alcance adecuado y un diseño adaptable a celulares.';
    } else if (quote.category === 'computer') {
      if (/lent|rendimiento|ssd|memoria|\bram\b/.test(t)) {
        quote.service = 'Revisión de rendimiento'; explanation = 'Por lo que nos cuentas, conviene revisar el rendimiento del equipo. Según el diagnóstico, se valoraría una optimización o una mejora de SSD o RAM; primero se confirma si la necesita y si es compatible.';
      } else if (/limpieza|mantenimiento|polvo|calienta/.test(t)) {
        quote.service = 'Revisión y mantenimiento'; explanation = 'Podemos valorar una revisión y mantenimiento del equipo. El técnico confirmará qué trabajo necesita antes de realizarlo.';
      } else if (/instalar|programa|software/.test(t)) {
        quote.service = 'Asistencia con programas'; explanation = 'Podemos revisar la instalación o el problema del programa y confirmar compatibilidad y requisitos. Si se puede resolver a distancia, el equipo te lo indicará.';
      } else {
        quote.service = 'Diagnóstico de computadora'; explanation = 'El siguiente paso sería un diagnóstico para identificar la causa de la falla. Con esa revisión, el equipo podrá indicarte las opciones y el costo.';
      }
    } else {
      quote.service = 'Consulta por confirmar'; explanation = 'Para esa necesidad, lo mejor es consultar con el equipo y confirmar si podemos ayudarte.';
    }
    message(explanation);
    choices([['Preparar solicitud', askMode], ['Tengo más detalles', () => ask('edit', '¿Qué otros detalles quieres incluir?')], ['Hablar con el equipo', contact]]);
  };
  const answers = {
    cost: 'No tengo una tarifa confirmada para tu caso. El precio depende del diagnóstico o del alcance del proyecto. El equipo te lo confirmará antes de comenzar.',
    hours: 'No tengo un horario de atención confirmado. Puedes consultarlo por WhatsApp antes de acudir o solicitar una cita.',
    location: 'Atendemos en Acapulco, Guerrero, y ofrecemos soporte remoto según el caso. Confirma por WhatsApp el punto de atención antes de trasladarte.',
    time: 'El plazo depende de la revisión, las piezas necesarias o el alcance de la página. El equipo debe confirmar disponibilidad y fecha de entrega.',
    payment: 'Las formas de pago, anticipos, facturación y garantía deben confirmarse con el equipo para tu servicio. Puedo ayudarte a consultar por WhatsApp.',
    remote: 'Sí, ofrecemos soporte remoto para problemas que puedan resolverse a distancia. Primero revisamos tu caso para confirmar si esta modalidad es adecuada.',
    mobile: 'Sí, diseñamos páginas adaptables a celulares, tabletas y computadoras.',
    identity: 'Soy el asistente virtual de GScode. Respondo con información y opciones preparadas por el negocio. Si necesitas atención personal, puedo ayudarte a contactar al equipo.',
    booking: 'Puedo ayudarte a solicitar una cita o un servicio por WhatsApp. La reserva o contratación solo queda confirmada cuando el equipo te lo indique.',
    url: 'Puedes consultar nuestros servicios en esta página. No tengo otro enlace oficial ni correo confirmado; nuestro contacto es WhatsApp: 744 376 8542.'
  };
  const answer = key => {
    message(answers[key]);
    if (stage) choices([['Continuar mi solicitud', resume], ['Hablar con el equipo', contact]]);
    else choices([['Solicitar presupuesto', startQuote], ['Hablar con el equipo', contact], ['Más preguntas', faq]]);
  };
  function faq() {
    message('Estas son algunas consultas frecuentes. ¿Cuál te interesa?');
    choices([['Precios', () => answer('cost')], ['Horarios', () => answer('hours')], ['Ubicación', () => answer('location')], ['Soporte remoto', () => answer('remote')], ['Tiempos de entrega', () => answer('time')], ['Pagos y garantía', () => answer('payment')]]);
  }
  function resume() {
    if (stage === 'summary') { summary(); return; }
    if (stage === 'recommend') { recommend(); return; }
    const prompts = {category:['Computadora','Página web','Otra consulta'],device:['Laptop','Computadora de escritorio','Otro / no estoy seguro'],existing:['Comenzar desde cero','Ya tengo una página','No estoy seguro'],mode:['Local en Acapulco','A distancia / en línea','Que el equipo me oriente'],name:['Continuar sin nombre']};
    if (stage) ask(stage, questionFor() || '¿Qué detalles quieres incluir?', prompts[stage] || []);
    else homeChoices();
  }
  function accept(clean) {
    if (stage === 'category') {
      const t = normalize(clean);
      if (/web|pagina|sitio/.test(t)) begin('web');
      else if (/comput|laptop|\bpc\b/.test(t)) begin('computer');
      else begin('other');
    } else if (stage === 'device') {
      quote.device = clean;
      if (quote.details) recommend();
      else ask('details', '¿Qué problema presenta tu equipo o qué te gustaría mejorar?', [], 'Describe brevemente el problema…');
    } else if (stage === 'details' || stage === 'edit') {
      const editing = stage === 'edit'; quote.details = clean;
      if (quote.category === 'web' && !quote.existing) askExisting();
      else if (editing && quote.mode) { recommend(); /* Reevaluate after a changed need. */ }
      else recommend();
    } else if (stage === 'existing') { quote.existing = clean; recommend(); }
    else if (stage === 'mode') { quote.mode = clean; askName(); }
    else if (stage === 'name') { quote.name = /^(continuar sin nombre|omitir|no|prefiero no)$/i.test(clean) ? '' : clean.slice(0,80); summary(); }
  }
  const submitText = text => {
    const clean = text.trim(); if (!clean) return;
    message(clean, true); const t = normalize(clean);
    // Global requests are handled before fields, so questions never become a name or a symptom.
    if (/^(cancelar|cancela|menu|inicio|empezar de nuevo|reiniciar)[.! ]*$/.test(t)) { home(); return; }
    if (/^(gracias|muchas gracias|no gracias|eso es todo)[.! ]*$/.test(t)) { message('Con gusto. Si necesitas algo más, aquí puedes consultarlo.'); if (stage) choices([['Continuar mi solicitud',resume],['Terminar',home]]); else homeChoices(); return; }
    if (/^(hola|buenos dias|buenas tardes|buenas noches|buenas)[.! ]*$/.test(t)) { message('¡Hola! Con gusto te ayudo.'); if (stage) resume(); else homeChoices(); return; }
    if (/whatsapp|hablar (con|a)|asesor|atencion (personal|humana)|\bhumano\b|telefono|contactar/.test(t)) { contact(); return; }
    if (/eres (un robot|una persona|humano|ia)|quien eres|inteligencia artificial/.test(t)) { answer('identity'); return; }
    if (/horario|a que hora|abren|cierran/.test(t)) { answer('hours'); return; }
    if (/precio|costo|cuesta|cobran|promocion|descuento|gratis/.test(t)) { answer('cost'); return; }
    if (/donde (estan|atienden|se ubican)|direccion|ubicacion|a domicilio/.test(t)) { answer('location'); return; }
    if (/cuanto tarda|cuanto tiempo|plazo|fecha de entrega/.test(t)) { answer('time'); return; }
    if (/forma[s]? de pago|puedo pagar|factura|garantia|anticipo/.test(t)) { answer('payment'); return; }
    if (/correo|email|enlace oficial|url/.test(t)) { answer('url'); return; }
    if (/agendar|reservar|reserva|comprar|contratar|\bcita\b/.test(t) && !['details','edit'].includes(stage)) { answer('booking'); return; }
    if (/(ofrecen|tienen|dan|hacen).*soporte remoto/.test(t)) { answer('remote'); return; }
    if (/pagina.*(se ve|vera|adapt|funcion).*celular|responsiv/.test(t)) { answer('mobile'); return; }
    if (/cotiz|presupuesto/.test(t) || (stage === 'recommend' && /^(si|adelante|me interesa|de acuerdo|ok)[.! ]*$/.test(t))) { startQuote(); return; }
    if (['category','device','details','existing','mode','name','edit'].includes(stage)) { accept(clean); return; }
    if (/web|pagina|landing|sitio|dominio/.test(t)) { begin('web', clean.length > 25 ? clean : ''); return; }
    if (/comput|laptop|\bpc\b|lenta?|repar|manten|programa|ssd|\bram\b|enciende|pantalla|virus|formate/.test(t)) { begin('computer', clean); return; }
    message('No tengo información suficiente para resolver esa consulta. Podemos revisarla con una persona del equipo.');
    choices([['Hablar con el equipo', contact], ...(stage ? [['Continuar mi solicitud',resume]] : [['Ver servicios',home]])]);
  };
  const setOpen = open => {
    panel.hidden = !open; launch.setAttribute('aria-expanded', String(open));
    launch.setAttribute('aria-label', open ? 'Cerrar asistente GScode' : 'Abrir asistente GScode');
    if (open) { close.focus(); scroll(); } else launch.focus();
  };
  launch.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); setOpen(false); }
  });
  root.querySelector('form').addEventListener('submit', e => {
    e.preventDefault(); const text = input.value.slice(0,input.maxLength); input.value = ''; submitText(text);
  });
  root.querySelector('[data-tool="menu"]').addEventListener('click', home);
  const reset = () => {
    log.replaceChildren(); stage = null; quote = {}; input.value = ''; input.maxLength = 1000; input.placeholder = 'Escribe tu pregunta…';
    message(greeting); homeChoices();
  };
  root.querySelector('[data-tool="reset"]').addEventListener('click', reset);
  reset();
  // Preserve the original WhatsApp button as a fallback if JavaScript is disabled.
  const fallback = document.querySelector('.floating-whatsapp');
  if (fallback) fallback.style.display = 'none';
})();
