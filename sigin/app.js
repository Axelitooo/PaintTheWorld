var express=require("express");
var bodyParser=require("body-parser");
var path = require('path');
const router = express.Router();
var passwordHash = require('password-hash');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/basededones');
var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(req, res){
    console.log("connection succeeded");
})

var app=express()
app.use(bodyParser.json());
app.use(express.static('inscription'));
app.use(bodyParser.urlencoded({
    extended: true
}));



/** passport **/
/* routes */



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

app.get('/login', function (req, res){
    res.sendFile(path.join(__dirname, '/login.html'));
});
/*login à implementer*/
/*app.post('/login',
    passport.authenticate('local',{ successRedirect: '/',
                                    failureRedirect: '/login',
                                    failureFlash: true })

 );*/

/*gerer la deconnexion*/

app.get('/logout', function(req, res){
    var name = req.user.username;
    console.log("Deconnecté" + req.user.username)
    req.logout();
    res.redirect('/');
    req.session.notice = " Vous vous êtes deconnecté" + name + "!";

 });


 /** connexion http pour tester à enlever au moment demerger avec le vrai serveur**/

app.use('/', router);
const port = process.env.PORT || 3002;
app.listen(port , () => console.log('App listening on port ' + port));

