var c = document.getElementById('c');

var canvas_width = c.offsetWidth,
    canvas_height = 300;

var sample_coeff = 1 / 0.100303569986;
var sample_sum = 275065462;
var sample_count = 30797;

var colors = ['#604D96', '#D42F8F', '#55BB8C', '#30BCDF'];

function color(i) {
    return colors[i % colors.length];
}

var treemap = d3.layout.treemap()
    .size([canvas_width, canvas_height])
    .sort(function(a, b) {
        return a.value - b.value;
    }).mode('squarify');

var ctx = c.getContext('2d');
c.width = canvas_width;
c.height = canvas_height;

d3.json("js/sampled.json", function(error, root) {

    var data = {
        value:0,
        children: root.map(function(r) {
            return { value: r };
        })
    };

    var map = treemap.nodes(data);
    var n = root.length;
    var limit = 0;
    var limitmax = 1;
    var text_summary = d3.select('.diagram-summary')
        .append('div')
        .attr('class', 'summary');

    function draw() {
        ctx.fillStyle = '#e6e0d5';
        ctx.fillRect(0, 0, canvas_width, canvas_height);
        function position(d, i) {
          if ((d.x / canvas_width) < limit || ((d.x + d.dx) / canvas_width) > limitmax) return;
          if (d.children) return;
          total_sum += +d.value;
          total_count++;
          ctx.fillStyle = (d.children) ? '#F2EFE9' : color(i);
          ctx.fillRect(~~d.x, ~~d.y,
              ~~Math.max(0, d.dx),
              ~~Math.max(0, d.dy));
        }

        var total_sum = 0;
        var total_count = 0;

        map.forEach(position);

        text_summary.html(
            '<span>' + (100 * total_sum / sample_sum).toFixed(2) + '%</span> of changes are submitted by <span>' +
            (100 * total_count / sample_count).toFixed(2) + '%</span> of users');
    }


    (function() {
        var width = canvas_width;
        var height = 300;
        var margin = {top: 0, right: 0, bottom: 0, left: 0};

        var x = d3.scale.linear()
            .range([0, width - 20]);

        var svg = d3.select("#handle").append("svg")
                .style('position', 'absolute')
                .attr("width", width)
                .attr("height", height)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var brush = d3.svg.brush()
            .x(x)
            .extent([0, 1])
            .on("brushstart", brushstart)
            .on("brush", brushmove)
            .on("brushend", brushend);

        var brushg = svg.append("g")
            .attr("class", "brush")
            .call(brush);

        brushg.selectAll('.resize')
            .append('image')
            .attr('xlink:href', function(d, i) {
                return i ? 'images/handle.png' : 'images/handle-right.png';
            })
            .attr("height", height)
            .attr("width", 20);

        brushstart();
        brushmove();

        function brushstart() {
            svg.classed("selecting", true);
        }

        function brushmove() {
            var s = brush.extent();
            limit = s[0];
            limitmax = s[1];
            draw();
        }

        function brushend() {
            svg.classed("selecting", !d3.event.target.empty());
        }
    })();

    draw();
});
