/*  EXPRESS SETUP  */
const bcryptjs = require('bcryptjs');
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('inscription'));

app.get('/', (req, res) => res.sendFile('accueil.html', { root : __dirname}));
app.get('/inscription', (req, res) => res.sendFile('inscription.html', { root : __dirname}));
app.get('/login', (req, res) => res.sendFile('login.html', { root : __dirname}));

const port = process.env.PORT || 3000;
app.listen(port , () => console.log('App listening on port ' + port));

/*  PASSPORT SETUP  */

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/MyDatabase');
var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(req, res){
    console.log("connection succeeded");
})

/*
var validPassword = function(password){
    return bcryptjs.compareSync(password, this.password);
};*/

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

app.get('/success', (req, res) => res.send("Welcome " +req.query.username+ "!!"));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function(err, user) {
    cb(err, user);
  });
});

/* MONGOOSE SETUP */



app.post('/inscription', function(req,res){
    var name = req.body.name;
    var p_nom =req.body.p_nom;
    var email = req.body.email;
    var username = req.body.login;
    var pass0 = req.body.password1;
    var pass1 = req.body.password2;
    var regex = /^[a-zA-Z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}$/;
    var strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

    if ((req.body.name && req.body.p_nom && req.body.email && req.body.login && req.body.password1 && req.body.password2)
        && (req.body.password1 == req.body.password2)
        && (regex.test(req.body.email))
        && (strongRegex.test(req.body.password1))
        && (req.body.password1.length >= 12)){

    var data = {
        "name": name,
        "p_nom": p_nom,
        "email": email,
        "username": username,
        "password": pass1
        }
    }else{
        res.send("Error. Please respect the seizure rules ! ")};
        //return res.redirect('accueil.html');}
    db.collection('account').insertOne(data,function(err, collection){
        if (err) throw err;
        console.log("Données insérées !!! ");

    });
    res.send("well Registered ! ");
    //return res.redirect('/');

})



const Schema = mongoose.Schema;
const UserDetail = new Schema({
      username: String,
      password: String
    });
const UserDetails = mongoose.model('account', UserDetail, 'account');




/* PASSPORT LOCAL AUTHENTICATION */

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
      UserDetails.findOne({
        username: username
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }

        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/error' }),
  function(req, res) {
    res.redirect('/success?username='+req.body.username);
  });

app.get('/logout', function(req, res){
    var name = req.body.username;
    console.log("Deconnecté" + req.body.username)
    req.logout();
    res.redirect('/');
    req.session.notice = " Vous vous êtes deconnecté" +req.body.username+ "!";

 });