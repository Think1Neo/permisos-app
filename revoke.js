const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(require("./service-account.json")),
});

(async () => {
  let count = 0,
    pageToken;
  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    for (const user of result.users) {
      await admin.auth().revokeRefreshTokens(user.uid);
      count++;
    }
    pageToken = result.pageToken;
  } while (pageToken);
  console.log(`✅ ${count} usuarios revocados`);
  process.exit(0);
})();
