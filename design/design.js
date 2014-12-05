var map = L.mapbox.map('map', undefined, {zoomControl: false});
var layerGroup = L.layerGroup().addTo(map);
var index = 0;
var $navigation = $('#navigation-container');
var $description = $('.js-description-container');
var currentMapId = $('a.map-thumb').attr('id');
var fixheader = ($(window).width() < 640) ? 60 : 0;

setMap(window.location.hash.substring(1));

$('.js-close-modal').on('click', function(e) {
    $('#gallery').removeClass('js-hide-desc').addClass('close-modal');
    $navigation.removeClass().addClass('active0');
    return false;
});

$('.js-signup-action').on('click',function() {
    Views.modal.show('auth', function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
        if (err && err.code === 'closed') return;
        location.href = '../projects/index.html#new';
    });
    Views.modal.slide('active3');
    analytics.track('Clicked Design Signup Link');
    return false;
});

$('.js-fullheight').css('height', $(window).height());

$('.js-more').on('click', function(e) {
    e.preventDefault();
    $('html,body').animate({
        scrollTop: $('#mapbox-studio').offset().top - fixheader
    }, 400);
});

$('.js-map-select', $navigation).on('click', function(e) {
    setMap($(this).attr('id'));
    currentMapId =  ($(this).attr('id'));
    currentMapDiv = document.getElementById(currentMapId);
    $navigation.removeClass().addClass('active' + $('.map-thumbnails').children('a').index(this));
    $('#gallery').removeClass('js-hide-desc').addClass('close-modal');
    return false;
});

function nextMap() { return (maps[index + 1] || maps[0]).id; }
function prevMap() { return (maps[index - 1] || maps[maps.length - 1]).id; }
function setMap(id) {


    var i = (id) ? _.indexOf(maps, _.find(maps, function(d) {
        return d.id === id;
    })) : 0;

    if (i >= (maps.length) || i < 0) i = 0;

    index = i;

    var d = maps[i];

    $('.masthead')
        .removeClass('dark')
        .removeClass('light')
        .addClass(d.mapcolor);

    layerGroup.clearLayers();

    var layer = L.mapbox.tileLayer(d.id)
        .addTo(layerGroup);

    layer.on('ready', function(m) {
        $('#map').css('background-color', d.matte ? '#' + d.matte : '');
        if (d.center) map.setView([d.center[1], d.center[0]], d.center[2]);
        d.next = maps[(i + 1) % maps.length].id;
        d.current = maps[i % maps.length].id;
        d.prev = maps[(i - 1 + maps.length) % maps.length].id;
        d.description = d.description;
        d.name = d.name;
        d.tool = d.tool;
        d.data = d.data;
        d.fonts = d.fonts;
        d.textures = d.textures;
        d.marker = d.marker;
    });

}

if ($(window).width() < 770) {
    map.touchZoom.disable();
    map.tap.disable();
    map.dragging.disable();
};
