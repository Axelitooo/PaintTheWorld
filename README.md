Ce projet est un projet WEB concu dans le cadre de la formation 3TC de l'INSA.

URL du site : https://paint.antoine-rcbs.ovh/

Infos complémentaires :

Connexion au serveur VPS en ssh : (Linux Ubuntu 18.04)

-Taper “ssh root@paint.antoine-rcbs.ovh” puis ‘yes’ si le terminal pose une question.

-Vous êtes désormais dans le serveur en ssh! Votre terminal se comporte comme si il était à la racine du PC qui constitue le serveur. Tout ce que vous faites comme commande sera exécuté sur celui ci et non sur votre machine. Vous êtes root donc pas besoin de “sudo” mais faites gaffes, vous avez le pouvoir de tout casser :D 

Reload le serveur : pm2 restart server
Monitor du serveur (console ect) : pm2
(Pm2 est un utilitaire qui permet de gérer des process node.js en tant que deamons)

