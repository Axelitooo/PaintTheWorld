var mymap = L.map('gamemap').setView([45.785, 4.8778], 15);


L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery  <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYW50b2luZXJjYnMiLCJhIjoiY2s2Nm5hdzh2MTExOTNtbXBsbG1qbjc1NSJ9.lyYYPYUi6_L9nsdvNcRudw'
}).addTo(mymap);


var circle = L.circle([45.785, 4.8778], {
        color: 'red',
        fillColor: 'red',
        fillOpacity: 0.75,
        radius: 100,
}).addTo(mymap);
