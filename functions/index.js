const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyB8cbTPR99myU2pqorq45p2Wu_FYXitjZY",
    authDomain: "socialmediaapp-4cc1a.firebaseapp.com",
    databaseURL: "https://socialmediaapp-4cc1a.firebaseio.com",
    projectId: "socialmediaapp-4cc1a",
    storageBucket: "socialmediaapp-4cc1a.appspot.com",
    messagingSenderId: "540276483133",
    appId: "1:540276483133:web:75d581f6afb4af1f9f3654",
    measurementId: "G-VMQ9BWK9NK"
  };



const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/screams', (req,res) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
      })
    .catch((err) => console.error(err));
})


app.post('/scream', (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  }

  db.collection('screams')
    .add(newScream)
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: 'Something went wrong' });
      console.error(err);
    })
});

//signUp route

app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };
  
  // TODO: validate data
  let token, userId;
  db.doc(`/users/${newUser.handle}`).get()
    .then((doc) => {
      if(doc.exists){
        return res.status(400).json({ handle: 'This handle has allready taken' })
      } else {
        return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token })
    })
    .catch((err) => {
      console.error(err);
      if (err === 'auth/email-already-in-use') {
        return res.status(400).json({ email: "Email already in use"} )
      } else {
        return res.status(500).json({ error: err.code });
      }
    })
});

exports.api = functions.region('europe-west1').https.onRequest(app);



