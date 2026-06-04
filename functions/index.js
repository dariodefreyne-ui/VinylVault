const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

exports.notifyAdminOnNewUser = onDocumentCreated('users/{uid}', async (event) => {
  const db = getFirestore();
  const data = event.data.data();

  const name = data.displayName || 'Onbekend';
  const email = data.email || 'Geen e-mail';

  const configDoc = await db.collection('config').doc('app').get();
  const adminEmail = configDoc.data()?.adminEmail || 'dario.de.freyne@gmail.com';

  await db.collection('mail').add({
    to: adminEmail,
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

exports.deleteAuthUser = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError('unauthenticated', 'Niet geauthenticeerd');

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (callerDoc.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Geen toegang');

  await getAuth().deleteUser(request.data.uid);
  return { success: true };
});
