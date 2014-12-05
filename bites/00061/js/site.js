var slider = $('#slider').slider({
    animate: true,
	value:0.5,
	min: 0,
	max: 1,
	step:0.001,
	slide: function(event, ui) {
		position=ui.value;
		clip();
    },
	change: function(event, ui) {
		position=ui.value;
		clip();
	 }
});

function slide(value) {
    $('#slider').slider('value', value);
    return false;
}

var map = L.mapbox.map('map').setView([0,0], 15);
map.infoControl.addInfo("Skybox | Mapbox");

var geoJson = [
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.02158641815185547,0.023217200597529436]},
        "properties": {"title": "-70%","icon": {"iconUrl": "icons/down70.png","iconSize": [62, 18],"iconAnchor": [10, 9],
        "popupAnchor": [0, 0],"className": "dot"}}}, 
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.024890899658203125,0.02145767161755122]},
        "properties": {"title": "-50%","icon": {"iconUrl": "icons/down50.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.02304553985595703,0.019783973300716306]},
        "properties": {"title": "+90%","icon": {"iconUrl": "icons/up90.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.024204254150390625,0.017294883465395032]},
        "properties": {"title": "+10%","icon": {"iconUrl": "icons/up10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.019397735595703125,0.020856856839178626]},
        "properties": {"title": "-70%","icon": {"iconUrl": "icons/down70.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},    
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.02192974090576172,0.015234947025062428]},
        "properties": {"title": "-10%","icon": {"iconUrl": "icons/down10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},    
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.016050338745117188,0.017423629492189063]},
        "properties": {"title": "-70%","icon": {"iconUrl": "icons/down70.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.019698143005371094,0.013260841251244514]},
        "properties": {"title": "+50%","icon": {"iconUrl": "icons/up50.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.012059211730957031,0.01708030675385537]},
        "properties": {"title": "-40%","icon": {"iconUrl": "icons/down40.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.009698867797851562,0.016007423192645726]},
        "properties": {"title": "+30%","icon": {"iconUrl": "icons/up30.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.011630058288574219,0.01463413222614345]},
        "properties": {"title": "-60%","icon": {"iconUrl": "icons/down60.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.013475418090820312,0.013346671937402313]},
        "properties": {"title": "-50%","icon": {"iconUrl": "icons/down50.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.01201629638671875,0.01145839683525159]},
        "properties": {"title": "+20%","icon": {"iconUrl": "icons/up20.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.010213851928710938,0.012788772476816847]},
        "properties": {"title": "-40%","icon": {"iconUrl": "icons/down40.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.008411407470703125,0.014119148111499384]},
        "properties": {"title": "-80%","icon": {"iconUrl": "icons/down80.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.014376640319824219,0.00708103178129496]},
        "properties": {"title": "-30%","icon": {"iconUrl": "icons/down30.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.012531280517578125,0.008282661409144628]},
        "properties": {"title": "-80%","icon": {"iconUrl": "icons/down80.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.01064300537109375,0.009527206377007139]},
        "properties": {"title": "+10%","icon": {"iconUrl": "icons/up10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.008883476257324219,0.010986328057681535]},
        "properties": {"title": "-60%","icon": {"iconUrl": "icons/down60.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.007081031799316405,0.012359619044768358]},
        "properties": {"title": "-40%","icon": {"iconUrl": "icons/down40.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.008068084716796875,0.0060939788703537326]},
        "properties": {"title": "+10%","icon": {"iconUrl": "icons/up10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.008540153503417969,0.0029182434069452245]},
        "properties": {"title": "+10%","icon": {"iconUrl": "icons/up10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.004849433898925781,0.005664825430226633]},
        "properties": {"title": "-30%","icon": {"iconUrl": "icons/down30.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.007982254028320312,-0.0035190582253291957]},
        "properties": {"title": "-10%","icon": {"iconUrl": "icons/down10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.0048923492431640625,-0.00738143918855953]},
        "properties": {"title": "-10%","icon": {"iconUrl": "icons/down10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.009999275207519531,-0.00017166137694648377]},
        "properties": {"title": "-10%","icon": {"iconUrl": "icons/down10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.011930465698242188,0.0036048889136370485]},
        "properties": {"title": "-10%","icon": {"iconUrl": "icons/down10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [-0.0014591217041015625,0.0011157989501267]},
        "properties": {"title": "+70%","icon": {"iconUrl": "icons/up70.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [0.00030040740966796875,0.0024890899650370146]},
        "properties": {"title": "+30%","icon": {"iconUrl": "icons/up30.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [0.004248619079589843,0.0024890899650370146]},
        "properties": {"title": "+10%","icon": {"iconUrl": "icons/up10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [0.0034761428833007812,0.0006437301635747586]},
        "properties": {"title": "-10%","icon": {"iconUrl": "icons/down10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [0.003948211669921875,-0.002789497374388028]},
        "properties": {"title": "-30%","icon": {"iconUrl": "icons/down30.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [0.00102996826171875,-0.0024032592766401063]},
        "properties": {"title": "-50%","icon": {"iconUrl": "icons/down50.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [0.0009012222290039062,-0.005235671989781479]},
        "properties": {"title": "+10%","icon": {"iconUrl": "icons/up10.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}},
        {"type": "Feature","geometry": {"type": "Point","coordinates": [0.009183883666992188,-0.0069952010934578295]},
        "properties": {"title": "-30%","icon": {"iconUrl": "icons/down30.png","iconSize": [62, 18],
        "iconAnchor": [10, 9],"popupAnchor": [0, 0],"className": "dot"}}}
    ];

map.markerLayer.on('layeradd', function(e) {
            var marker = e.layer,
            feature = marker.feature;

            marker.setIcon(L.icon(feature.properties.icon));
        });
   
map.markerLayer.setGeoJSON(geoJson);

	
L.mapbox.tileLayer('dberkens.h629bj1m').addTo(map);
var overlay = L.mapbox.tileLayer('dberkens.h629o1el').addTo(map);
map.options.maxZoom = 16;
map.options.minZoom = 14;
map.scrollWheelZoom.disable();
var southWest = L.latLng(0.0500,-0.0311),
    northEast = L.latLng(-0.0523,0.0358),
    bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);
var position=0.5;

function clip() {
    var nw = map.containerPointToLayerPoint([0, 0]),
        se = map.containerPointToLayerPoint(map.getSize()),
        clipX = nw.x + (se.x - nw.x) * position;
    overlay.getContainer().style.clip = 'rect(' + [nw.y, clipX, se.y, nw.x].join('px,') + 'px)';
}

clip();

map.on('move', clip);

document.getElementById('osm-edit-map-navigation').onclick = function(e) {
	var pos = e.target.getAttribute('data-position');
    if (pos) {
        var loc = pos.split('|');
		map.setView([loc[0],loc[1]], loc[2]);
		slider.slider('value', loc[3]);		
        return false;
    }
};

//Expand buttons on click
$('.expand').click(function() {
    $('.item').removeClass('active');
    $(this).parent('.item').addClass('active');
});
