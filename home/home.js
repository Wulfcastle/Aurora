
var slideshow = $('.js-slideshow');
var pager = $('.js-pager');
var underline = $('.js-underline');
var repeat;
var fixheader = ($(window).width() < 640) ? 60 : 0;

analytics.trackLink($('a.js-track-design-link'), 'Clicked Design Link');
analytics.trackLink($('a.js-track-develop-link'), 'Clicked Develop Link');
analytics.trackLink($('a.js-track-about-link'), 'Clicked About Link');

$('.js-fullheight').css('height', $(window).height());

$('.js-signup-action').on('click',function() {
    Views.modal.show('auth', {redirect: '/'}, function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
        if (err && err.code === 'closed') return;
        location.href = '../projects/index.html#new';
    });
    Views.modal.slide('active3');
    analytics.track('Clicked Homepage Signup Link');
    return false;
});

$('.js-works').on('click', function(e) {
    e.preventDefault();
    $('html,body').animate({scrollTop: ($('#design').offset().top - fixheader)}, 300);
});

$('.js-img-carousel img').each(function(i) {
    var page = document.createElement('a');
        page.className = 'dot animate inline';
        page.href = '#';
        page.setAttribute('data-index', i);
        pager.append(page);

    var text = this.getAttribute('data-text');

    var line = document.createElement('span');
        line.className = 'animate';
        line.textContent = text;

    underline.append(line);

    if (i === 0) {
        page.className += ' active';
    }

    page.onclick = function(e) {
        e.preventDefault();
        var current = slideshow.attr('class').match(/active[1-9]+/);
        var index = this.getAttribute('data-index');

        if (current) {
            pager.find('a').removeClass('active');
            $(this).addClass('active');

            slideshow
                .removeClass(current[0])
                .addClass('active' + (i + 1));

            // Reset the slideshow
            clearInterval(repeat);
            repeat = window.setInterval(autoslide, 6000);
        }
    };
});

repeat = window.setInterval(autoslide, 6000);

function autoslide() {
    var active = pager.find('.active').next();
    if (active.get(0)) {
        pager.find('.active').next().trigger('click');
    } else {
        pager.find('a').first().trigger('click');
    }
}

var mapHosting = L.mapbox.map('map-datacenters', 'saman.n5gbvs4i', {
    scrollWheelZoom: false,
    zoomControl: false,
    minZoom: 2,
    maxZoom: 2
}).setView({ lat: 0.00, lon:-40.00 }, 2);

mapHosting.touchZoom.disable();

// Disable tap handler, if present.
if (mapHosting.tap) {
    mapHosting.tap.disable();
    mapHosting.dragging.disable();
}

var popLayer = L.mapbox.featureLayer()
    .addTo(mapHosting)
    .on('layeradd', function(e) {
        var marker = e.layer;
        var m = L.divIcon({
            className: 'datacenter-marker edge',
            iconSize: [8,8],
            popupAnchor: [0, -5]
        });
        marker.setIcon(m);

        marker.bindPopup('<div class="big icon cloud edge"><h6>' + marker.feature.properties.title + '</h6><small class="quiet">Edge server</small></div>', {
            closeButton: false
        });

        var timeout;
        marker.on('mouseover', function(){
            timeout = window.setTimeout(function() { marker.openPopup() },200);
        });
        marker.on('mouseout', function(){
            window.clearTimeout(timeout);
            marker.closePopup();
        });
    });
popLayer.loadID('willwhite.j5bi5jlk');

var datacenterLayer = L.mapbox.featureLayer()
    .addTo(mapHosting)
    .on('layeradd', function(e) {
        var marker = e.layer;
        var m = L.divIcon({
            className: 'datacenter-marker data-center',
            iconSize: [14,14],
            popupAnchor: [0, -5]
        });
        marker.setIcon(m);

        marker.bindPopup('<div class="big icon data"><h6>' + marker.feature.properties.title + '</h6><small class="quiet">Datacenter</small></div>', {
            closeButton: false
        });

        var timeout;
        marker.on('mouseover', function(){
            timeout = window.setTimeout(function() { marker.openPopup() },200);
        });
        marker.on('mouseout', function(){
            window.clearTimeout(timeout);
            marker.closePopup();
        });
    });
datacenterLayer.loadID('willwhite.j5bldndh');
