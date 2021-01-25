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

      document.querySelector('#logIn').style.display = 'none';
      document.querySelector('#loggedIn').style.display = 'block';

    }).catch((error) => {
      console.log(error);
    });

}

function logout() {
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    console.log('Signed out');
    document.querySelector('#logIn').style.display = 'block';
    document.querySelector('#loggedIn').style.display = 'none';
  }).catch((error) => {
    console.log(error);
  });
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    //console.log(user);
    user.getIdToken().then(function(idToken) {
      //console.log(idToken); // It shows the Firebase token now
      console.log('Signed in');
      document.querySelector('#logIn').style.display = 'none';
      document.querySelector('#loggedIn').style.display = 'block';
    });

  } else {
    console.log('User not signed in');
  }
});

function setData(service, path, type, content) {
  let opts = {};
  opts.path = path;
  opts.type = type;
  opts.content = content;
  call_api(service + '/set-data', opts).then(function(res) {
    if (res.ok) {
      console.log(res.msg);
    } else {
      console.log('An error occured' + res);
    }
  });
}

function getData(service, path) {
  let opts = {};
  opts.path = path;
  call_api(service + '/get-data', opts).then(function(res) {
    if (res.ok) {
      console.log(res.msg);
    } else {
      console.log('An error occured: ' + res);
    }
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