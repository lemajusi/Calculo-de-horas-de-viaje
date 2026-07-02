# 🚗 Calendar Travel Blocker

> Automatización con Google Apps Script que calcula el tiempo de viaje para tus eventos de Google Calendar y crea bloques de traslado automáticamente.

---

## ¿Qué problema resuelve?

Cuando agendas una reunión o evento con ubicación, normalmente tenés que calcular manualmente a qué hora salir y bloquear ese tiempo en tu calendario. Este script lo hace solo: detecta el evento, consulta Google Maps con el tráfico real para esa hora, y crea un bloque de viaje pegado al evento — tanto de ida como de vuelta.

---

## Demo

```
Lunes 26

  9:45am  🚗 Viaje → Reunión con cliente      ← creado automáticamente (15 min)
 10:00am  📅 Reunión con cliente
          📍 Florida 1280, Montevideo
 11:00am  🏠 Regreso ← Reunión con cliente     ← creado automáticamente (18 min)
```

---

## Flujo

```
Nuevo evento con lugar
en calendario "Viajes con destino"
         │
         ▼
  Apps Script trigger
  (se ejecuta cada hora)
         │
         ▼
  Lee lugar + hora del evento
         │
         ▼
  Google Maps Directions API
  (tráfico para la hora real del viaje)
         │
         ▼
  🚗 Bloque de ida    →    📅 Evento    →    🏠 Bloque de vuelta
  (en "Bloques de viaje")
```
---

## Features

- ⏱️ **Tráfico en tiempo real** para la hora exacta del viaje, no para ahora
- 📅 **Ida y vuelta** — crea ambos bloques automáticamente
- 🗂️ **Calendarios separados** — no ensucia tu calendario principal
- 🔁 **Trigger automático** — se ejecuta cada hora sin intervención
- 🚫 **Anti-duplicados** — detecta si ya existe un bloque para ese evento
- ⚙️ **Configurable** — origen, buffer de minutos, colores, calendarios

---

## Requisitos

- Cuenta de Google
- [Google Maps Directions API](https://developers.google.com/maps/documentation/directions) habilitada
- Facturación activa en Google Cloud (el tier gratuito cubre uso personal ampliamente)

---

## Instalación

### 1. Clonar / copiar el script

Abre [script.google.com](https://script.google.com), crea un nuevo proyecto y pega el contenido de `Código.gs`.

### 2. Obtener API Key de Google Maps

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo
3. Habilita la **Directions API** en *APIs & Services → Library*
4. Ve a *Credentials → Create API Key*
5. En la key, asegúrate que *API restrictions* incluya **Directions API**
6. Activa facturación en el proyecto (necesario para usar la API)

> 💡 Google otorga **$300 USD/mes gratis**. Este script hace ~2 llamadas por evento, por lo que el costo real para uso personal es $0.

### 3. Crear los calendarios en Google Calendar

Crea dos calendarios con estos nombres exactos (o los que configures en el paso siguiente):

- `Viajes con destino` — donde vas a crear tus eventos con lugar
- `Bloques de viaje` — donde el script creará los bloques automáticos

### 4. Configurar el script

Edita el bloque `CONFIG` al inicio de `Código.gs`:

```javascript
const CONFIG = {
  SOURCE_CALENDAR_NAME: "Viajes con destino",   // Donde creas tus eventos
  TRAVEL_CALENDAR_NAME: "Bloques de viaje",      // Donde se crean los bloques
  DEFAULT_ORIGIN: "Tu dirección de origen",      // Tu casa u oficina
  MAPS_API_KEY: "TU_API_KEY_AQUI",
  ADD_RETURN_TRIP: true,                         // false para solo ida
  BUFFER_MINUTES: 5,                             // Minutos extra de margen
};
```

### 5. Activar el trigger

En el editor de Apps Script, ejecuta la función `crearTrigger()` una sola vez. Esto configura la automatización para que corra cada hora.

Cuando Google pida permisos, aceptá todo (es tu propio script en tu propia cuenta).

---

## Uso

1. Abre Google Calendar y ve al calendario **"Viajes con destino"**
2. Crea un evento con **lugar definido** (dirección completa para mejores resultados)
3. En menos de una hora, aparecerán los bloques en **"Bloques de viaje"**
4. También podés ejecutar `procesarNuevosEventos()` manualmente para no esperar

---

## Estructura del proyecto

```
calendar-travel-blocker/
└── Código.gs       # Script principal (todo en un archivo)
```

---

## Zona horaria

El script usa la zona horaria configurada en Apps Script. Para verificar o cambiar:

*Apps Script → ⚙️ Configuración del proyecto → Time zone*

Debe coincidir con tu zona horaria local (ej: `America/Montevideo`).

---

## Roadmap

- [ ] Origen dinámico basado en el evento anterior del día
- [ ] Recalcular automáticamente si se edita o mueve el evento
- [ ] Soporte para transporte público y caminata
- [ ] Notificación por email o push con el resumen del viaje
- [ ] Interfaz web para configurar el origen sin tocar el código

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Google Apps Script | Runtime y automatización |
| Google Calendar API | Leer y crear eventos |
| Google Maps Directions API | Calcular tiempo de viaje con tráfico |

---

## Licencia

MIT — libre para usar, modificar y distribuir.
