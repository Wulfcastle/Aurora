var fixheader = ($(window).width() < 640) ? 60 : 0;

$('.js-signup-action').on('click', function() {
    Views.modal.show('auth', function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
        if (err && err.code === 'closed') return;
        location.href = '../projects/index.html#new';
    });
    Views.modal.slide('active3');
    analytics.track('Clicked Data Signup Link');
    return false;
});

$('.js-fullheight').css('height', $(window).height());

$('.js-more').on('click', function(e) {
    e.preventDefault();
    $('html,body').animate({
        scrollTop: $('#learn-more').offset().top - fixheader
    }, 300);
});

var dataTemplate = _.template(document.getElementById('data-template').innerHTML);
var count = 0;

function makeMap(xray,style,container,center) {

    var $container = $('#' + container).parent();
    var xraysource = {
          "tiles": [window.mapbox_tileApi + "/v4/" + xray + "/{z}/{x}/{y}.png?access_token=" + window.mapbox_accessToken],
          "minzoom": 0,
          "maxzoom": 20
        };

    var map = L.mapbox.map(container, undefined, {
        attributionControl:false
    });
    var xrayLayer = L.mapbox.tileLayer(xraysource);
    var styleLayer = L.mapbox.tileLayer(style);

    xrayLayer.addTo(map);

    var gridLayer = L.mapbox.gridLayer(xray);

    gridLayer.on('ready', function() {
        $('.js-info',$container).html(dataTemplate(gridLayer.getTileJSON().vector_layers));
    });

    gridLayer.addTo(map);

    $('.js-toggle-layer',$container).on('click', function() {

        if ($(this).hasClass('active')) {
            map.removeLayer(styleLayer);
            xrayLayer.addTo(map);
            count ++;
            if (count >= 3) $(this).removeClass('active close').addClass('sun');
        } else {
            map.removeLayer(xrayLayer);
            styleLayer.addTo(map);
            count ++;
            if (count >= 3) $(this).addClass('active close').removeClass('sun');
        }

        if (count >= 3) {
            count = 0;
        }

        return false;
    });

    $('#' + container).append('<div class="zoomlevel dark fill-darken2 small strong round pad0 inline pin-topleft z100">' + center.zoom + '</div>');
    var zoomState = $('.zoomlevel', $('#' + container));

    map.on('zoomend', function() {
        zoomState.text(map.getZoom());
    })

    map.touchZoom.disable();
    map.scrollWheelZoom.disable();

    if (map.tap) {
        map.tap.disable();
        map.dragging.disable();
    }

    map.setView([center.lat,center.lon], center.zoom);
};

makeMap('mapbox.mapbox-terrain-v1','examples.ik7djhcc','xrayterrain',{lat:46.1963,lon:-482.1879,zoom:13});
makeMap('mapbox.mapbox-terrain-v1','examples.ik7djhcc','xrayterrain-2',{lat:46.1963,lon:-482.1879,zoom:3});
makeMap('mapbox.mapbox-terrain-v1','examples.ik7djhcc','xrayterrain-3',{lat:46.1963,lon:-482.1879,zoom:15});

makeMap('mapbox.mapbox-streets-v5','examples.map-i87786ca','xraystreets',{lat:40.718,lon:-73.987,zoom:12});
makeMap('mapbox.mapbox-streets-v5','examples.map-i87786ca','xraystreets-2',{lat:40.718,lon:-73.987,zoom:6});
makeMap('mapbox.mapbox-streets-v5','examples.map-i87786ca','xraystreets-3',{lat:40.718,lon:-73.987,zoom:17});
