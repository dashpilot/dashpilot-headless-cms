var firebaseConfig = {
  apiKey: "AIzaSyDS4TxNhPNXEGdVFLzGhVAo4yriJ5Ws3ww",
  authDomain: "dashpilot-c0247.firebaseapp.com",
  projectId: "dashpilot-c0247"
};
firebase.initializeApp(firebaseConfig);

var provider = new firebase.auth.GoogleAuthProvider();

function login() {

  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      var credential = result.credential;

      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = credential.accessToken;

      // The signed-in user info.
      var user = result.user;
      console.log('Signed in');

    }).catch((error) => {
      console.log(error);
    });

}

const getData = async function(service, path) {
  let opts = {};
  opts.path = path;
  call_api(service + '/get-data', opts).then(function(res) {
    return res;
  });
}

async function call_api(route, mydata) {

  try {
    const idToken = await firebase.auth().currentUser.getIdToken(true);

    var settings = {
      method: 'post',
      body: JSON.stringify(mydata),
      headers: {
        'Authorization': idToken,
        'Content-Type': 'application/json'
      }
    };
    try {
      const fetchResponse = await fetch('/api/' + route, settings);
      const result = await fetchResponse.json();
      return result;
    } catch (e) {
      return e;
    }

  } catch (e) {
    console.log("Not signed in");
    return "User is not signed in.";
  }

}