export const environment = {
  production: false,
  authApiUrl: 'http://localhost:8081/auth',
  communityApiUrl: 'http://localhost:8084',
  googleClientId: '799389661747-hba38iuhuhhq9g2mg98biegqk0mghquv.apps.googleusercontent.com',
  // Identidad del tenant — cambiar por comunidad al desplegar.
  // Cuando ms-platform esté operativo, esto se reemplaza con GET /platform/comunidades/:slug
  communityName: 'Villa Las Flores',
  communitySlug: 'villa-las-flores',
};
