// Build de PRODUCCIÓN (AWS). Se activa por fileReplacements en angular.json.
// Las API son RUTAS RELATIVAS (mismo origen que la página): el navegador llega por
// CloudFront -> nginx, que proxea /api-* al ms-gateway. Al ser mismo origen no hay
// CORS ni "mixed content", y sirve tanto tras nginx (HTTP) como tras CloudFront (HTTPS).
//
// Prefijos distintos por servicio (NO uses uno común): los interceptores distinguen
// las llamadas por prefijo (auth vs tenant/plataforma), así que deben no solaparse.
//   /api-auth       -> ms-auth      (StripPrefix en el gateway -> /auth, /certificados, /contactos)
//   /api-community  -> ms-community (-> /events, /avisos, /agrupaciones, /cuotas, ...)
//   /api-tenant     -> ms-tenant    (-> /platform, /public)
export const environment = {
  production: true,
  authApiUrl: '/api-auth/auth',
  communityApiUrl: '/api-community',
  tenantApiUrl: '/api-tenant',
  googleClientId: '799389661747-hba38iuhuhhq9g2mg98biegqk0mghquv.apps.googleusercontent.com',
  googleMapsApiKey: 'AIzaSyBguT43WycEcrcROW5o90f5wdEenyuHesA',
  // Fallback si ms-tenant no responde; el nombre real se resuelve por slug.
  communityName: 'Villa Las Flores',
  communitySlug: 'villa-las-flores',
  communitySede: {
    nombre: 'Sede Junta de Vecinos Villa Las Flores',
    direccion: 'Av. Lo Errázuriz 3940, Maipú',
    latitud: -33.4990,
    longitud: -70.7270,
  },
};
