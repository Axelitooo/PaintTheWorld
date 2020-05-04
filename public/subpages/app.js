var express=require("express"); 
var bodyParser=require("body-parser");
var path = require('path');
var passwordHash = require('password-hash');
  
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/basedd');
var db=mongoose.connection; 
db.on('error', console.log.bind(console, "connection error")); 
db.once('open', function(callback){ 
	console.log("connection succeeded"); 
}) 
  
var app=express() 

  
app.use(bodyParser.json()); 
app.use(express.static('frontend'));
app.use(bodyParser.urlencoded({ 
	extended: true
}));

app.get('/', function (req, res){
	res.sendFile(path.join(__dirname, '/signin.html'));
});
  
app.post('/inscription', function(req,res){

	var name = req.body.name;
	var p_nom = req.body.p_nom;
	var email =req.body.email;
	var login =req.body.login;
	var pass0 = req.body.password1;
	var pass1 = req.body.password2;

	if (req.body.name && req.body.p_nom && req.body.email && req.body.login && req.body.password1 && req.body.password2){
		var data = {

			"name": name,
			"p_nom": p_nom,
			"email":email,
			"login":login,
			"password":passwordHash.generate(pass1)
		}
	 }else{
		return res.redirect('echec.html');}
db.collection('account').insertOne(data,function(err, collection){
		if (err) throw err; 
		console.log("Record inserted Successfully"); 
			  
	}); 
		  
	return res.redirect('success.html');
}) 
  
  
app.get('/',function(req,res){ 
res.set({ 
	'Access-control-Allow-Origin': '*'
	}); 
return res.redirect('signin.html'); 
}).listen(3002)


console.log("server listening at port 3002");

