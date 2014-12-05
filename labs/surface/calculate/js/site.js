var map = L.mapbox.map('map', 'villeda.iaegsyvi');
map.setView([36.1601,-116.6473],9);
map.touchZoom.disable();
map.doubleClickZoom.disable();

var mOptions = {
    radius: 5,
    color: 'white',
    fillColor: 'steelblue',
    fillOpacity: 1,
}

var markArr = [];
var queryPoints;

var xs = L.polyline([],{
    color: 'steelblue'
}).addTo(map);

var hover = L.marker([],{
    icon: L.divIcon({
        className: 'marker-hover',
        iconSize: 20,
        iconAnchor: [10,10]
    })
});

function loadProfile(url) {
    $('#chart').html('<div class="loading"></div>');
    var currZ = map.getZoom();
    if (currZ<11) {
        var qZ = 11;
    } else if (currZ>14) {
        var qZ = 14;
    } else {
        var qZ = currZ;
    }
    var tempUrl = 'https://api.tiles.mapbox.com/v4/surface/villeda.92hp8pvi.json?layer=temp&fields=temp_f&z=6&access_token=pk.eyJ1IjoiYm9iYnlzdWQiLCJhIjoiTi16MElIUSJ9.Clrqck--7WmHeqqvtFdYig&encoded_polyline='+url;
    var elevUrl = 'https://api.tiles.mapbox.com/v4/surface/mapbox.mapbox-terrain-v1.json?layer=contour&fields=ele&zoom='+qZ+'&access_token=pk.eyJ1IjoiYm9iYnlzdWQiLCJhIjoiTi16MElIUSJ9.Clrqck--7WmHeqqvtFdYig&encoded_polyline='+url;
    $.when(
        $.ajax({
            type: 'GET',
            url:tempUrl
        }),
        $.ajax({
            type: 'GET',
            url: elevUrl
        })
    ).done(function(tempResp,elevResp) {
        var elevProfile = [],
            tempProfile = [];
        for (var i = 0; i < elevResp[0].results.length; i++) {
            if (elevProfile.length === 0 && typeof elevResp[0].results[i].ele != 'number') {
                elevProfile.push(0);
            } else if (elevResp[0].results[i].ele == 0 || typeof elevResp[0].results[i].ele != 'number') {
                elevProfile.push(elevProfile[elevProfile.length-1]);
            } else {
                elevProfile.push(elevResp[0].results[i].ele);
            }
            if (tempResp[0].results[i].temp_f == 0 || typeof tempResp[0].results[i].temp_f != 'number') {
                tempProfile.push(tempProfile[tempProfile.length-1]);
            } else {
                tempProfile.push(tempResp[0].results[i].temp_f);
            }
        }
        drawChart(elevProfile,tempProfile);
    });
}

function addPoint(e) {
    markArr.push(L.circleMarker(e.latlng,mOptions));
    markArr[markArr.length-1]
        .addTo(map)
        .on('click', endDrawing)
        .on('mouseover', function(){
            this.setRadius(10);
        })
        .on('mouseout', function(){
            this.setRadius(5);
        });
    xs.addLatLng(e.latlng);
}

function updateDrawing(e) {
    xs.spliceLatLngs(-1,1,e.latlng)
}

xs.on('click', function(e) {
    addPoint(e);
})

function keepDrawing(e) {
    addPoint(e);
}
var reduce;
function startDrawing(e) {
    for (var i = 0; i < markArr.length; i++) {
        map.removeLayer(markArr[i]);
    }
    markArr.length = 0;
    xs.spliceLatLngs(0,xs.getLatLngs().length);
    xs.addLatLng(e.latlng);
    map.on('mousemove', updateDrawing);
    addPoint(e);
    map.once('click', keepDrawing);
    reduce = 2000000;
}

function endDrawing() {
    map.off('click');
    map.off('mousemove');
    queryPoints = [];
    for (var i = 1; i < markArr.length; i++) {
        var dist = haverDistance(markArr[i-1].getLatLng(),markArr[i].getLatLng());
        var sampInterval = Math.round(dist/(reduce/Math.pow(2,map.getZoom()))),
            latR = markArr[i-1].getLatLng().lat - markArr[i].getLatLng().lat,
            lngR = markArr[i-1].getLatLng().lng - markArr[i].getLatLng().lng,
            latInc = latR/sampInterval,
            lngInc = lngR/sampInterval;
        for (var s = sampInterval - 1; s >= 0; s--) {
            var tLat = (s*latInc)+markArr[i].getLatLng().lat;
            var tLng = (s*lngInc)+markArr[i].getLatLng().lng;
            queryPoints.push([tLat,tLng]);
        }
    }
    if (queryPoints.length>=300) {
        reduce += 1000000;
        endDrawing();
    } else {
        loadProfile(polyline.encode(queryPoints));
        map.once('click', startDrawing);
    }

}

function formatElev(elev) {
    return Math.round(elev)+' m';
}
function formatTemp(temp) {
    return Math.round(temp)+'Â° f';
}

function drawChart(elevData,tempData) {
    $('#chart').html("");
    var hWind = $('.js-chartdiv').height();
    var wWind = $('.js-chartdiv').width();
    var minElev = d3.min(elevData);
    var maxElev = d3.max(elevData);
    var minTemp = d3.min(tempData);
    var maxTemp = d3.max(tempData);
    $('#max-elev').text(formatElev(maxElev));
    $('#min-elev').text(formatElev(minElev));
    $('#max-temp').text(formatTemp(maxTemp));
    $('#min-temp').text(formatTemp(minTemp));
    var margins = [20, 20, 20, 20],
        w = wWind - margins[1] - margins[3],
        h = hWind - margins[0] - margins[2];

    var x1 = d3.scale.linear()
        .domain([0, elevData.length])
        .range([0, w]);

    var y1 = d3.scale.linear()
        .domain([minElev-100, d3.max(elevData)+10])
        .range([h, 0]);

    var y2 = d3.scale.linear()
        .domain([d3.min(tempData)-10, d3.max(tempData)+10])
        .range([h, 0]);

    var area = d3.svg.area()
        .x(function(d,i) {
            return x1(i);
        })
        .y0(h)
        .y1(function(d) {
            return y1(d);
        });

    var line = d3.svg.line()
        .x(function(d,i) {
            return x1(i);
        })
        .y(function(d) {
            return y2(d);
        });

    var graph = d3.select("#chart").append("svg:svg")
        .attr("width", w + margins[1] + margins[3])
        .attr("height", h + margins[0] + margins[2])
        .append("svg:g")
        .attr("transform", "translate(" + margins[3] + "," + margins[0] + ")")
        .attr('class', 'profileGraph')
        .on('mouseover', function() {
            focusElev.style('display', null);
        })
        .on('mouseout', function() {
            focusElev.style('display', 'none');
            map.removeLayer(hover);
        })
        .on('mousemove', chartMouseover);

        graph.append("linearGradient")
          .attr("id", "temperature-gradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", 0).attr("y1", y2(20))
          .attr("x2", 0).attr("y2", y2(110))
        .selectAll("stop")
          .data([
            {offset: "0%", color: "#6AFAFD"},
            {offset: "25%", color: "#74F1BB"},
            {offset: "50%", color: "#B3D971"},
            {offset: "75%", color: "#E7B657"},
            {offset: "100%", color: "#FE9472"}
          ])
          .enter().append("stop")
            .attr("offset", function(d) { return d.offset; })
            .attr("stop-color", function(d) { return d.color; });

    graph.append("path")
        .attr("d", area(elevData))
        .attr('class', 'elevGraph');

    graph.append("path")
        .attr("d", line(tempData))
        .attr('class', 'tempGraph');

    graph.append('rect')
        .attr('class', 'click-capture')
        .style('visibility', 'hidden')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', w)
        .attr('height', h);

    var focusElev = graph.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

    focusElev.append('circle')
        .attr('r', 6)
        .attr('class', 'chart-elevation-circle')

    focusElev.append('text')
        .attr('x', 9)
        .attr('class', 'elev-text')
        .attr('dy', '.35em');


    function chartMouseover() {
        var x0 = x1.invert(d3.mouse(this)[0]);
        var y0 = elevData[Math.round(x0)];
        var yTemp = tempData[Math.round(x0)];
        var hCoords = queryPoints[Math.round(x0)];
        hover.setLatLng([hCoords[0],hCoords[1]]);
        hover.addTo(map);
        focusElev.attr('transform', 'translate(' + x1(x0) + ',' + y1(y0) + ')');
        focusElev.select('text').text(formatElev(elevData[Math.round(x0)]));
    }
}

map.once('click', startDrawing);

if(window.location.search === '?embed=true'){
    map.scrollWheelZoom.disable();
    var latlngPoint = new L.LatLng(36.07241230197147,-117.081298828125);
    map.fireEvent('click', {
      latlng: latlngPoint,
      layerPoint: map.latLngToLayerPoint(latlngPoint),
      containerPoint: map.latLngToContainerPoint(latlngPoint)
    });
    var latlngPoint2 = new L.LatLng(36.28192129773195,-116.11038208007811);
    map.fireEvent('click', {
      latlng: latlngPoint2,
      layerPoint: map.latLngToLayerPoint(latlngPoint),
      containerPoint: map.latLngToContainerPoint(latlngPoint)
    });
    reduce = 2000000;
    endDrawing();
} else {
    var hash = L.hash(map);
}