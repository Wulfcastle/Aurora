var cartogram_image = d3.select('.cartogram-image');

function bgTween(to) {
    return function() {
        var spriteScale = d3.scale.linear()
            .domain([0, 1])
            .range([0, to * 512]);

        return function(i) {
            return (-Math.floor(spriteScale(i) / 512) * 512) + 'px 0px';
        };
    };
}

var yrs = [0, 20, 37, 44, 64];

function clickYear(d, i) {
    var yr = d3.select(this).text();
    cartogram_image
        .transition()
        .duration(1000)
        .ease('linear')
        .styleTween('background-position', bgTween(yrs[i]));
}

d3.select('#regions')
    .selectAll('h3')
    .on('click', clickYear);

d3.selectAll('.cartogram span')
    .on('click', clickYear);

var beforeLayer = d3.select('#chicago-before').node();

d3.select('.chicagos')
    .on('mousemove', function() {
        var pos = d3.mouse(this);
        d3.timer.flush();
        d3.timer(function() {
            d3.select('.separator').style("left", pos[0] + 'px');
            beforeLayer.style.clip = 'rect(0px ' + pos[0] + 'px 9999999px 0px)';
            return true;
        }, 0);
    });

var milesWords = d3.selectAll('.miles-diagram h1.big');
var points = d3.selectAll('.points a');

var n = -1,
    cancelAnim = false;

function setPoint(n) {
    milesWords.classed('show', function(d, i) {
        return i == n;
    });
    points.classed('on', function(d, i) {
        return i == n;
    });
}

points.on('click', function(d, i) {
    n = i;
    cancelAnim = true;
    setPoint(n);
});

function run() {
    if (++n > milesWords.length) n = 0;
    setPoint(n);
    if (!cancelAnim) d3.timer(run, 10 * 1000);
    return true;
}

d3.select('a[href="#twitter-phrase"]').on('click', function(d, i) {
    d3.event.preventDefault();
    window.open('https://twitter.com/intent/tweet?source=webclient&text=' +
        '.@OpenStreetMap has ' +
        d3.select('.miles-phrase .show').text() + ' of road data ' +
        encodeURIComponent('' + location.href));
});

d3.select('a[href="#twitter"]').on('click', function(d, i) {
    d3.event.preventDefault();
    window.open('https://twitter.com/intent/tweet?source=webclient&text=' +
        'Read the 2012 @OpenStreetMap Data Report: ' +
        encodeURIComponent('' + location.href));
});

d3.select('a[href="#facebook"]').on('click', function(d, i) {
    d3.event.preventDefault();
    window.open('https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(location.href));
});

run();

// Init maps
var osmEditMap = L.mapbox.map('osm-edit-map', 'https://a.tiles.mapbox.com/v3/enf.osm-edit-date.jsonp?secure');

osmEditMap.setView([45, -35], 4)
osmEditMap.scrollWheelZoom.disable();

document.getElementById('osm-edit-map-navigation').onclick = function(e) {
    var pos = e.target.getAttribute('data-position');
    if (pos) {
        var loc = pos.split(',');
        osmEditMap.setView(loc, 11);
        return false;
    }
}
