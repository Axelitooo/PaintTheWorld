package fr.insalyon.painttheworldapp;

import androidx.appcompat.app.AppCompatActivity;

import android.location.Location;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;

import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;

public class MainActivity extends AppCompatActivity  implements View.OnClickListener {

    private TextView mCoordTextView;
    private Button mUpdateButton;
    private FusedLocationProviderClient fusedLocationClient;

    private Socket mSocket;

    public static final String SERVER_URL = "http://paint.antoine-rcbs.ovh:8000";

    @Override
    /**
     * Méthode application au chargement de l'écran de base de l'application
     */
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        //instanciation des boutons et textes
        mCoordTextView = findViewById(R.id.text_view);
        mUpdateButton = findViewById(R.id.button);
        mUpdateButton.setOnClickListener(this);

        //Instanciation du service de localisation
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);

        //Instanciation du socket avec le serveur node.js
        try {
            mSocket = IO.socket(SERVER_URL);
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
        mSocket.connect();

    }

    @Override
    /**
     * Au clic sur le bouton (unique pour l'instant), on prend la dernière loca du tel
     * et on l'envoie par le biais du socket au serveur
     */
    public void onClick(View v) {
        fusedLocationClient.getLastLocation()
                .addOnSuccessListener(this, new OnSuccessListener<Location>() {
                    @Override
                    public void onSuccess(Location location) {
                        // Got last known location. In some rare situations this can be null.
                        if (location != null) {
                            //On affiche sur le label les coordonnées GPS
                            String message = location.getLatitude() + " | " +  location.getLongitude();
                            mCoordTextView.setText(message);
                            //On envoie ces nouvelles coordonnées au serveur au format JSON
                            mSocket.emit("new_point", locationToJSON(location));
                        }
                    }
                });
    }

    /**
     * Transforme cette localisation en un JSON simple pour être envoyé au serveur
     * Exemple : { location: [ 45.7831008, 4.890407 ] }
     * @param location Une localisation (infos GPS)
     * @return La longitude et la latitude au format JSON compris par le serveur et la BD
     */
    private JSONObject locationToJSON(Location location) {
        JSONObject point = new JSONObject();
        JSONArray locationArray = new JSONArray();
        try {
            locationArray.put(location.getLatitude());
            locationArray.put(location.getLongitude());
            point.put("location", locationArray);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return point;
    }
}
