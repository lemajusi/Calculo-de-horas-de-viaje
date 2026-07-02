const CONFIG = {
  SOURCE_CALENDAR_NAME: "Viajes con destino", //si no los tienes en tu calendadio crea un nuevo con este nombre -Otros calendarios -> Crear calendario
  TRAVEL_CALENDAR_NAME: "Bloques de viaje", //si no los tienes en tu calendadio crea un nuevo con este nombre -Otros calendarios -> Crear calendario
  DEFAULT_ORIGIN: "xxxxxxxxxx", // Direccion de origen default
  MAPS_API_KEY: "xxxxxxxx", // -> la de Direction API
  ADD_RETURN_TRIP: false,
  TRAVEL_EVENT_COLOR: CalendarApp.EventColor.GREEN,
  MARGEN_CONSULTA_MINUTOS: 60,
  TRANSIT_PREFERENCE: "less_walking", // "fewer_transfers" o "less_walking" 
  TRANSIT_MODE: "bus",
};

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================
function procesarNuevosEventos() {
  const sourceCalendar = getCalendarByName(CONFIG.SOURCE_CALENDAR_NAME);
  const travelCalendar = getCalendarByName(CONFIG.TRAVEL_CALENDAR_NAME);

  if (!sourceCalendar) {
    console.error(
      `❌ No se encontró el calendario: "${CONFIG.SOURCE_CALENDAR_NAME}"`,
    );
    return;
  }
  if (!travelCalendar) {
    console.error(
      `❌ No se encontró el calendario: "${CONFIG.TRAVEL_CALENDAR_NAME}"`,
    );
    return;
  }

  const ahora = new Date();
  const en30Dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
  const eventos = sourceCalendar.getEvents(ahora, en30Dias);

  console.log(
    `📅 Encontrados ${eventos.length} eventos en "${CONFIG.SOURCE_CALENDAR_NAME}"`,
  );
  eventos.forEach((evento) => procesarEvento(evento, travelCalendar));
}

function procesarEvento(evento, travelCalendar) {
  const titulo = evento.getTitle();
  const lugar = evento.getLocation();
  const inicio = evento.getStartTime();
  const fin = evento.getEndTime();

  if (!lugar || lugar.trim() === "") {
    console.log(`⏭️ Sin lugar: "${titulo}" — omitiendo`);
    return;
  }
  const descripcion = evento.getDescription() || "";
  const matchOrigen = descripcion.match(/rigen:\s*(.+)/i);
  const origen = matchOrigen ? matchOrigen[1].trim() : CONFIG.DEFAULT_ORIGIN;

  const travelEventTitle = `🚌 Viaje → ${titulo}`;
  const ventanaPrevia = new Date(inicio.getTime() - 3 * 60 * 60 * 1000);
  const existentes = travelCalendar.getEvents(ventanaPrevia, inicio);
  const yaExiste = existentes.some((e) => e.getTitle() === travelEventTitle);

  if (yaExiste) {
    console.log(`✅ Ya existe bloque de viaje para: "${titulo}"`);
    return;
  }

  console.log(`🗺️ Calculando viaje para: "${titulo}" en "${lugar}"`);

  const resultado = calcularTiempoViaje(origen, lugar, inicio);

  if (resultado === null) {
    console.error(`❌ No se pudo calcular la ruta hacia: "${lugar}"`);
    return;
  }

  const { duracionMinutos, lineas } = resultado;
  const resumenLineas =
    lineas.length > 0 ? lineas.join("\n") : "Sin información de líneas";

  console.log(`⏱️ Tiempo estimado: ${duracionMinutos} minutos`);

  const salidaIda = new Date(inicio.getTime() - duracionMinutos * 60 * 1000);
  const llegadaIda = new Date(inicio.getTime());

  const eventoIda = travelCalendar.createEvent(
    travelEventTitle,
    salidaIda,
    llegadaIda,
    {
      description: `🗺️ Origen: ${origen}\n📍 Destino: ${lugar}\n⏱️ Duración estimada: ${duracionMinutos} min\n🚌 Transporte público\n\n🗂️ Cómo ir:\n${resumenLineas}\n\n📅 Evento: ${titulo}\n🕐 Inicio evento: ${formatearHora(inicio)}`,
      location: lugar,
    },
  );
  eventoIda.setColor(CONFIG.TRAVEL_EVENT_COLOR);

  console.log(
    `✅ Bloque IDA: ${formatearHora(salidaIda)} → ${formatearHora(llegadaIda)}`,
  );

  if (CONFIG.ADD_RETURN_TRIP) {
    const resultadoVuelta = calcularTiempoViaje(
      lugar,
      CONFIG.DEFAULT_ORIGIN,
      fin,
    );
    const duracionVuelta = resultadoVuelta
      ? resultadoVuelta.duracionMinutos
      : duracionMinutos;
    const resumenLineasVuelta =
      resultadoVuelta && resultadoVuelta.lineas.length > 0
        ? resultadoVuelta.lineas.join("\n")
        : "Sin información de líneas";

    const salidaVuelta = new Date(fin.getTime());
    const llegadaVuelta = new Date(fin.getTime() + duracionVuelta * 60 * 1000);

    const travelReturnTitle = `🏠 Regreso ← ${titulo}`;
    const eventoVuelta = travelCalendar.createEvent(
      travelReturnTitle,
      salidaVuelta,
      llegadaVuelta,
      {
        description: `🗺️ Origen: ${lugar}\n📍 Destino: ${CONFIG.DEFAULT_ORIGIN}\n⏱️ Duración estimada: ${duracionVuelta} min\n🚌 Transporte público\n\n🗂️ Cómo ir:\n${resumenLineasVuelta}\n\n📅 Evento: ${titulo}\n🕐 Fin evento: ${formatearHora(fin)}`,
        location: CONFIG.DEFAULT_ORIGIN,
      },
    );
    eventoVuelta.setColor(CalendarApp.EventColor.GREEN);

    console.log(
      `✅ Bloque VUELTA: ${formatearHora(salidaVuelta)} → ${formatearHora(llegadaVuelta)}`,
    );
  }
}

// ============================================================
// GOOGLE MAPS: Transporte público + hora real del evento
// ============================================================
function calcularTiempoViaje(origen, destino, horaLlegada) {
  const margenSalidaMs = CONFIG.MARGEN_CONSULTA_MINUTOS * 60 * 1000;
  const horaSalidaEstimada = new Date(horaLlegada.getTime() - margenSalidaMs);
  const departureTimestamp = Math.floor(horaSalidaEstimada.getTime() / 1000);

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${encodeURIComponent(origen)}` +
    `&destination=${encodeURIComponent(destino)}` +
    `&mode=transit` +
    `&departure_time=${departureTimestamp}` +
    (CONFIG.TRANSIT_PREFERENCE
      ? `&transit_routing_preference=${CONFIG.TRANSIT_PREFERENCE}`
      : "") +
    (CONFIG.TRANSIT_MODE ? `&transit_mode=${CONFIG.TRANSIT_MODE}` : "") +
    `&key=${CONFIG.MAPS_API_KEY}`;

  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.error(`Maps API error: ${data.status}`);
      return null;
    }

    const leg = data.routes[0].legs[0];
    const duracionMinutos = Math.ceil(leg.duration.value / 60);

    const lineas = leg.steps
      .filter((step) => step.travel_mode === "TRANSIT")
      .map((step) => {
        const t = step.transit_details;
        const tipo = t.line.vehicle.name;
        const linea = t.line.short_name || t.line.name;
        const desde = t.departure_stop.name;
        const hasta = t.arrival_stop.name;
        const paradas = t.num_stops;
        return `${tipo} ${linea}: ${desde} → ${hasta} (${paradas} paradas)`;
      });

    return { duracionMinutos, lineas };
  } catch (e) {
    console.error(`Error llamando Maps API: ${e.message}`);
    return null;
  }
}

function getCalendarByName(name) {
  const calendars = CalendarApp.getAllCalendars();
  return calendars.find((cal) => cal.getName() === name) || null;
}

function formatearHora(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM HH:mm");
}

// ============================================================
// TRIGGER
// ============================================================
function crearTrigger() {
  const hora = 1; // Cambiar el valor para indicar cada cuantas horas se ejecuta el trigger
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("procesarNuevosEventos")
    .timeBased()
    .everyHours(hora) 
    .create();
  console.log(`✅ Trigger creado: se ejecutará cada ${lugar} horas`);
}
