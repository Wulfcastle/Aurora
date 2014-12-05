L.mapbox.accessToken = 'pk.eyJ1IjoicGV0ZXJxbGl1IiwiYSI6ImpvZmV0UEEifQ._D4bRmVcGfJvo1wjuOpA1g';

var map = L.mapbox.map('map', 'usatoday.map-yar21vo3');

map.scrollWheelZoom.disable();
map.attributionControl.addAttribution("Tornado track data from <a href='http://wdtinc.com/'>Weather Decision Technologies</a>");
map.attributionControl.addAttribution("<a href='http://www.gocivilairpatrol.com/'>Civil Air Patrol</a> imagery from <a href='http://hdds.usgs.gov/EO/'>USGS HDDS</a>");
map.attributionControl.addAttribution("Icon by Adam Whitcroft");

var ui = document.getElementById('map-ui');


// Set bounds of map
var southWest = new L.LatLng(35.0, -97.9),
    northEast = new L.LatLng(36.0, -96.8),
    bounds = new L.LatLngBounds(southWest, northEast);

map.setMaxBounds(bounds);

// Add markers

var markers = new L.MarkerClusterGroup({
    showCoverageOnHover: true,
    spiderfyOnMaxZoom: false,
    disableClusteringAtZoom: 15
});

for ( var i = 0; i < geoJson.length; i++ ){
    var feature = geoJson[i],
        coords = feature.geometry.coordinates;

    var marker = L.marker([coords[1], coords[0]], {
        id: feature.properties.entity_id,
        icon: L.divIcon({
            className: 'image-marker',
            html: '<img src="https://mapbox-raster.s3.amazonaws.com/oklahoma-tornado/src/browse/' + feature.properties.entity_id + '.jpg">',
            iconSize: new L.Point(60, 60),
            popupAnchor: new L.Point(2,-15)
        })
    });

    var popupContent = '<a target="_blank" class="popup" href="http://mapbox-raster.s3.amazonaws.com/oklahoma-tornado/src/full/' + feature.properties.entity_id + '.jpg">' +
                            '<img src="https://mapbox-raster.s3.amazonaws.com/oklahoma-tornado/src/browse/' + feature.properties.entity_id + '.jpg">'
                        '</a>';


    markers.addLayer(marker.bindPopup(popupContent, {
        closeButton: false,
        minWidth: 420
    }));
}

map.addLayer(markers);

markers.on('click', function(e){
    var coords = e.layer._latlng;
    map.panTo([coords.lat, coords.lng]);
});

// Add tornado tracks

var tornado2013 = L.geoJson(tornado2013, {
    style: function(feature) {
        switch (feature.properties.name) {
            case '0':
                return styleTracks("#EF8E00"); // Orange
            case '1':
                return styleTracks("#D33200"); // Red
        }
    }
});

var tornado2003 = L.geoJson(tornado2003, {
    style: function(feature) {
        var trackNum = parseInt(feature.properties.name);

        if(trackNum < 3)
            return styleTracks("#6CAA00"); // Dark Green
        else if(trackNum < 5)
            return styleTracks("#EFD800"); // Yellow
        else if(trackNum < 10)
            return styleTracks("#EF8E00"); // Orange
        else
            return styleTracks("#D33200"); // Red
    }
});

var tornado1990 = L.geoJson(tornado1990, {
    style: function(feature) {
        var trackNum = parseInt(feature.properties.name);

        if(trackNum < 6)
            return styleTracks("#6CAA00"); // Dark Green
        else if(trackNum < 10)
            return styleTracks("#8DD800"); // Light Green
        else if(trackNum < 25)
            return styleTracks("#EFD800"); // Yellow
        else if(trackNum < 27)
            return styleTracks("#EF8E00"); // Orange
        else
            return styleTracks("#D33200"); // Red
    }
});

addLayer(tornado2013,'May 20, 2013 tornado path', 'on');
addLayer(tornado2003,'May 8, 2003 tornado path');
addLayer(tornado1990,'May 3, 1990 tornado path');

function addLayer(layer, name, toggle) {
    // layer.addTo(map);

    // Create a simple layer switcher that toggles layers on
    // and off.
    var item = document.createElement('li');
    var link = document.createElement('a');

    link.href = '#';
    link.innerHTML = name;

    link.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
            this.className = '';
        } else {
            map.addLayer(layer);
            this.className = 'active';
        }
    };

    item.appendChild(link);
    ui.appendChild(item);

    if( toggle === 'on') {
        map.addLayer(layer);
        link.className = 'active';
    }
}

function styleTracks(trackColor) {
    return {
        color: trackColor,
        fillOpacity: 0.75,
        weight: 0
    }
}

// Init the map

map.setView([35.3410,-97.3929], 12);
var hash = new L.Hash(map);

