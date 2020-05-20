/* On importe les modules necessaires*/
const express = require('express');
const bodyParser = require('body-parser');
var path = require('path');
const passport = require('passport');
const bcryptjs = require('bcryptjs');
const router = express.Router();
session = require('express-session');
const mongoose = require('mongoose');


/* on cree un app express */
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  name: 'session',
  secret: 'paint-the-world', resave: false,
  saveUninitialized: false, cookie: {maxAge: 1000 * 60 * 15}}));

/*on inclus tous les fichiers aux quels il exite des dépendences*/
app.use(express.static('inscription'));


/*Connexion à la base de données*/

mongoose.connect('mongodb://localhost/MyDatabase',
                  { useNewUrlParser: true, useUnifiedTopology: true });
var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(req, res){
    console.log("connection succeeded");
})

/* Gestion des routes */

app.get('/', function(req, res){
    res.sendFile('/accueil.html', { root : __dirname})});

app.get('/inscription', function(req, res){
    res.sendFile(path.join(__dirname, '/inscription.html'))});

app.get('/login', function(req, res){
    res.sendFile(path.join(__dirname, '/login.html'))});

app.get('/success', function(req, res){
    res.send("Welcome in the community paint the world "+req.query.username+"!!!")});

app.get('/error', function(req, res){
    res.send("error")});

/* passport */


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user)
    });
});

/* La fonction permettant e hash le mot de passe pour sécuriser la bdd */

generateHash = function(password){
    return bcryptjs.hashSync(password, bcryptjs.genSaltSync(10), null);
};

/* La fonction pour verifier la conformité des mots de passe
celui du login et celui hasher qui est sur la bdd */

validPassword = function(password){
    return bcryptjs.compareSync(password, bcryptjs.hashSync(this.password));
};


/* Ici on gere l'insertion des données du formulaire
vers la collection account de la bdd */


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
        res.send("Error. Please respect the seizure rules ! ");
        }
    db.collection('account').insertOne(data,function(err, collection){
        if (err) throw err;
        console.log("Someone joined the community !!! ");

    });
    res.send("well Registered ! ");


})

/* Gestion de l'authentification */
const Schema = mongoose.Schema;
const Users = new Schema({

    username: String,
    password: String,

});
const User = mongoose.model('account', Users, 'account');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    function(username, password, done){
        User.findOne({
            login: username
        }, function(err, user){
            if(err){
                return done(err);
            }
            if(!user){
                return done(null, false);
            }
            if(user.password != password){
                return done(null, false);
            }
            return done(null, user);

        });

    }
));

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/error'}),
  function(req, res) {
    res.redirect('/success?username='+req.body.username);
  });

const port = process.env.PORT || 3000;
app.listen(port , () => console.log('App listening on port ' + port));
