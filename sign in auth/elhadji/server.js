/*  EXPRESS SETUP  */
const bcryptjs = require('bcryptjs');
const express = require('express');
const app = express();
app.use(passport.session());
const session = require('express-session');
app.use(session({ secret: 'elhadji', cookie: { maxAge: 60000 },
                resave: false,
                saveUninitialized: false }));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => res.sendFile('login.html', { root : __dirname}));

const port = process.env.PORT || 3000;
app.listen(port , () => console.log('App listening on port ' + port));

/*  PASSPORT SETUP  */


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

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/MyDatabase');

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
        login: username
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

app.post('/',
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