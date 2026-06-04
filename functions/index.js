const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

exports.notifyAdminOnNewUser = onDocumentCreated('users/{uid}', async (event) => {
  const db = getFirestore();
  const data = event.data.data();

  const name = data.displayName || 'Onbekend';
  const email = data.email || 'Geen e-mail';

  await db.collection('mail').add({
    to: 'dario.de.freyne@gmail.com',
    message: {
      subject: 'VinylVault — Nieuwe gebruiker wacht op activatie',
      html: `
        <p>Nieuwe gebruiker geregistreerd:</p>
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p>Log in als admin om de rol toe te wijzen.</p>
      `,
    },
  });
});
