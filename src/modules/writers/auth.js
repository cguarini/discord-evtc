const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];


let authToken = null;

async function getAuthToken() {

  if(authToken === null) {

    const auth = new GoogleAuth({
      scopes: SCOPES
    });
    authToken = await auth.getClient();
  }
  return authToken;
}


module.exports = {
  getAuthToken,
}