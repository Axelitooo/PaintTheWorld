const express = require('express');
const app = express();


const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const passport = require('passport');
app.use(passport.initialize()); // here we initialize passport
app.use(passport.session());
app.use(express.static('succes'));
app.use(express.static('echec'));


// Ici on cree et defini les routes
app.get('/', function (req, res){
	res.sendFile('/auth.html', { root : __dirname});
});
app.get('/succes', function(req, res){
    res.send("Welcome"+req.query.login+"!!");
});

app.get('/echec', function(req, res){
    res.send("error");
});

app.get('/', function (req, res){
    res.sendFile(path.join(__dirname, '/accueil.html'));
});
app.get('/inscription', function (req, res){
    res.sendFile(path.join(__dirname, '/inscription.html'));
});

app.post('/inscription', function(req,res){
    var name = req.body.name;
    var p_nom =req.body.p_nom;
    var email = req.body.email;
    var login = req.body.login;
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
        "login": login,
        "password": passwordHash.generate(pass1)
        }
    }else{
        res.send("Error. Please respect the seizure rules ! ");
        return res.redirect('inscription.html');}
    db.collection('comptes').insertOne(data,function(err, collection){
        if (err) throw err;
        console.log("Données insérées !!! ");

    });
    res.send("well Registered ! ");
    //return res.redirect('/');

})

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});
/* connect to the bdd and use of mongoose for schematizing the data  */

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/basededones');

const Schema = mongoose.Schema;
const UserDetail = new Schema({
      username: String,
      password: String,


    });
const UserDetails = mongoose.model('comptes', UserDetail, 'comptes');
/*Passport local authentification */
passport.deserializeUser(function(id, cb) {
  User.findById(id, function(err, user) {
    cb(err, user);
  });
});
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(

  function(username, password, done) {
      UserDetails.findOne({
        login: username,
        //password: password
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }
        user.password = password;
        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));

app.get('/login', function (req, res){
    res.sendFile(path.join(__dirname, '/login.html'));

app.post('/login',

  passport.authenticate('local', { failureRedirect:'/echec',
                                    successRedirect:('/succes=')}

  ));

app.use('/', router);
const port = process.env.PORT || 3002;
app.listen(port , () => console.log('App listening on port ' + port));

