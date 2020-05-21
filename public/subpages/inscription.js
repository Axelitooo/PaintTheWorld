// Fonction de désactivation de l'affichage des "tooltips"
function deactivateTooltips() {

    var tooltips = document.querySelectorAll('.tooltip'),
        tooltipsLength = tooltips.length;

    for (var i = 0; i < tooltipsLength; i++) {
        tooltips[i].style.display = 'none';
    }

}


// La fonction ci-dessous permet de récupérer la "tooltip" qui correspond à notre input

function getTooltip(elements) {

    while (elements == elements.nextSibling) {
        if (elements.className === 'tooltip') {
            return elements;
        }
    }

    return false;

}


// Fonctions de vérification du formulaire, elles renvoient "true" si tout est ok

var check = {}; // On met toutes nos fonctions dans un objet littéral

check['name'] = function() {

    var name = document.getElementById('name'),
        tooltipStyle = getTooltip(name).style;

    if (name.value.length >= 2) {
        name.className = 'correct';
        if (tooltipStyle) tooltipStyle.display = 'none';
        return true;
    } else {
        name.className = 'incorrect';
        if (tooltipStyle) tooltipStyle.display = 'inline-block';
        return false;
    }

};

check['p_nom'] = function() {

    var name = document.getElementById('p_nom'),
        tooltipStyle = getTooltip(name).style;

    if (name.value.length >= 2) {
        name.className = 'correct';
        if (tooltipStyle) tooltipStyle.display = 'none';
        return true;
    } else {
        name.className = 'incorrect';
        if (tooltipStyle) tooltipStyle.display = 'inline-block';
        return false;
    }

};
check['email'] = function() {

    var name = document.getElementById('email'),
        tooltipStyle = getTooltip(name).style;

    var regex = /^[a-zA-Z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}$/;
    if (!regex.test(name.value)) {
        name.className = 'incorrect';
        if (tooltipStyle) tooltipStyle.display = 'inline-block';
        return false;
    } else {
        name.className = 'correct';
        if (tooltipStyle) tooltipStyle.display = 'none';
        return true;
    }

};



check['username'] = function() {

    var login = document.getElementById('username'),
        tooltipStyle = getTooltip(login).style;

    if (login.value.length >= 4) {
        login.className = 'correct';
        if (tooltipStyle) tooltipStyle.display = 'none';
        return true;
    } else {
        login.className = 'incorrect';
        if (tooltipStyle) tooltipStyle.display = 'inline-block';
        return false;
    }

};

check['password1'] = function() {

    var password1 = document.getElementById('password1'),
        tooltipStyle = getTooltip(password1).style;
    var strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    if (!strongRegex.test(password1.value) && password1.value.length < 8) {
        password1.className = 'incorrect';
        if (tooltipStyle) tooltipStyle.display = 'inline-block';
        return false;
    } else {
        password1.className = 'correct';
        if (tooltipStyle) tooltipStyle.display = 'none';
        return true;
    }

};

check['password2'] = function() {

    var pwd1 = document.getElementById('password1'),
        pwd2 = document.getElementById('password2'),
        tooltipStyle = getTooltip(password2).style;

    if (password1.value == password2.value && password2.value != '') {
        password2.className = 'correct';
        if (tooltipStyle) tooltipStyle.display = 'none';
        return true;
    } else {
        password2.className = 'incorrect';
        if (tooltipStyle) tooltipStyle.display = 'inline-block';
        return false;
    }

};



// Mise en place des événements

(function() { // Utilisation d'une IIFE pour éviter les variables globales.

    var myForm = document.getElementById('myForm'),
        inputs = document.querySelectorAll('input[type=text], input[type=password]'),
        inputsLength = inputs.length;

    for (var i = 0; i < inputsLength; i++) {
        inputs[i].addEventListener('keyup', function(e) {
            //check[e.target.id](e.target.id); // "e.target" représente l'input actuellement modifié
            var result = true;

            for (var i in check) {
                result = check[i]() && result;
            }

            if (result) {
                document.getElementById("signin_button").disabled = false;
            } else {
              document.getElementById("signin_button").disabled = true;
            }
        });
    }

    myForm.addEventListener('submit', function(e) {

        var result = true;

        for (var i in check) {
            result = check[i](i) && result;
        }

        //e.preventDefault();

    });

})();


// Maintenant que tout est initialisé, on peut désactiver les "tooltips"

deactivateTooltips();
