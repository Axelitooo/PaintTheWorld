package fr.insalyon.painttheworldapp;

import androidx.appcompat.app.AppCompatActivity;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import org.osmdroid.api.IMapController;
import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;

import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider;
import org.osmdroid.views.overlay.mylocation.IMyLocationConsumer;
import org.osmdroid.views.overlay.mylocation.IMyLocationProvider;
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay;

import java.net.URISyntaxException;
import java.util.ArrayList;

public class MainActivity extends AppCompatActivity implements View.OnClickListener, IMyLocationConsumer {

    private MapView mMapView;
    private MyLocationNewOverlay mLocationOverlay;
    private GpsMyLocationProvider mLocationProvider;

    private TextView mCoordTextView;
    private Button mUpdateButton;
    private Button mBeginButton;

    private boolean isRecording;


    private Socket mSocket;

    public static final String SERVER_URL = "http://paint.antoine-rcbs.ovh:8000";

    private ArrayList<GeoPoint> lineLocations;



    @Override
    /**
     * Méthode application au chargement de l'écran de base de l'application
     */
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        this.lineLocations = new ArrayList<GeoPoint>();

        //instanciation des boutons et textes


        final Context context = getApplicationContext();
        Configuration.getInstance().load(context, PreferenceManager.getDefaultSharedPreferences(context));



        mMapView = findViewById(R.id.map);
        mMapView.setTileSource(TileSourceFactory.MAPNIK);
        mMapView.setBuiltInZoomControls(false);
        mMapView.setMultiTouchControls(true);
        IMapController mapController = mMapView.getController();
        mapController.setZoom(18);
        GeoPoint startPoint = new GeoPoint(45.7837763, 4.872973);
        mapController.setCenter(startPoint);
        this.mLocationProvider = new GpsMyLocationProvider(context);
        this.mLocationProvider.startLocationProvider(this);
        mLocationProvider.setLocationUpdateMinDistance(3);
        mLocationProvider.setLocationUpdateMinTime(1000);
        this.mLocationOverlay = new MyLocationNewOverlay(new GpsMyLocationProvider(context), mMapView);
        this.mLocationOverlay.enableMyLocation();
        this.mLocationOverlay.enableFollowLocation();
        mMapView.getOverlays().add(this.mLocationOverlay);


        //Instanciation du service de localisation

        mCoordTextView = findViewById(R.id.text_view);
        mUpdateButton = findViewById(R.id.push_button);
        mBeginButton = findViewById(R.id.begin_button);
        mUpdateButton.setOnClickListener(this);
        mBeginButton.setOnClickListener(this);

        //Instanciation du socket avec le serveur node.js
        try {
            mSocket = IO.socket(SERVER_URL);
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
        mSocket.connect();






    }

    public void onResume(){
        super.onResume();
       mMapView.onResume(); //needed for compass, my location overlays, v6.0.0 and up
    }

    public void onPause(){
        super.onPause();
        mMapView.onPause();  //needed for compass, my location overlays, v6.0.0 and up
    }


    @Override
    /**
     * Au clic sur le bouton (unique pour l'instant), on prend la dernière loca du tel
     * et on l'envoie par le biais du socket au serveur
     */
    public void onClick(View v) {
        if (v.equals(mBeginButton)) {
            Toast.makeText(getApplicationContext(), "Début du dessin !", Toast.LENGTH_LONG).show();
            this.lineLocations.clear();
            this.isRecording = true;
        } else if (v.equals(mUpdateButton)) {
            Toast.makeText(getApplicationContext(), "Upload de ce trait !", Toast.LENGTH_SHORT).show();
            mSocket.emit("new_line", lineToJSON(this.lineLocations, 0xff0000));
            this.isRecording = false;
        }
    }


    private JSONObject lineToJSON(ArrayList<GeoPoint> pointList, int color) {
        JSONObject json = new JSONObject();
        JSONArray pointsArray = new JSONArray();

        try {
            json.put("color", color);
            for (GeoPoint geoPoint : pointList) {
                JSONArray point = new JSONArray();
                point.put(geoPoint.getLatitude());
                point.put(geoPoint.getLongitude());
                pointsArray.put(point);
            }
            json.put("location", pointsArray);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return json;
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

    @Override
    public void onLocationChanged(Location location, IMyLocationProvider source) {
        if (location != null && this.isRecording) {
            //On affiche sur le label les coordonnées GPS
            String message = lineLocations.size() + " : " + location.getLatitude() + " | " +  location.getLongitude();
            mCoordTextView.setText(message);
            this.lineLocations.add(new GeoPoint(location));
            //On envoie ces nouvelles coordonnées au serveur au format JSON
            //mSocket.emit("new_point", locationToJSON(location));
        }
    }
}
