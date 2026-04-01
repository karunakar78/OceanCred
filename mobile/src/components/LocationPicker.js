import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { C } from '../theme';

const getMapHtml = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; background-color: #0b1120; font-family: sans-serif; }
        #map { height: 100vh; width: 100vw; }
        .instructions {
            position: absolute;
            top: 10px; left: 50%; transform: translateX(-50%);
            z-index: 1000;
            background: rgba(0,0,0,0.8); color: white;
            padding: 8px 16px; border-radius: 20px;
            font-size: 14px; text-align: center;
            border: 1px solid #334155;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="instructions">Tap map to move pin</div>
    <div id="map"></div>
    <script>
        const initLat = ${lat};
        const initLng = ${lng};
        const map = L.map('map').setView([initLat, initLng], 11);

        // OpenStreetMap Base
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap | © CARTO',
            maxZoom: 20
        }).addTo(map);

        // NASA GIBS Layer
        L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg', {
            maxZoom: 8,
            opacity: 0.3,
            attribution: '© NASA GIBS'
        }).addTo(map);

        // OpenWeather Map Layer (Placeholder API key)
        const owApiKey = 'PLACEHOLDER_OPENWEATHER_API_KEY'; 
        L.tileLayer(\`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=\${owApiKey}\`, {
            opacity: 0.5,
            attribution: '© OpenWeather'
        }).addTo(map);

        let marker = L.marker([initLat, initLng]).addTo(map);
        
        // 10km Explorer Radius (showing where the waste concentration applies)
        let circle = L.circle([initLat, initLng], {
            color: '#00d2ff',
            weight: 2,
            fillColor: '#00d2ff',
            fillOpacity: 0.05,
            radius: 10000 
        }).addTo(map);

        // Simulate Waste Concentration (Heat spots) within 10km
        function drawWasteHeatmap(centerX, centerY) {
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2;
                const rad = Math.sqrt(Math.random()) * 0.09; 
                const dLat = Math.cos(angle) * rad;
                const dLng = Math.sin(angle) * rad;
                
                const severity = Math.random();
                let color = '#00ff88'; // low
                if (severity > 0.6) color = '#ffcc00'; // medium
                if (severity > 0.85) color = '#ff4444'; // high
                
                L.circle([centerX + dLat, centerY + dLng], {
                    color: color,
                    weight: 0,
                    fillColor: color,
                    fillOpacity: 0.4 + (Math.random() * 0.4),
                    radius: 200 + Math.random() * 800,
                    interactive: false
                }).addTo(map);
            }
        }
        
        drawWasteHeatmap(initLat, initLng);

        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371e3; // metres
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c; 
        }

        function updateLocation(latlng) {
            const dist = calculateDistance(initLat, initLng, latlng.lat, latlng.lng);
            const isOutOfBounds = dist > 10000;

            if (!isOutOfBounds) {
                marker.setLatLng(latlng);
                map.panTo(latlng);
            }
            
            // Send selected coordinate back to React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    lat: !isOutOfBounds ? latlng.lat : marker.getLatLng().lat,
                    lng: !isOutOfBounds ? latlng.lng : marker.getLatLng().lng,
                    outOfBounds: isOutOfBounds
                }));
            }
        }

        // Delay initial post so React Native webview is ready
        setTimeout(() => {
            updateLocation({ lat: initLat, lng: initLng });
        }, 500);

        map.on('click', function(e) {
            updateLocation(e.latlng);
        });
    </script>
</body>
</html>
`;

export default function LocationPicker({ onLock }) {
    const [initialRegion, setInitialRegion] = useState(null);
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Location permission is required to select cleaning area.');
                    return;
                }
                const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setInitialRegion({
                    lat: currentPos.coords.latitude,
                    lng: currentPos.coords.longitude,
                });
            } catch (e) {
                setError('Failed to get current location.');
            }
        })();
    }, []);

    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.lat && data.lng) {
                setSelectedCoords(data);
            }
        } catch (e) {
            // Ignore parse errors safely
        }
    };

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!initialRegion) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={C.cyan} />
                <Text style={styles.loadingText}>Fetching GPS...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <WebView
                    source={{ html: getMapHtml(initialRegion.lat, initialRegion.lng) }}
                    style={styles.webview}
                    onMessage={handleMessage}
                    scrollEnabled={false}
                    bounces={false}
                />
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerTitle}>Selected Cleaning Area</Text>
                <Text style={styles.footerCoords}>
                    {selectedCoords ? `${selectedCoords.lat.toFixed(5)}°, ${selectedCoords.lng.toFixed(5)}°` : 'Tap on map'}
                </Text>

                {selectedCoords?.outOfBounds ? (
                    <Text style={{ color: '#ff4c4c', textAlign: 'center', marginBottom: 10, fontSize: 13 }}>
                        ⚠️ Selected location is outside the 10km radius.
                    </Text>
                ) : null}

                <TouchableOpacity 
                    style={[styles.primaryBtn, (!selectedCoords || selectedCoords?.outOfBounds) && styles.primaryBtnDisabled]} 
                    onPress={() => selectedCoords && !selectedCoords.outOfBounds && onLock(selectedCoords)}
                    disabled={!selectedCoords || selectedCoords?.outOfBounds}
                >
                    <Text style={styles.primaryBtnText}>Lock Cleaning Area 🔒</Text>
                </TouchableOpacity>
                <Text style={styles.hintText}>
                    You must take the required waste photo within 1km of this locked location.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1120',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1E293B',
        marginVertical: 10,
    },
    centerContainer: {
        height: 300,
        backgroundColor: '#0b1120',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    mapContainer: {
        height: 350,
        backgroundColor: '#1E293B',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    footer: {
        padding: 16,
        backgroundColor: '#1E293B',
    },
    footerTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    footerCoords: {
        color: C.cyan,
        fontSize: 14,
        marginBottom: 16,
    },
    primaryBtn: {
        backgroundColor: C.cyan,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryBtnDisabled: {
        backgroundColor: '#334155',
    },
    primaryBtnText: {
        color: '#0b1120',
        fontWeight: 'bold',
        fontSize: 16,
    },
    hintText: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 10,
        textAlign: 'center',
    },
    errorText: {
        color: '#ff4c4c',
        padding: 20,
        textAlign: 'center',
    },
    loadingText: {
        color: '#94A3B8',
        marginTop: 10,
    }
});
