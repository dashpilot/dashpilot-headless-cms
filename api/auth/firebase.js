import jwt from 'jsonwebtoken';
import fetch from "node-fetch";

async function getKeys() {
  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  const publicKeys = await response.json();
  return publicKeys;
}

const verifyToken = async function(idToken) {
  const publicKeys = await getKeys()
  const header64 = idToken.split('.')[0];
  const header = JSON.parse(Buffer.from(header64, 'base64').toString('ascii'));
  var userid = false;
  jwt.verify(idToken, publicKeys[header.kid], {
    algorithms: ['RS256']
  }, function(err, decoded) {
    if (err) {
      throw 'Invalid token';
    } else {
      userid = decoded.sub;
    }
  });

  return userid;
}

export default verifyToken;