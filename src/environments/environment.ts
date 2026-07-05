export const environment = {
  production: false,
  authApiUrl: 'http://localhost:8081/auth',
  communityApiUrl: 'http://localhost:8084',
  googleClientId: '799389661747-hba38iuhuhhq9g2mg98biegqk0mghquv.apps.googleusercontent.com',
  // Google Maps: pega aquí tu API key (Maps JavaScript API + Geocoding + Places).
  // Restríngela por referrer HTTP en Google Cloud. No es secreta (viaja al navegador),
  // pero conviene no dejarla sin restricción.
  googleMapsApiKey: 'AIzaSyBguT43WycEcrcROW5o90f5wdEenyuHesA',
  // Identidad del tenant — cambiar por comunidad al desplegar.
  // Cuando ms-platform/ms-tenant esté operativo, esto se reemplaza con GET /comunidades/:slug
  communityName: 'Villa Las Flores',
  communitySlug: 'villa-las-flores',
  // Sede vecinal: centro inicial del mapa y punto de retiro de certificados.
  // La dirección es la real; las coordenadas son aproximadas y se refinan por
  // geocodificación (o exactas cuando ms-tenant entregue la sede).
  communitySede: {
    nombre: 'Sede Junta de Vecinos Villa Las Flores',
    direccion: 'Av. Lo Errázuriz 3940, Maipú',
    latitud: -33.4990,
    longitud: -70.7270,
  },
};
