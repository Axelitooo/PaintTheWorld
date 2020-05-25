module.exports = function(app) {
  //On fourni au client (web) tous les fichiers dans le dossier "public"
  //app.use(sslRedirect());
  const express = require('express');
  var path = require('path');
  app.use(express.static('public', { dotfiles: 'allow' }));
  app.set('views', path.join(__dirname, '../public'));

  /* Gestion des routes */


  app.get('/', function(req, res){
  				let un = (req.user)?req.user.username:null;
  				let pps = (req.user)?req.user.permanant_paint_stock:null;
  				let tps = (req.user)?req.user.temporary_paint_stock:null;
  				res.render('index', {page_name:'index', username: un, permanant_paint_stock: pps, temporary_paint_stock: tps});
  			});

  app.get('/concept', function(req, res){
  	let un = (req.user)?req.user.username:null;
  	let pps = (req.user)?req.user.permanant_paint_stock:null;
  	let tps = (req.user)?req.user.temporary_paint_stock:null;
  				res.render('subpages/concept', {page_name:'concept', username: un, permanant_paint_stock: pps, temporary_paint_stock: tps});
  			});

  app.get('/drawings', function(req, res){
  	let un = (req.user)?req.user.username:null;
  	let pps = (req.user)?req.user.permanant_paint_stock:null;
  	let tps = (req.user)?req.user.temporary_paint_stock:null;
  				res.render('subpages/localmap', {page_name:'drawings', username: un, permanant_paint_stock: pps, temporary_paint_stock: tps});
  				});

  app.get('/signin', function(req, res){
  	let un = (req.user)?req.user.username:null;
  	let pps = (req.user)?req.user.permanant_paint_stock:null;
  	let tps = (req.user)?req.user.temporary_paint_stock:null;
  		res.render('subpages/signin', {page_name:'signin', username: un, permanant_paint_stock: pps, temporary_paint_stock: tps})});


  app.get('/login', function(req, res){
    //console.log(res.body)
  	let un = (req.user)?req.user.username:null;
  	let pps = (req.user)?req.user.permanant_paint_stock:null;
  	let tps = (req.user)?req.user.temporary_paint_stock:null;
  		res.render('subpages/login', {page_name:'login', username: un, permanant_paint_stock: pps, temporary_paint_stock: tps})});

  app.get('/account', function(req, res){
        let un = (req.user)?req.user.username:null;
        let pps = (req.user)?req.user.permanant_paint_stock:null;
        let tps = (req.user)?req.user.temporary_paint_stock:null;
  res.render('subpages/account', {page_name:'account', username: un, permanant_paint_stock: pps, temporary_paint_stock: tps})});

  app.get('/success', function(req, res){
  		res.send("Welcome in the community paint the world "+req.query.username+"!!!")});

  app.get('/error', function(req, res){
  		res.send("error")});
  app.get('/logout', function(req, res){
      		  req.logout();
      		  res.redirect('/');
      		});
  app.get('/download', function(req, res){
       res.sendFile(path.resolve('./public/Paint-the-world-alpha.apk') );});
}
