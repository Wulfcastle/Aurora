!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ProjectGraph=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// Shared view for handling events on stats bargraphs.
var d3 = _dereq_('./src/d3-custom.js'),
    Brush = _dereq_('./src/brush'),
    Chart = _dereq_('./src/chart');

var View = Backbone.View.extend({});

View.prototype.events = {
    'click .js-referrers': 'referrers'
};

View.prototype.initialize = function(options) {
    this.id = options.model.url.split('?')[0].split('/').pop();
    this.interval = 'day';
    var day = 864e5;
    this.extent = this.options.extent;
    this.chartObjects = this.options.services.map(function() {
        return Chart();
    });
    this.render();
};

View.prototype.render = function() {
    var el = d3.select(this.$el[0]);

    var account = (this.id === '_all') ? 'staff' : 'user';

    var data = this.options.services.map(function(service) {
        return {
            service: service,
            interval: this.interval,
            data: this.model.attributes[service][(service == 'storage' ? 'used' : 'requests')],
            account: account,
            extent: this.extent,
            current: true
        };
    }.bind(this));

    var chartContainer = el.selectAll('div.charts')
        .data([data]);

    chartContainer.enter()
        .append('div')
        .attr('class', 'charts');

    var chartDivs = chartContainer.selectAll('div.chart')
        .data(function(d) {
            return d;
        }, serviceId);

    chartDivs.enter()
        .append('div')
        .attr('class', 'chart');

    var chartObjects = this.chartObjects;
    chartDivs.each(function(elem, i) {
        d3.select(this).call(chartObjects[i]);
    });

    function serviceId(_) { return _.service; }
    return this;
};

View.prototype.referrers = function(ev) {
    var data = this.model.toJSON();
    data.label = this.options.label;
    data.formattedPeriod = this.extent;
    Views.modal.show('referrers', data);
    analytics.track('Pressed Referrer Button');
    return false;
};

module.exports = View;

},{"./src/brush":2,"./src/chart":3,"./src/d3-custom.js":5}],2:[function(_dereq_,module,exports){
var d3 = _dereq_('./d3-custom.js');

module.exports = function Brush() {
    var event = d3.dispatch('periodBrush', 'periodBrushed');
    var margin = {top: 20, right: 10, bottom: 25, left: 40},
        height = 75 - margin.top - margin.bottom,
        width = 600 - margin.right - margin.left,
        timeInterval = d3.time.day.utc,
        dirty = true,
        interval = 'day';

    // sets limits for the brush
    var day = 864e5,
        todayEnd = d3.time.day.utc.floor(d3.time.day.offset(new Date(), +1)),
        brushYear = [
            +d3.time.day.utc.floor(d3.time.day.offset(new Date(), -365)),
            +todayEnd
        ];

    var x = d3.time.scale.utc(),
        y = d3.scale.linear(),
        xAxis = d3.svg.axis()
            .scale(x)
            .orient('top')
            .ticks(d3.time.month.utc)
            .tickFormat(d3.time.format.utc('%b'))
            .innerTickSize(height),
        extent = [
            +d3.time.day.utc.floor(d3.time.day.offset(new Date(), -30)),
            +todayEnd
        ],
        brush = d3.svg.brush()
            .x(x)
            .extent(extent);

    var brushStart = [];

    function detectSize(selection) {
        width = selection.node().offsetWidth - margin.right - margin.left;
    }

    function br(sel) {
        brush.extent(extent);
        sel.each(function(data) {
            var combined = d3.nest()
                .key(function(_) {
                    return _[0];
                })
                .entries(data.reduce(function(memo, d) {
                    if (d.service == 'storage') return memo;
                    return memo.concat(d.data.map(function(_) {
                        return [_[0], _[1], d.service];
                    }));
                }, []))
                .map(function(_) {
                    return [+_.key, d3.sum(_.values, function(d) { return d[1]; })];
                });
            var selection = d3.select(this);

            var future = [+todayEnd, +brushYear[1]];

            // ENTER:
            var brushDiv = selection
                .selectAll('.brush')
                .data([combined])
                .enter().append('div')
                .attr('class', 'brush');

            if (dirty) {
                detectSize(selection);
                dirty = false;
            }

            var svg = brushDiv.append('svg')
                .attr('height', height + margin.top + margin.bottom)
                .attr('id', 'brush')
               .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            svg.append('rect')
                .attr('class', 'background')
                .attr('height', height);

            svg.append('rect')
                .attr('class', 'future')
                .attr('height', height);

            svg.append('g')
                .attr('class', 'brush-graph');

            x.range([0, width])
                .domain(brushYear);

            brush.extent(brush.extent());

            brush
                .on('brush', brushed)
                .on('brushstart', function() {
                    brushStart = (d3.event.sourceEvent) ?
                        [d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY, d3.event.sourceEvent.clientX - d3.event.sourceEvent.currentTarget.getBoundingClientRect().left] :
                        [];
                })
                .on('brushend', brushEnd);

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + height + ')');

            var gBrush = svg.append('g')
                .attr('class', 'brush control');

            var bars = selection
                .select('.brush-graph')
                .selectAll('rect.bar')
                .data(combined, function(d) { return d[0]; });

            bars.enter().append('rect').attr('class', 'bar');

            // Scales & axes
            y.domain([0, d3.max(combined, function(_) { return _[1]; })])
                .range([height, 0]);

            bars.attr('class', 'bar')
                .attr('width', barWidth)
                .attr('x', function(d) { return x(d[0]); })
                .attr('y', function(d) { return y(d[1]); })
                .attr('height', function(d) { return height - y(d[1]); });

            function barWidth() {
                if (width < 500) return 0;
                var day = 864e5;
                var size = (brushYear[1] - brushYear[0]) / day;
                return Math.floor(width / size);
            }

            // UPDATE:
            selection.select('#brush')
                .attr('width', width +  margin.left + margin.right);

            selection.select('.background')
                .attr('width', width +  margin.left + margin.right);

            selection.select('.future')
                .attr('x', x(future[0]))
                .attr('width', function(){
                    if (future[1] - future[0] === 0) return 0;
                    return width + margin.right - x(future[0]);
                });

            selection.select('.x.axis')
                .call(xAxis);

            selection.select('.brush.control')
                .call(brush)
              .selectAll('rect')
                .attr('height', height);

            // handles for brush!
            gBrush.selectAll('.resize')
                .append('rect')
                .attr('class', function(d){ return 'handle ' + d; })
                .attr('width', 9)
                .attr('height', height + 6)
                .attr('y', -3)
                .attr('rx', 3)
                .attr('ry', 3);

            selection.selectAll('.resize')
                .selectAll('circle')
                .data( [[3, 12],[6,12],
                        [3,16],[6, 16],
                        [3, 20],[6, 20]
                        ])
                .enter().append('circle')
                .attr('class','dot')
                .attr('cx', function(d){
                    return (d3.select(this.parentNode).classed('w')) ?
                        d[0] - 9 :
                        d[0];
                })
                .attr('cy', function(d) {
                    return d[1];
                })
                .attr('r', 1)
                .attr('fill', 'white');

            selection.select('.brush.control')
                .selectAll('.handle')
                .attr('height', height + 6);

            selection.selectAll('.handle.w')
                .attr('x', -9);

            selection.selectAll('.brush.control')
                .selectAll('text')
                .data(['start', 'end'])
                .enter().append('text')
                .attr('y', height + margin.top - 2)
                .attr('x', 0)
                .attr('class', function(d){ return 'small label ' + d; });

            function dateHandles() {
                var brushX = Number(selection.selectAll('.extent').attr('x'));
                var brushWidth = Number(selection.selectAll('.extent').attr('width'));
                var timeFormat = d3.time.format.utc('%b %d');
                var extentStart = new Date(brush.extent()[0]),
                    extentEnd = new Date(brush.extent()[1]);
                var startX = brushX - 45;
                var endX = brushX + brushWidth;

                // if brush is on the far right end
                if (brushX + brushWidth >= width - 40) {
                    endX = brushX + brushWidth - 40;
                    if (brushX >= endX) {
                        startX = endX - 50;
                    }
                }
                // if brush on the far left end
                if (brushX <= 35) {
                    startX = brushX;
                    if (endX <= 80) {
                        endX = startX + 50;
                    }
                }
                if (brush.extent()[1] - extentStart >= day + 1) {
                    selection.selectAll('.start')
                        .text(timeFormat(extentStart))
                        .attr('x', startX);
                    selection.selectAll('.end')
                        .text(timeFormat(extentEnd))
                        .attr('x', endX);
                } else {
                    selection.selectAll('.start')
                        .text(timeFormat(extentStart))
                        .attr('x', (startX === 0) ? startX : startX + 20);
                    selection.selectAll('.end')
                        .text('')
                        .attr('x', endX - 25);
                }
            }

            dateHandles();

            function resize() {
                dirty = true;
                br(selection);
            }

            var throttledResize = _.throttle(resize, 20);
            d3.select(window).on('resize.brush', throttledResize);

            function brushed() {
                var extent0 = brush.extent(),
                extent1;

                var delta = extent0[1] - extent0[0];
                // if dragging, preserve the width of the extent
                if (d3.event.mode === 'move') {
                    var d0 = +d3.time.day.utc.round(extent0[0]),
                        d1 = +d3.time.day.utc.offset(d0, Math.round((extent0[1] - extent0[0]) / day));
                    extent1 = [d0, d1];
                }
                // otherwise, if resizing, round both dates
                else {
                    extent1 = extent0.map(d3.time.day.utc.round);
                    // if empty when rounded, use floor & ceil instead
                    if (extent1[0] >= extent1[1]) {
                        extent1[0] = +d3.time.day.utc.floor(extent0[0]);
                        extent1[1] = +d3.time.day.utc.ceil(extent0[1]);
                    }
                }
                if (extent1[1] > brushYear[1]) extent1[1] = brushYear[1];

                delta = extent1[1] - extent1[0];

                if (delta < day * 14) {
                    timeInterval = d3.time.hour.utc;
                    interval = 'hour';
                } else {
                    timeInterval = d3.time.day.utc;
                    interval = 'day';
                }

                // if the brush is pulled over the edge of either side
                // keeps brush from moving into the future or the past
                // and by setting the delta, avoids stack overflow
                if (extent1[1] - extent1[0] <= day) {
                    if (+extent1[0] <= brushYear[0]) {
                        extent1 = [new Date(brushYear[0]), new Date(brushYear[0] + day)];
                        delta = 0;
                    } else if (+extent1[1] >= brushYear[1]) {
                        extent1 = [new Date(brushYear[1] - day), new Date(brushYear[1])];
                        delta = 0;
                    }
                }

                //reset brush with revised extent snapped to days
                extent = [+extent1[0],+extent1[1]];
                d3.select(this).call(brush.extent(extent));
                event.periodBrush(extent);
            }

            function brushEnd() {
                var extent = brush.extent(),
                    delta = extent[1] - extent[0];

                // checks to see if the mouseup event was essentially a click
                    // event and not dragging the brush
                // if it is, clear the extent of the brush and select the clicked bar
                if (d3.event.sourceEvent &&
                    d3.event.sourceEvent.type === 'mouseup' &
                    brushStart[0] === d3.event.sourceEvent.clientX &&
                    brushStart[1] === d3.event.sourceEvent.clientY) {
                    // if only one day is selected, resize graph
                    if (delta === day) {
                    } else {
                        // if the selection is within the brush, select the day under the mouse event
                        var i = x.invert(brushStart[2]);
                        extent = [timeInterval.floor(i), timeInterval.ceil(i)];
                        brush.clear();
                        d3.select(this).call(brush.extent(extent));
                        dateHandles();
                    }
                }
                extent = brush.extent();
                event.periodBrushed(extent);
            }
        });
    }

    br.extent = function(_) {
        if (!arguments.length) return extent;
        extent = _;
        return br;
    };

    br.brushYear = function(_) {
        if (!arguments.length) return brushYear;
        brushYear = _;
        return br;
    };

    br.brush = brush;

    return d3.rebind(br, event, 'on');
};

},{"./d3-custom.js":5}],3:[function(_dereq_,module,exports){
var d3 = _dereq_('./d3-custom.js'),
    serviceLabel = _dereq_('./constants').serviceLabel;

module.exports = function Chart() {
    var intervals = {
        day: 864e5,
        hour: 36e5
    };

    // defaults
    var margin = {top: 20, right: 10, bottom: 20, left: 40},
        x = d3.time.scale.utc(),
        y = d3.scale.linear(),
        xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .outerTickSize(0)
            .innerTickSize(0)
            .tickFormat(d3.time.format.utc.multi([
                ['%-I %p', function(d) { return d.getUTCHours(); }],
                ['%-d', function(d) { return d.getUTCDate() != 1; }],
                ['%B', function(d) { return d.getMonth(); }],
                ['', function() { return true; }]
            ])),
        yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(4)
            .tickFormat(formatPrefix),
        numberFormat = d3.format(','),
        width,
        dirty = true,
        height = 120 - margin.top - margin.bottom;

    function formatPrefix(tick) {
        if ( tick < 1 ) return;
        if ( tick != Math.round(tick) ) return;
        if ( tick <= 1 ) return tick;
        return d3.format('s')(tick);
    }

    function chart(selection) {

        selection.each(function(data) {
            var id = data.service;
            var extent = data.extent;
            var interval = data.interval;
            var account = data.account;
            var current = data.current;
            var subset = data.data.filter(function(d) {
                return d[0] >= extent[0] && d[0] <= extent[1];
            });
            var chartDiv = d3.select(this)
                .selectAll('div.graph')
                .data([data]);

            // Enter
            var enter = chartDiv.enter()
                .append('div')
                .attr('class', 'space-bottom4 clearfix graph ' + id)
                .attr('id', id);
            var metaEnter = enter
                .append('div')
                .attr('class', 'col2 text-right chart');
            metaEnter.append('h1')
                .attr('class', function(d) { return d.service + '-color'; });
            var label = metaEnter.append('label')
                            .attr('class','small');

            label.append('span')
                .text(function(d) { return serviceLabel[d.service]; });
            label.append('span')
                .attr('class', 'quiet');

            var chartEnter = enter
                .append('div')
                .attr('class', 'col10 chart-wrapper');
            if (dirty) {
                detectSize(chartDiv.select('div.chart-wrapper'));
            }
            var gEnter = chartEnter
                .append('svg')
                .attr('id', function(d) { return d.service + 'chart'; })
                .attr('height', height + margin.top + margin.bottom)
                .attr('width', width + margin.right + margin.left);
            gEnter = gEnter.append('g')
                .attr('class', 'chart-g');
            gEnter.append('defs').append('clipPath')
                .attr('id', 'clip-' + id)
                .append('rect');
            gEnter.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + (height + 5) + ')');
            gEnter.append('g').attr('class', 'y axis');
            gEnter.append('g')
                .attr('class', 'mainChart')
                .attr('clip-path', 'url(#clip-' + id + ')');
            gEnter.append('g')
                .attr('class', 'tooltip')
                .append('text');

            // Update
            chartDiv.select('#'+data.service + 'chart')
                .attr('width', width + margin.left + margin.right);
            chartDiv
                .attr('width', width + margin.left + margin.right);
            chartDiv.select('g.chart-g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            chartDiv.select('#clip-' + id + ' rect')
                .attr('height', height)
                .attr('width', width);
            chartDiv.select('.quiet')
                .text(function(d) {
                    if (account === 'staff') return ' by all users';
                    else return '';
                });

            var bars = chartDiv
                .select('g.mainChart')
                .selectAll('rect.bar')
                .data(subset, function(d) { return d[0]; });

            bars.enter().append('rect').attr('class', 'bar');

            // Scales & axes
            y.domain([0, d3.max(subset, function(_) { return _[1]; })])
                .range([height, 0]);
            x.range([0, width]).domain(extent);
            chartDiv.select('.y.axis').call(yAxis);
            chartDiv.select('.x.axis').call(xAxis);

            bars.attr('class', 'bar ' + data.interval)
                .on('mousemove', mouseover)
                .on('mouseout', mouseout)
                .attr('width', barWidth)
                .attr('x', function(d) { return x(d[0]); })
                .transition()
                .duration(80)
                .attr('y', function(d) { return y(d[1]); })
                .attr('height', function(d) { return height - y(d[1]); });

            bars.exit().remove();

            var amt;
            if (id == 'storage') {
                amt = (subset.length > 0 ? subset[subset.length - 1][1] : 0);
            } else {
                amt = d3.sum(subset, function(d) { return d[1]; });
            }
            chartDiv.select('h1')
                .text(function(){
                    if (id == 'storage') return numeral(amt).format('0.00 b');
                    if (amt > 999) return numeral(amt).format('0.00 a');
                    return amt;
                })
                .attr('title', numberFormat(amt));

            function barWidth() {
                var size = (extent[1] - extent[0]) / intervals[interval];
                return Math.floor((width / size) - 0.5);
            }

            function resize() {
                dirty = true;
                chart(selection);
            }

            var throttledResize = _.throttle(resize, 20);
            d3.select(window).on('resize.' + id, throttledResize);

            // day total on when hovering over bar
            function mouseover(ev) {
                var timeFormat = (interval === 'hour') ?
                    d3.time.format.utc('%I %p on %B %d, %Y') :
                    d3.time.format.utc('%B %d, %Y');

                chartDiv.classed('has-tooltip', true);
                // keep the tooltip from going over the edge
                var translate = x(ev[0]);
                translate = (translate > width - 150) ? width - 150 : translate;
                translate = (translate < 150)? 150 : translate;

                chartDiv.select('.tooltip')
                    .attr('transform', 'translate(' + [translate, -2] + ')')
                    .style('display', '')
                    .attr('text-anchor', 'middle')
                    .select('text')
                    .text(timeFormat(new Date(ev[0])) + ': ')
                    .append('tspan')
                    .attr('class', 'bold')
                    .text(function() {
                        if (id == 'storage') return numeral(ev[1]).format('0.00 b');
                        return numberFormat(ev[1]) + ' ' + serviceLabel[id];
                    });
            }

            function mouseout(ev) {
                chartDiv.classed('has-tooltip', false);

                chartDiv.select('.tooltip')
                    .style('display', 'none');
            }

            function detectSize(selection) {
                width = selection.node().offsetWidth - margin.right - margin.left;
                dirty = false;
            }
        });
    }

    return chart;
};

},{"./constants":4,"./d3-custom.js":5}],4:[function(_dereq_,module,exports){
module.exports.serviceLabel = {
    mapview: 'Map views',
    geocode: 'Geocodes',
    directions: 'Directions',
    storage: 'Data storage',
    tile: 'Tiles',
    static: 'Static maps'
};
},{}],5:[function(_dereq_,module,exports){
!function(){function t(t,n){return n>t?-1:t>n?1:t>=n?0:0/0}function n(t){return null!=t&&!isNaN(t)}function e(t){return{left:function(n,e,r,u){for(arguments.length<3&&(r=0),arguments.length<4&&(u=n.length);u>r;){var i=r+u>>>1;t(n[i],e)<0?r=i+1:u=i}return r},right:function(n,e,r,u){for(arguments.length<3&&(r=0),arguments.length<4&&(u=n.length);u>r;){var i=r+u>>>1;t(n[i],e)>0?u=i:r=i+1}return r}}}function r(t){return t.length}function u(t){for(var n=1;t*n%1;)n*=10;return n}function i(t,n){try{for(var e in n)Object.defineProperty(t.prototype,e,{value:n[e],enumerable:!1})}catch(r){t.prototype=n}}function a(){}function o(t){return Zr+t in this}function s(t){return t=Zr+t,t in this&&delete this[t]}function c(){var t=[];return this.forEach(function(n){t.push(n)}),t}function l(){var t=0;for(var n in this)n.charCodeAt(0)===$r&&++t;return t}function f(){for(var t in this)if(t.charCodeAt(0)===$r)return!1;return!0}function h(){}function g(t){return"function"==typeof t?t:function(){return t}}function p(t,n,e){return function(){var r=e.apply(n,arguments);return r===n?t:r}}function d(t){return t.innerRadius}function m(t){return t.outerRadius}function v(t){return t.startAngle}function y(t){return t.endAngle}function _(t){return t}function b(){return!0}function M(t){return t[0]}function x(t){return t[1]}function w(t){function n(n){function a(){c.push("M",i(t(l),o))}for(var s,c=[],l=[],f=-1,h=n.length,p=g(e),d=g(r);++f<h;)u.call(this,s=n[f],f)?l.push([+p.call(this,s,f),+d.call(this,s,f)]):l.length&&(a(),l=[]);return l.length&&a(),c.length?c.join(""):null}var e=M,r=x,u=b,i=k,a=i.key,o=.7;return n.x=function(t){return arguments.length?(e=t,n):e},n.y=function(t){return arguments.length?(r=t,n):r},n.defined=function(t){return arguments.length?(u=t,n):u},n.interpolate=function(t){return arguments.length?(a="function"==typeof t?i=t:(i=eu.get(t)||k).key,n):a},n.tension=function(t){return arguments.length?(o=t,n):o},n}function k(t){return t.join("L")}function A(t){return k(t)+"Z"}function S(t){for(var n=0,e=t.length,r=t[0],u=[r[0],",",r[1]];++n<e;)u.push("H",(r[0]+(r=t[n])[0])/2,"V",r[1]);return e>1&&u.push("H",r[0]),u.join("")}function T(t){for(var n=0,e=t.length,r=t[0],u=[r[0],",",r[1]];++n<e;)u.push("V",(r=t[n])[1],"H",r[0]);return u.join("")}function N(t){for(var n=0,e=t.length,r=t[0],u=[r[0],",",r[1]];++n<e;)u.push("H",(r=t[n])[0],"V",r[1]);return u.join("")}function C(t,n){return t.length<4?k(t):t[1]+q(t.slice(1,t.length-1),L(t,n))}function D(t,n){return t.length<3?k(t):t[0]+q((t.push(t[0]),t),L([t[t.length-2]].concat(t,[t[1]]),n))}function z(t,n){return t.length<3?k(t):t[0]+q(t,L(t,n))}function q(t,n){if(n.length<1||t.length!=n.length&&t.length!=n.length+2)return k(t);var e=t.length!=n.length,r="",u=t[0],i=t[1],a=n[0],o=a,s=1;if(e&&(r+="Q"+(i[0]-2*a[0]/3)+","+(i[1]-2*a[1]/3)+","+i[0]+","+i[1],u=t[1],s=2),n.length>1){o=n[1],i=t[s],s++,r+="C"+(u[0]+a[0])+","+(u[1]+a[1])+","+(i[0]-o[0])+","+(i[1]-o[1])+","+i[0]+","+i[1];for(var c=2;c<n.length;c++,s++)i=t[s],o=n[c],r+="S"+(i[0]-o[0])+","+(i[1]-o[1])+","+i[0]+","+i[1]}if(e){var l=t[s];r+="Q"+(i[0]+2*o[0]/3)+","+(i[1]+2*o[1]/3)+","+l[0]+","+l[1]}return r}function L(t,n){for(var e,r=[],u=(1-n)/2,i=t[0],a=t[1],o=1,s=t.length;++o<s;)e=i,i=a,a=t[o],r.push([u*(a[0]-e[0]),u*(a[1]-e[1])]);return r}function H(t){if(t.length<3)return k(t);var n=1,e=t.length,r=t[0],u=r[0],i=r[1],a=[u,u,u,(r=t[1])[0]],o=[i,i,i,r[1]],s=[u,",",i,"L",O(iu,a),",",O(iu,o)];for(t.push(t[e-1]);++n<=e;)r=t[n],a.shift(),a.push(r[0]),o.shift(),o.push(r[1]),Y(s,a,o);return t.pop(),s.push("L",r),s.join("")}function F(t){if(t.length<4)return k(t);for(var n,e=[],r=-1,u=t.length,i=[0],a=[0];++r<3;)n=t[r],i.push(n[0]),a.push(n[1]);for(e.push(O(iu,i)+","+O(iu,a)),--r;++r<u;)n=t[r],i.shift(),i.push(n[0]),a.shift(),a.push(n[1]),Y(e,i,a);return e.join("")}function E(t){for(var n,e,r=-1,u=t.length,i=u+4,a=[],o=[];++r<4;)e=t[r%u],a.push(e[0]),o.push(e[1]);for(n=[O(iu,a),",",O(iu,o)],--r;++r<i;)e=t[r%u],a.shift(),a.push(e[0]),o.shift(),o.push(e[1]),Y(n,a,o);return n.join("")}function j(t,n){var e=t.length-1;if(e)for(var r,u,i=t[0][0],a=t[0][1],o=t[e][0]-i,s=t[e][1]-a,c=-1;++c<=e;)r=t[c],u=c/e,r[0]=n*r[0]+(1-n)*(i+u*o),r[1]=n*r[1]+(1-n)*(a+u*s);return H(t)}function O(t,n){return t[0]*n[0]+t[1]*n[1]+t[2]*n[2]+t[3]*n[3]}function Y(t,n,e){t.push("C",O(ru,n),",",O(ru,e),",",O(uu,n),",",O(uu,e),",",O(iu,n),",",O(iu,e))}function I(t,n){return(n[1]-t[1])/(n[0]-t[0])}function U(t){for(var n=0,e=t.length-1,r=[],u=t[0],i=t[1],a=r[0]=I(u,i);++n<e;)r[n]=(a+(a=I(u=i,i=t[n+1])))/2;return r[n]=a,r}function P(t){for(var n,e,r,u,i=[],a=U(t),o=-1,s=t.length-1;++o<s;)n=I(t[o],t[o+1]),Vr(n)<Gr?a[o]=a[o+1]=0:(e=a[o]/n,r=a[o+1]/n,u=e*e+r*r,u>9&&(u=3*n/Math.sqrt(u),a[o]=u*e,a[o+1]=u*r));for(o=-1;++o<=s;)u=(t[Math.min(s,o+1)][0]-t[Math.max(0,o-1)][0])/(6*(1+a[o]*a[o])),i.push([u||0,a[o]*u||0]);return i}function R(t){return t.length<3?k(t):t[0]+q(t,P(t))}function V(t){for(var n,e,r,u=-1,i=t.length;++u<i;)n=t[u],e=n[0],r=n[1]+tu,n[0]=e*Math.cos(r),n[1]=e*Math.sin(r);return t}function Z(t){function n(n){function s(){m.push("M",o(t(y),f),l,c(t(v.reverse()),f),"Z")}for(var h,p,d,m=[],v=[],y=[],_=-1,b=n.length,M=g(e),x=g(u),w=e===r?function(){return p}:g(r),k=u===i?function(){return d}:g(i);++_<b;)a.call(this,h=n[_],_)?(v.push([p=+M.call(this,h,_),d=+x.call(this,h,_)]),y.push([+w.call(this,h,_),+k.call(this,h,_)])):v.length&&(s(),v=[],y=[]);return v.length&&s(),m.length?m.join(""):null}var e=M,r=M,u=0,i=x,a=b,o=k,s=o.key,c=o,l="L",f=.7;return n.x=function(t){return arguments.length?(e=r=t,n):r},n.x0=function(t){return arguments.length?(e=t,n):e},n.x1=function(t){return arguments.length?(r=t,n):r},n.y=function(t){return arguments.length?(u=i=t,n):i},n.y0=function(t){return arguments.length?(u=t,n):u},n.y1=function(t){return arguments.length?(i=t,n):i},n.defined=function(t){return arguments.length?(a=t,n):a},n.interpolate=function(t){return arguments.length?(s="function"==typeof t?o=t:(o=eu.get(t)||k).key,c=o.reverse||o,l=o.closed?"M":"L",n):s},n.tension=function(t){return arguments.length?(f=t,n):f},n}function $(t){return t.source}function X(t){return t.target}function B(t){return t.radius}function W(t){return[t.x,t.y]}function J(t){return function(){var n=t.apply(this,arguments),e=n[0],r=n[1]+tu;return[e*Math.cos(r),e*Math.sin(r)]}}function G(){return 64}function K(){return"circle"}function Q(t){var n=Math.sqrt(t/Br);return"M0,"+n+"A"+n+","+n+" 0 1,1 0,"+-n+"A"+n+","+n+" 0 1,1 0,"+n+"Z"}function tn(){}function nn(t,n,e){return new en(t,n,e)}function en(t,n,e){this.h=t,this.s=n,this.l=e}function rn(t,n,e){function r(t){return t>360?t-=360:0>t&&(t+=360),60>t?i+(a-i)*t/60:180>t?a:240>t?i+(a-i)*(240-t)/60:i}function u(t){return Math.round(255*r(t))}var i,a;return t=isNaN(t)?0:(t%=360)<0?t+360:t,n=isNaN(n)?0:0>n?0:n>1?1:n,e=0>e?0:e>1?1:e,a=.5>=e?e*(1+n):e+n-e*n,i=2*e-a,vn(u(t+120),u(t),u(t-120))}function un(t,n,e){return new an(t,n,e)}function an(t,n,e){this.h=t,this.c=n,this.l=e}function on(t,n,e){return isNaN(t)&&(t=0),isNaN(n)&&(n=0),sn(e,Math.cos(t*=Kr)*n,Math.sin(t)*n)}function sn(t,n,e){return new cn(t,n,e)}function cn(t,n,e){this.l=t,this.a=n,this.b=e}function ln(t,n,e){var r=(t+16)/116,u=r+n/500,i=r-e/200;return u=hn(u)*hu,r=hn(r)*gu,i=hn(i)*pu,vn(pn(3.2404542*u-1.5371385*r-.4985314*i),pn(-.969266*u+1.8760108*r+.041556*i),pn(.0556434*u-.2040259*r+1.0572252*i))}function fn(t,n,e){return t>0?un(Math.atan2(e,n)*Qr,Math.sqrt(n*n+e*e),t):un(0/0,0/0,t)}function hn(t){return t>.206893034?t*t*t:(t-4/29)/7.787037}function gn(t){return t>.008856?Math.pow(t,1/3):7.787037*t+4/29}function pn(t){return Math.round(255*(.00304>=t?12.92*t:1.055*Math.pow(t,1/2.4)-.055))}function dn(t){return vn(t>>16,t>>8&255,255&t)}function mn(t){return dn(t)+""}function vn(t,n,e){return new yn(t,n,e)}function yn(t,n,e){this.r=t,this.g=n,this.b=e}function _n(t){return 16>t?"0"+Math.max(0,t).toString(16):Math.min(255,t).toString(16)}function bn(t,n,e){var r,u,i,a=0,o=0,s=0;if(r=/([a-z]+)\((.*)\)/i.exec(t))switch(u=r[2].split(","),r[1]){case"hsl":return e(parseFloat(u[0]),parseFloat(u[1])/100,parseFloat(u[2])/100);case"rgb":return n(kn(u[0]),kn(u[1]),kn(u[2]))}return(i=vu.get(t))?n(i.r,i.g,i.b):(null==t||"#"!==t.charAt(0)||isNaN(i=parseInt(t.substring(1),16))||(4===t.length?(a=(3840&i)>>4,a=a>>4|a,o=240&i,o=o>>4|o,s=15&i,s=s<<4|s):7===t.length&&(a=(16711680&i)>>16,o=(65280&i)>>8,s=255&i)),n(a,o,s))}function Mn(t,n,e){var r,u,i=Math.min(t/=255,n/=255,e/=255),a=Math.max(t,n,e),o=a-i,s=(a+i)/2;return o?(u=.5>s?o/(a+i):o/(2-a-i),r=t==a?(n-e)/o+(e>n?6:0):n==a?(e-t)/o+2:(t-n)/o+4,r*=60):(r=0/0,u=s>0&&1>s?0:r),nn(r,u,s)}function xn(t,n,e){t=wn(t),n=wn(n),e=wn(e);var r=gn((.4124564*t+.3575761*n+.1804375*e)/hu),u=gn((.2126729*t+.7151522*n+.072175*e)/gu),i=gn((.0193339*t+.119192*n+.9503041*e)/pu);return sn(116*u-16,500*(r-u),200*(u-i))}function wn(t){return(t/=255)<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)}function kn(t){var n=parseFloat(t);return"%"===t.charAt(t.length-1)?Math.round(2.55*n):n}function An(t,n){t=Pr.rgb(t),n=Pr.rgb(n);var e=t.r,r=t.g,u=t.b,i=n.r-e,a=n.g-r,o=n.b-u;return function(t){return"#"+_n(Math.round(e+i*t))+_n(Math.round(r+a*t))+_n(Math.round(u+o*t))}}function Sn(t,n){var e,r={},u={};for(e in t)e in n?r[e]=Dn(t[e],n[e]):u[e]=t[e];for(e in n)e in t||(u[e]=n[e]);return function(t){for(e in r)u[e]=r[e](t);return u}}function Tn(t,n){var e,r=[],u=[],i=t.length,a=n.length,o=Math.min(t.length,n.length);for(e=0;o>e;++e)r.push(Dn(t[e],n[e]));for(;i>e;++e)u[e]=t[e];for(;a>e;++e)u[e]=n[e];return function(t){for(e=0;o>e;++e)u[e]=r[e](t);return u}}function Nn(t,n){return n-=t=+t,function(e){return t+n*e}}function Cn(t,n){var e,r,u,i=yu.lastIndex=_u.lastIndex=0,a=-1,o=[],s=[];for(t+="",n+="";(e=yu.exec(t))&&(r=_u.exec(n));)(u=r.index)>i&&(u=n.substring(i,u),o[a]?o[a]+=u:o[++a]=u),(e=e[0])===(r=r[0])?o[a]?o[a]+=r:o[++a]=r:(o[++a]=null,s.push({i:a,x:Nn(e,r)})),i=_u.lastIndex;return i<n.length&&(u=n.substring(i),o[a]?o[a]+=u:o[++a]=u),o.length<2?s[0]?(n=s[0].x,function(t){return n(t)+""}):function(){return n}:(n=s.length,function(t){for(var e,r=0;n>r;++r)o[(e=s[r]).i]=e.x(t);return o.join("")})}function Dn(t,n){for(var e,r=Pr.interpolators.length;--r>=0&&!(e=Pr.interpolators[r](t,n)););return e}function zn(t,n){return n-=t,function(e){return Math.round(t+n*e)}}function qn(t,n){return n=n-(t=+t)?1/(n-t):0,function(e){return(e-t)*n}}function Ln(t,n){return n=n-(t=+t)?1/(n-t):0,function(e){return Math.max(0,Math.min(1,(e-t)*n))}}function Hn(t,n){return n-(t?Math.ceil(Math.log(t)/Math.LN10):1)}function Fn(t,n){var e=Math.pow(10,3*Vr(8-n));return{scale:n>8?function(t){return t/e}:function(t){return t*e},symbol:t}}function En(t){var n=t.decimal,e=t.thousands,r=t.grouping,u=t.currency,i=r?function(t){for(var n=t.length,u=[],i=0,a=r[0];n>0&&a>0;)u.push(t.substring(n-=a,n+a)),a=r[i=(i+1)%r.length];return u.reverse().join(e)}:_;return function(t){var e=Mu.exec(t),r=e[1]||" ",a=e[2]||">",o=e[3]||"",s=e[4]||"",c=e[5],l=+e[6],f=e[7],h=e[8],g=e[9],p=1,d="",m="",v=!1;switch(h&&(h=+h.substring(1)),(c||"0"===r&&"="===a)&&(c=r="0",a="=",f&&(l-=Math.floor((l-1)/4))),g){case"n":f=!0,g="g";break;case"%":p=100,m="%",g="f";break;case"p":p=100,m="%",g="r";break;case"b":case"o":case"x":case"X":"#"===s&&(d="0"+g.toLowerCase());case"c":case"d":v=!0,h=0;break;case"s":p=-1,g="r"}"$"===s&&(d=u[0],m=u[1]),"r"!=g||h||(g="g"),null!=h&&("g"==g?h=Math.max(1,Math.min(21,h)):("e"==g||"f"==g)&&(h=Math.max(0,Math.min(20,h)))),g=xu.get(g)||jn;var y=c&&f;return function(t){var e=m;if(v&&t%1)return"";var u=0>t||0===t&&0>1/t?(t=-t,"-"):o;if(0>p){var s=Pr.formatPrefix(t,h);t=s.scale(t),e=s.symbol+m}else t*=p;t=g(t,h);var _=t.lastIndexOf("."),b=0>_?t:t.substring(0,_),M=0>_?"":n+t.substring(_+1);!c&&f&&(b=i(b));var x=d.length+b.length+M.length+(y?0:u.length),w=l>x?new Array(x=l-x+1).join(r):"";return y&&(b=i(w+b)),u+=d,t=b+M,("<"===a?u+t+w:">"===a?w+u+t:"^"===a?w.substring(0,x>>=1)+u+t+w.substring(x):u+(y?t:w+t))+e}}}function jn(t){return t+""}function On(){this._=new Date(arguments.length>1?Date.UTC.apply(this,arguments):arguments[0])}function Yn(t,n,e){function r(n){var e=t(n),r=i(e,1);return r-n>n-e?e:r}function u(e){return n(e=t(new Au(e-1)),1),e}function i(t,e){return n(t=new Au(+t),e),t}function a(t,r,i){var a=u(t),o=[];if(i>1)for(;r>a;)e(a)%i||o.push(new Date(+a)),n(a,1);else for(;r>a;)o.push(new Date(+a)),n(a,1);return o}function o(t,n,e){try{Au=On;var r=new On;return r._=t,a(r,n,e)}finally{Au=Date}}t.floor=t,t.round=r,t.ceil=u,t.offset=i,t.range=a;var s=t.utc=In(t);return s.floor=s,s.round=In(r),s.ceil=In(u),s.offset=In(i),s.range=o,t}function In(t){return function(n,e){try{Au=On;var r=new On;return r._=n,t(r,e)._}finally{Au=Date}}}function Un(t){function n(t){function n(n){for(var e,u,i,a=[],o=-1,s=0;++o<r;)37===t.charCodeAt(o)&&(a.push(t.substring(s,o)),null!=(u=Tu[e=t.charAt(++o)])&&(e=t.charAt(++o)),(i=N[e])&&(e=i(n,null==u?"e"===e?" ":"0":u)),a.push(e),s=o+1);return a.push(t.substring(s,o)),a.join("")}var r=t.length;return n.parse=function(n){var r={y:1900,m:0,d:1,H:0,M:0,S:0,L:0,Z:null},u=e(r,t,n,0);if(u!=n.length)return null;"p"in r&&(r.H=r.H%12+12*r.p);var i=null!=r.Z&&Au!==On,a=new(i?On:Au);return"j"in r?a.setFullYear(r.y,0,r.j):"w"in r&&("W"in r||"U"in r)?(a.setFullYear(r.y,0,1),a.setFullYear(r.y,0,"W"in r?(r.w+6)%7+7*r.W-(a.getDay()+5)%7:r.w+7*r.U-(a.getDay()+6)%7)):a.setFullYear(r.y,r.m,r.d),a.setHours(r.H+Math.floor(r.Z/100),r.M+r.Z%100,r.S,r.L),i?a._:a},n.toString=function(){return t},n}function e(t,n,e,r){for(var u,i,a,o=0,s=n.length,c=e.length;s>o;){if(r>=c)return-1;if(u=n.charCodeAt(o++),37===u){if(a=n.charAt(o++),i=C[a in Tu?n.charAt(o++):a],!i||(r=i(t,e,r))<0)return-1}else if(u!=e.charCodeAt(r++))return-1}return r}function r(t,n,e){x.lastIndex=0;var r=x.exec(n.substring(e));return r?(t.w=w.get(r[0].toLowerCase()),e+r[0].length):-1}function u(t,n,e){b.lastIndex=0;var r=b.exec(n.substring(e));return r?(t.w=M.get(r[0].toLowerCase()),e+r[0].length):-1}function i(t,n,e){S.lastIndex=0;var r=S.exec(n.substring(e));return r?(t.m=T.get(r[0].toLowerCase()),e+r[0].length):-1}function a(t,n,e){k.lastIndex=0;var r=k.exec(n.substring(e));return r?(t.m=A.get(r[0].toLowerCase()),e+r[0].length):-1}function o(t,n,r){return e(t,N.c.toString(),n,r)}function s(t,n,r){return e(t,N.x.toString(),n,r)}function c(t,n,r){return e(t,N.X.toString(),n,r)}function l(t,n,e){var r=_.get(n.substring(e,e+=2).toLowerCase());return null==r?-1:(t.p=r,e)}var f=t.dateTime,h=t.date,g=t.time,p=t.periods,d=t.days,m=t.shortDays,v=t.months,y=t.shortMonths;n.utc=function(t){function e(t){try{Au=On;var n=new Au;return n._=t,r(n)}finally{Au=Date}}var r=n(t);return e.parse=function(t){try{Au=On;var n=r.parse(t);return n&&n._}finally{Au=Date}},e.toString=r.toString,e},n.multi=n.utc.multi=oe;var _=Pr.map(),b=Rn(d),M=Vn(d),x=Rn(m),w=Vn(m),k=Rn(v),A=Vn(v),S=Rn(y),T=Vn(y);p.forEach(function(t,n){_.set(t.toLowerCase(),n)});var N={a:function(t){return m[t.getDay()]},A:function(t){return d[t.getDay()]},b:function(t){return y[t.getMonth()]},B:function(t){return v[t.getMonth()]},c:n(f),d:function(t,n){return Pn(t.getDate(),n,2)},e:function(t,n){return Pn(t.getDate(),n,2)},H:function(t,n){return Pn(t.getHours(),n,2)},I:function(t,n){return Pn(t.getHours()%12||12,n,2)},j:function(t,n){return Pn(1+ku.dayOfYear(t),n,3)},L:function(t,n){return Pn(t.getMilliseconds(),n,3)},m:function(t,n){return Pn(t.getMonth()+1,n,2)},M:function(t,n){return Pn(t.getMinutes(),n,2)},p:function(t){return p[+(t.getHours()>=12)]},S:function(t,n){return Pn(t.getSeconds(),n,2)},U:function(t,n){return Pn(ku.sundayOfYear(t),n,2)},w:function(t){return t.getDay()},W:function(t,n){return Pn(ku.mondayOfYear(t),n,2)},x:n(h),X:n(g),y:function(t,n){return Pn(t.getFullYear()%100,n,2)},Y:function(t,n){return Pn(t.getFullYear()%1e4,n,4)},Z:ie,"%":function(){return"%"}},C={a:r,A:u,b:i,B:a,c:o,d:Qn,e:Qn,H:ne,I:ne,j:te,L:ue,m:Kn,M:ee,p:l,S:re,U:$n,w:Zn,W:Xn,x:s,X:c,y:Wn,Y:Bn,Z:Jn,"%":ae};return n}function Pn(t,n,e){var r=0>t?"-":"",u=(r?-t:t)+"",i=u.length;return r+(e>i?new Array(e-i+1).join(n)+u:u)}function Rn(t){return new RegExp("^(?:"+t.map(Pr.requote).join("|")+")","i")}function Vn(t){for(var n=new a,e=-1,r=t.length;++e<r;)n.set(t[e].toLowerCase(),e);return n}function Zn(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+1));return r?(t.w=+r[0],e+r[0].length):-1}function $n(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e));return r?(t.U=+r[0],e+r[0].length):-1}function Xn(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e));return r?(t.W=+r[0],e+r[0].length):-1}function Bn(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+4));return r?(t.y=+r[0],e+r[0].length):-1}function Wn(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+2));return r?(t.y=Gn(+r[0]),e+r[0].length):-1}function Jn(t,n,e){return/^[+-]\d{4}$/.test(n=n.substring(e,e+5))?(t.Z=-n,e+5):-1}function Gn(t){return t+(t>68?1900:2e3)}function Kn(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+2));return r?(t.m=r[0]-1,e+r[0].length):-1}function Qn(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+2));return r?(t.d=+r[0],e+r[0].length):-1}function te(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+3));return r?(t.j=+r[0],e+r[0].length):-1}function ne(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+2));return r?(t.H=+r[0],e+r[0].length):-1}function ee(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+2));return r?(t.M=+r[0],e+r[0].length):-1}function re(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+2));return r?(t.S=+r[0],e+r[0].length):-1}function ue(t,n,e){Nu.lastIndex=0;var r=Nu.exec(n.substring(e,e+3));return r?(t.L=+r[0],e+r[0].length):-1}function ie(t){var n=t.getTimezoneOffset(),e=n>0?"-":"+",r=~~(Vr(n)/60),u=Vr(n)%60;return e+Pn(r,"0",2)+Pn(u,"0",2)}function ae(t,n,e){Cu.lastIndex=0;var r=Cu.exec(n.substring(e,e+1));return r?e+r[0].length:-1}function oe(t){for(var n=t.length,e=-1;++e<n;)t[e][0]=this(t[e][0]);return function(n){for(var e=0,r=t[e];!r[1](n);)r=t[++e];return r[0](n)}}function se(t,n,e,r){var u=e(t[0],t[1]),i=r(n[0],n[1]);return function(t){return i(u(t))}}function ce(t,n){var e,r=0,u=t.length-1,i=t[r],a=t[u];return i>a&&(e=r,r=u,u=e,e=i,i=a,a=e),t[r]=n.floor(i),t[u]=n.ceil(a),t}function le(t){return t?{floor:function(n){return Math.floor(n/t)*t},ceil:function(n){return Math.ceil(n/t)*t}}:zu}function fe(t,n,e,r){var u=[],i=[],a=0,o=Math.min(t.length,n.length)-1;for(t[o]<t[0]&&(t=t.slice().reverse(),n=n.slice().reverse());++a<=o;)u.push(e(t[a-1],t[a])),i.push(r(n[a-1],n[a]));return function(n){var e=Pr.bisect(t,n,1,o)-1;return i[e](u[e](n))}}function he(t){var n=t[0],e=t[t.length-1];return e>n?[n,e]:[e,n]}function ge(t){return t.rangeExtent?t.rangeExtent():he(t.range())}function pe(t,n,e,r){function u(){var u=Math.min(t.length,n.length)>2?fe:se,s=r?Ln:qn;return a=u(t,n,s,e),o=u(n,t,s,Dn),i}function i(t){return a(t)}var a,o;return i.invert=function(t){return o(t)},i.domain=function(n){return arguments.length?(t=n.map(Number),u()):t},i.range=function(t){return arguments.length?(n=t,u()):n},i.rangeRound=function(t){return i.range(t).interpolate(zn)},i.clamp=function(t){return arguments.length?(r=t,u()):r},i.interpolate=function(t){return arguments.length?(e=t,u()):e},i.ticks=function(n){return ye(t,n)},i.tickFormat=function(n,e){return _e(t,n,e)},i.nice=function(n){return me(t,n),u()},i.copy=function(){return pe(t,n,e,r)},u()}function de(t,n){return Pr.rebind(t,n,"range","rangeRound","interpolate","clamp")}function me(t,n){return ce(t,le(ve(t,n)[2]))}function ve(t,n){null==n&&(n=10);var e=he(t),r=e[1]-e[0],u=Math.pow(10,Math.floor(Math.log(r/n)/Math.LN10)),i=n/r*u;return.15>=i?u*=10:.35>=i?u*=5:.75>=i&&(u*=2),e[0]=Math.ceil(e[0]/u)*u,e[1]=Math.floor(e[1]/u)*u+.5*u,e[2]=u,e}function ye(t,n){return Pr.range.apply(Pr,ve(t,n))}function _e(t,n,e){var r=ve(t,n);if(e){var u=Mu.exec(e);if(u.shift(),"s"===u[8]){var i=Pr.formatPrefix(Math.max(Vr(r[0]),Vr(r[1])));return u[7]||(u[7]="."+be(i.scale(r[2]))),u[8]="f",e=Pr.format(u.join("")),function(t){return e(i.scale(t))+i.symbol}}u[7]||(u[7]="."+Me(u[8],r)),e=u.join("")}else e=",."+be(r[2])+"f";return Pr.format(e)}function be(t){return-Math.floor(Math.log(t)/Math.LN10+.01)}function Me(t,n){var e=be(n[2]);return t in qu?Math.abs(e-be(Math.max(Vr(n[0]),Vr(n[1]))))+ +("e"!==t):e-2*("%"===t)}function xe(t,n){if(n in t)return n;n=n.charAt(0).toUpperCase()+n.substring(1);for(var e=0,r=Iu.length;r>e;++e){var u=Iu[e]+n;if(u in t)return u}}function we(t){return Yu(t,Zu),t}function ke(t){return"function"==typeof t?t:function(){return Uu(t,this)}}function Ae(t){return"function"==typeof t?t:function(){return Pu(t,this)}}function Se(t,n){function e(){this.removeAttribute(t)}function r(){this.removeAttributeNS(t.space,t.local)}function u(){this.setAttribute(t,n)}function i(){this.setAttributeNS(t.space,t.local,n)}function a(){var e=n.apply(this,arguments);null==e?this.removeAttribute(t):this.setAttribute(t,e)}function o(){var e=n.apply(this,arguments);null==e?this.removeAttributeNS(t.space,t.local):this.setAttributeNS(t.space,t.local,e)}return t=Pr.ns.qualify(t),null==n?t.local?r:e:"function"==typeof n?t.local?o:a:t.local?i:u}function Te(t){return t.trim().replace(/\s+/g," ")}function Ne(t){return new RegExp("(?:^|\\s+)"+Pr.requote(t)+"(?:\\s+|$)","g")}function Ce(t){return t.trim().split(/^|\s+/)}function De(t,n){function e(){for(var e=-1;++e<u;)t[e](this,n)}function r(){for(var e=-1,r=n.apply(this,arguments);++e<u;)t[e](this,r)}t=Ce(t).map(ze);var u=t.length;return"function"==typeof n?r:e}function ze(t){var n=Ne(t);return function(e,r){if(u=e.classList)return r?u.add(t):u.remove(t);var u=e.getAttribute("class")||"";r?(n.lastIndex=0,n.test(u)||e.setAttribute("class",Te(u+" "+t))):e.setAttribute("class",Te(u.replace(n," ")))}}function qe(t,n,e){function r(){this.style.removeProperty(t)}function u(){this.style.setProperty(t,n,e)}function i(){var r=n.apply(this,arguments);null==r?this.style.removeProperty(t):this.style.setProperty(t,r,e)}return null==n?r:"function"==typeof n?i:u}function Le(t,n){function e(){delete this[t]}function r(){this[t]=n}function u(){var e=n.apply(this,arguments);null==e?delete this[t]:this[t]=e}return null==n?e:"function"==typeof n?u:r}function He(t){return"function"==typeof t?t:(t=Pr.ns.qualify(t)).local?function(){return this.ownerDocument.createElementNS(t.space,t.local)}:function(){return this.ownerDocument.createElementNS(this.namespaceURI,t)}}function Fe(t){return{__data__:t}}function Ee(t){return function(){return Vu(this,t)}}function je(n){return arguments.length||(n=t),function(t,e){return t&&e?n(t.__data__,e.__data__):!t-!e}}function Oe(){}function Ye(){}function Ie(t){function n(){for(var n,r=e,u=-1,i=r.length;++u<i;)(n=r[u].on)&&n.apply(this,arguments);return t}var e=[],r=new a;return n.on=function(n,u){var i,a=r.get(n);return arguments.length<2?a&&a.on:(a&&(a.on=null,e=e.slice(0,i=e.indexOf(a)).concat(e.slice(i+1)),r.remove(n)),u&&e.push(r.set(n,{on:u})),t)},n}function Ue(){Pr.event.preventDefault()}function Pe(){for(var t,n=Pr.event;t=n.sourceEvent;)n=t;return n}function Re(t){for(var n=new Ye,e=0,r=arguments.length;++e<r;)n[arguments[e]]=Ie(n);return n.of=function(e,r){return function(u){try{var i=u.sourceEvent=Pr.event;u.target=t,Pr.event=u,n[u.type].apply(e,r)}finally{Pr.event=i}}},n}function Ve(t,n,e){function r(){var n=this[a];n&&(this.removeEventListener(t,n,n.$),delete this[a])}function u(){var u=s(n,Hu(arguments));r.call(this),this.addEventListener(t,this[a]=u,u.$=e),u._=n}function i(){var n,e=new RegExp("^__on([^.]+)"+Pr.requote(t)+"$");for(var r in this)if(n=r.match(e)){var u=this[r];this.removeEventListener(n[1],u,u.$),delete this[r]}}var a="__on"+t,o=t.indexOf("."),s=Ze;o>0&&(t=t.substring(0,o));var c=$u.get(t);return c&&(t=c,s=$e),o?n?u:r:n?Oe:i}function Ze(t,n){return function(e){var r=Pr.event;Pr.event=e,n[0]=this.__data__;try{t.apply(this,n)}finally{Pr.event=r}}}function $e(t,n){var e=Ze(t,n);return function(t){var n=this,r=t.relatedTarget;r&&(r===n||8&r.compareDocumentPosition(n))||e.call(n,t)}}function Xe(t,n){for(var e=0,r=t.length;r>e;e++)for(var u,i=t[e],a=0,o=i.length;o>a;a++)(u=i[a])&&n(u,a,e);return t}function Be(t){return Yu(t,Xu),t}function We(t){var n,e;return function(r,u,i){var a,o=t[i].update,s=o.length;for(i!=e&&(e=i,n=0),u>=n&&(n=u+1);!(a=o[n])&&++n<s;);return a}}function Je(){var t=this.__transition__;t&&++t.active}function Ge(){var t=Ke(),n=Qe()-t;n>24?(isFinite(n)&&(clearTimeout(Gu),Gu=setTimeout(Ge,n)),Ju=0):(Ju=1,ti(Ge))}function Ke(){var t=Date.now();for(Ku=Bu;Ku;)t>=Ku.t&&(Ku.f=Ku.c(t-Ku.t)),Ku=Ku.n;return t}function Qe(){for(var t,n=Bu,e=1/0;n;)n.f?n=t?t.n=n.n:Bu=n.n:(n.t<e&&(e=n.t),n=(t=n).n);return Wu=t,e}function tr(t){return function(n){return 0>=n?0:n>=1?1:t(n)}}function nr(t){return function(n){return 1-t(1-n)}}function er(t){return function(n){return.5*(.5>n?t(2*n):2-t(2-2*n))}}function rr(t){return t*t}function ur(t){return t*t*t}function ir(t){if(0>=t)return 0;if(t>=1)return 1;var n=t*t,e=n*t;return 4*(.5>t?e:3*(t-n)+e-.75)}function ar(t){return function(n){return Math.pow(n,t)}}function or(t){return 1-Math.cos(t*Jr)}function sr(t){return Math.pow(2,10*(t-1))}function cr(t){return 1-Math.sqrt(1-t*t)}function lr(t,n){var e;return arguments.length<2&&(n=.45),arguments.length?e=n/Wr*Math.asin(1/t):(t=1,e=n/4),function(r){return 1+t*Math.pow(2,-10*r)*Math.sin((r-e)*Wr/n)}}function fr(t){return t||(t=1.70158),function(n){return n*n*((t+1)*n-t)}}function hr(t){return 1/2.75>t?7.5625*t*t:2/2.75>t?7.5625*(t-=1.5/2.75)*t+.75:2.5/2.75>t?7.5625*(t-=2.25/2.75)*t+.9375:7.5625*(t-=2.625/2.75)*t+.984375}function gr(t,n){return Yu(t,ai),t.id=n,t}function pr(t){var n=[t.a,t.b],e=[t.c,t.d],r=mr(n),u=dr(n,e),i=mr(vr(e,n,-u))||0;n[0]*e[1]<e[0]*n[1]&&(n[0]*=-1,n[1]*=-1,r*=-1,u*=-1),this.rotate=(r?Math.atan2(n[1],n[0]):Math.atan2(-e[0],e[1]))*Qr,this.translate=[t.e,t.f],this.scale=[r,i],this.skew=i?Math.atan2(u,i)*Qr:0}function dr(t,n){return t[0]*n[0]+t[1]*n[1]}function mr(t){var n=Math.sqrt(dr(t,t));return n&&(t[0]/=n,t[1]/=n),n}function vr(t,n,e){return t[0]+=e*n[0],t[1]+=e*n[1],t}function yr(t,n){var e,r=[],u=[],i=Pr.transform(t),a=Pr.transform(n),o=i.translate,s=a.translate,c=i.rotate,l=a.rotate,f=i.skew,h=a.skew,g=i.scale,p=a.scale;return o[0]!=s[0]||o[1]!=s[1]?(r.push("translate(",null,",",null,")"),u.push({i:1,x:Nn(o[0],s[0])},{i:3,x:Nn(o[1],s[1])})):r.push(s[0]||s[1]?"translate("+s+")":""),c!=l?(c-l>180?l+=360:l-c>180&&(c+=360),u.push({i:r.push(r.pop()+"rotate(",null,")")-2,x:Nn(c,l)})):l&&r.push(r.pop()+"rotate("+l+")"),f!=h?u.push({i:r.push(r.pop()+"skewX(",null,")")-2,x:Nn(f,h)}):h&&r.push(r.pop()+"skewX("+h+")"),g[0]!=p[0]||g[1]!=p[1]?(e=r.push(r.pop()+"scale(",null,",",null,")"),u.push({i:e-4,x:Nn(g[0],p[0])},{i:e-2,x:Nn(g[1],p[1])})):(1!=p[0]||1!=p[1])&&r.push(r.pop()+"scale("+p+")"),e=u.length,function(t){for(var n,i=-1;++i<e;)r[(n=u[i]).i]=n.x(t);return r.join("")}}function _r(t,n,e,r){var u=t.id;return Xe(t,"function"==typeof e?function(t,i,a){t.__transition__[u].tween.set(n,r(e.call(t,t.__data__,i,a)))}:(e=r(e),function(t){t.__transition__[u].tween.set(n,e)}))}function br(t){return null==t&&(t=""),function(){this.textContent=t}}function Mr(t,n,e,r){var u=t.__transition__||(t.__transition__={active:0,count:0}),i=u[e];if(!i){var o=r.time;i=u[e]={tween:new a,time:o,ease:r.ease,delay:r.delay,duration:r.duration},++u.count,Pr.timer(function(r){function a(r){return u.active>e?c():(u.active=e,i.event&&i.event.start.call(t,l,n),i.tween.forEach(function(e,r){(r=r.call(t,l,n))&&d.push(r)}),void Pr.timer(function(){return p.c=s(r||1)?b:s,1},0,o))}function s(r){if(u.active!==e)return c();for(var a=r/g,o=f(a),s=d.length;s>0;)d[--s].call(t,o);return a>=1?(i.event&&i.event.end.call(t,l,n),c()):void 0}function c(){return--u.count?delete u[e]:delete t.__transition__,1}var l=t.__data__,f=i.ease,h=i.delay,g=i.duration,p=Ku,d=[];return p.t=h+o,r>=h?a(r-h):void(p.c=a)},0,o)}}function xr(t,n){t.attr("transform",function(t){return"translate("+n(t)+",0)"})}function wr(t,n){t.attr("transform",function(t){return"translate(0,"+n(t)+")"})}function kr(){var t=".dragsuppress-"+ ++hi,n="click"+t,e=Pr.select(ju).on("touchmove"+t,Ue).on("dragstart"+t,Ue).on("selectstart"+t,Ue);if(fi){var r=Eu.style,u=r[fi];r[fi]="none"}return function(i){function a(){e.on(n,null)}e.on(t,null),fi&&(r[fi]=u),i&&(e.on(n,function(){Ue(),a()},!0),setTimeout(a,0))}}function Ar(t,n){n.changedTouches&&(n=n.changedTouches[0]);var e=t.ownerSVGElement||t;if(e.createSVGPoint){var r=e.createSVGPoint();return r.x=n.clientX,r.y=n.clientY,r=r.matrixTransform(t.getScreenCTM().inverse()),[r.x,r.y]}var u=t.getBoundingClientRect();return[n.clientX-u.left-t.clientLeft,n.clientY-u.top-t.clientTop]}function Sr(t,n,e,r){function u(t){return(e?Math.log(0>t?0:t):-Math.log(t>0?0:-t))/Math.log(n)}function i(t){return e?Math.pow(n,t):-Math.pow(n,-t)}function a(n){return t(u(n))}return a.invert=function(n){return i(t.invert(n))},a.domain=function(n){return arguments.length?(e=n[0]>=0,t.domain((r=n.map(Number)).map(u)),a):r},a.base=function(e){return arguments.length?(n=+e,t.domain(r.map(u)),a):n},a.nice=function(){var n=ce(r.map(u),e?Math:mi);return t.domain(n),r=n.map(i),a},a.ticks=function(){var t=he(r),a=[],o=t[0],s=t[1],c=Math.floor(u(o)),l=Math.ceil(u(s)),f=n%1?2:n;if(isFinite(l-c)){if(e){for(;l>c;c++)for(var h=1;f>h;h++)a.push(i(c)*h);a.push(i(c))}else for(a.push(i(c));c++<l;)for(var h=f-1;h>0;h--)a.push(i(c)*h);for(c=0;a[c]<o;c++);for(l=a.length;a[l-1]>s;l--);a=a.slice(c,l)}return a},a.tickFormat=function(t,n){if(!arguments.length)return di;arguments.length<2?n=di:"function"!=typeof n&&(n=Pr.format(n));var r,o=Math.max(.1,t/a.ticks().length),s=e?(r=1e-12,Math.ceil):(r=-1e-12,Math.floor);return function(t){return t/i(s(u(t)+r))<=o?n(t):""}},a.copy=function(){return Sr(t.copy(),n,e,r)},de(a,t)}function Tr(t,n,e){function r(n){return t(u(n))}var u=Nr(n),i=Nr(1/n);return r.invert=function(n){return i(t.invert(n))},r.domain=function(n){return arguments.length?(t.domain((e=n.map(Number)).map(u)),r):e},r.ticks=function(t){return ye(e,t)},r.tickFormat=function(t,n){return _e(e,t,n)},r.nice=function(t){return r.domain(me(e,t))},r.exponent=function(a){return arguments.length?(u=Nr(n=a),i=Nr(1/n),t.domain(e.map(u)),r):n},r.copy=function(){return Tr(t.copy(),n,e)},de(r,t)}function Nr(t){return function(n){return 0>n?-Math.pow(-n,t):Math.pow(n,t)}}function Cr(t,n){function e(e){return i[((u.get(e)||("range"===n.t?u.set(e,t.push(e)):0/0))-1)%i.length]}function r(n,e){return Pr.range(t.length).map(function(t){return n+e*t})}var u,i,o;return e.domain=function(r){if(!arguments.length)return t;t=[],u=new a;for(var i,o=-1,s=r.length;++o<s;)u.has(i=r[o])||u.set(i,t.push(i));return e[n.t].apply(e,n.a)},e.range=function(t){return arguments.length?(i=t,o=0,n={t:"range",a:arguments},e):i},e.rangePoints=function(u,a){arguments.length<2&&(a=0);var s=u[0],c=u[1],l=(c-s)/(Math.max(1,t.length-1)+a);return i=r(t.length<2?(s+c)/2:s+l*a/2,l),o=0,n={t:"rangePoints",a:arguments},e},e.rangeBands=function(u,a,s){arguments.length<2&&(a=0),arguments.length<3&&(s=a);var c=u[1]<u[0],l=u[c-0],f=u[1-c],h=(f-l)/(t.length-a+2*s);return i=r(l+h*s,h),c&&i.reverse(),o=h*(1-a),n={t:"rangeBands",a:arguments},e},e.rangeRoundBands=function(u,a,s){arguments.length<2&&(a=0),arguments.length<3&&(s=a);var c=u[1]<u[0],l=u[c-0],f=u[1-c],h=Math.floor((f-l)/(t.length-a+2*s)),g=f-l-(t.length-a)*h;return i=r(l+Math.round(g/2),h),c&&i.reverse(),o=Math.round(h*(1-a)),n={t:"rangeRoundBands",a:arguments},e},e.rangeBand=function(){return o},e.rangeExtent=function(){return he(n.a[0])},e.copy=function(){return Cr(t,n)},e.domain(t)}function Dr(e,r){function u(){var t=0,n=r.length;for(a=[];++t<n;)a[t-1]=Pr.quantile(e,t/n);return i}function i(t){return isNaN(t=+t)?void 0:r[Pr.bisect(a,t)]}var a;return i.domain=function(r){return arguments.length?(e=r.filter(n).sort(t),u()):e},i.range=function(t){return arguments.length?(r=t,u()):r},i.quantiles=function(){return a},i.invertExtent=function(t){return t=r.indexOf(t),0>t?[0/0,0/0]:[t>0?a[t-1]:e[0],t<a.length?a[t]:e[e.length-1]]},i.copy=function(){return Dr(e,r)},u()}function zr(t,n,e){function r(n){return e[Math.max(0,Math.min(a,Math.floor(i*(n-t))))]
}function u(){return i=e.length/(n-t),a=e.length-1,r}var i,a;return r.domain=function(e){return arguments.length?(t=+e[0],n=+e[e.length-1],u()):[t,n]},r.range=function(t){return arguments.length?(e=t,u()):e},r.invertExtent=function(n){return n=e.indexOf(n),n=0>n?0/0:n/i+t,[n,n+1/i]},r.copy=function(){return zr(t,n,e)},u()}function qr(t,n){function e(e){return e>=e?n[Pr.bisect(t,e)]:void 0}return e.domain=function(n){return arguments.length?(t=n,e):t},e.range=function(t){return arguments.length?(n=t,e):n},e.invertExtent=function(e){return e=n.indexOf(e),[t[e-1],t[e]]},e.copy=function(){return qr(t,n)},e}function Lr(t){function n(t){return+t}return n.invert=n,n.domain=n.range=function(e){return arguments.length?(t=e.map(n),n):t},n.ticks=function(n){return ye(t,n)},n.tickFormat=function(n,e){return _e(t,n,e)},n.copy=function(){return Lr(t)},n}function Hr(t){return t.toISOString()}function Fr(t,n,e){function r(n){return t(n)}function u(t,e){var r=t[1]-t[0],u=r/e,i=Pr.bisect(ki,u);return i==ki.length?[n.year,ve(t.map(function(t){return t/31536e6}),e)[2]]:i?n[u/ki[i-1]<ki[i]/u?i-1:i]:[Ti,ve(t,e)[2]]}return r.invert=function(n){return Er(t.invert(n))},r.domain=function(n){return arguments.length?(t.domain(n),r):t.domain().map(Er)},r.nice=function(t,n){function e(e){return!isNaN(e)&&!t.range(e,Er(+e+1),n).length}var i=r.domain(),a=he(i),o=null==t?u(a,10):"number"==typeof t&&u(a,t);return o&&(t=o[0],n=o[1]),r.domain(ce(i,n>1?{floor:function(n){for(;e(n=t.floor(n));)n=Er(n-1);return n},ceil:function(n){for(;e(n=t.ceil(n));)n=Er(+n+1);return n}}:t))},r.ticks=function(t,n){var e=he(r.domain()),i=null==t?u(e,10):"number"==typeof t?u(e,t):!t.range&&[{range:t},n];return i&&(t=i[0],n=i[1]),t.range(e[0],Er(+e[1]+1),1>n?1:n)},r.tickFormat=function(){return e},r.copy=function(){return Fr(t.copy(),n,e)},de(r,t)}function Er(t){return new Date(t)}function jr(t){return function(n,e,r){return 2===arguments.length&&"function"==typeof e&&(r=e,e=null),Or(n,e,t,r)}}function Or(t,n,e,r){function u(){var t,n=s.status;if(!n&&s.responseText||n>=200&&300>n||304===n){try{t=e.call(i,s)}catch(r){return void a.error.call(i,r)}a.load.call(i,t)}else a.error.call(i,s)}var i={},a=Pr.dispatch("beforesend","progress","load","error"),o={},s=new XMLHttpRequest,c=null;return!ju.XDomainRequest||"withCredentials"in s||!/^(http(s)?:)?\/\//.test(t)||(s=new XDomainRequest),"onload"in s?s.onload=s.onerror=u:s.onreadystatechange=function(){s.readyState>3&&u()},s.onprogress=function(t){var n=Pr.event;Pr.event=t;try{a.progress.call(i,s)}finally{Pr.event=n}},i.header=function(t,n){return t=(t+"").toLowerCase(),arguments.length<2?o[t]:(null==n?delete o[t]:o[t]=n+"",i)},i.mimeType=function(t){return arguments.length?(n=null==t?null:t+"",i):n},i.responseType=function(t){return arguments.length?(c=t,i):c},i.response=function(t){return e=t,i},["get","post"].forEach(function(t){i[t]=function(){return i.send.apply(i,[t].concat(Hu(arguments)))}}),i.send=function(e,r,u){if(2===arguments.length&&"function"==typeof r&&(u=r,r=null),s.open(e,t,!0),null==n||"accept"in o||(o.accept=n+",*/*"),s.setRequestHeader)for(var l in o)s.setRequestHeader(l,o[l]);return null!=n&&s.overrideMimeType&&s.overrideMimeType(n),null!=c&&(s.responseType=c),null!=u&&i.on("error",u).on("load",function(t){u(null,t)}),a.beforesend.call(i,s),s.send(null==r?null:r),i},i.abort=function(){return s.abort(),i},Pr.rebind(i,a,"on"),null==r?i:i.get(Yr(r))}function Yr(t){return 1===t.length?function(n,e){t(null==n?e:null)}:t}function Ir(t){return JSON.parse(t.responseText)}function Ur(t){var n=Fu.createRange();return n.selectNode(Fu.body),n.createContextualFragment(t.responseText)}var Pr={version:"3.4.6"};Pr.ascending=t,Pr.descending=function(t,n){return t>n?-1:n>t?1:n>=t?0:0/0},Pr.min=function(t,n){var e,r,u=-1,i=t.length;if(1===arguments.length){for(;++u<i&&!(null!=(e=t[u])&&e>=e);)e=void 0;for(;++u<i;)null!=(r=t[u])&&e>r&&(e=r)}else{for(;++u<i&&!(null!=(e=n.call(t,t[u],u))&&e>=e);)e=void 0;for(;++u<i;)null!=(r=n.call(t,t[u],u))&&e>r&&(e=r)}return e},Pr.max=function(t,n){var e,r,u=-1,i=t.length;if(1===arguments.length){for(;++u<i&&!(null!=(e=t[u])&&e>=e);)e=void 0;for(;++u<i;)null!=(r=t[u])&&r>e&&(e=r)}else{for(;++u<i&&!(null!=(e=n.call(t,t[u],u))&&e>=e);)e=void 0;for(;++u<i;)null!=(r=n.call(t,t[u],u))&&r>e&&(e=r)}return e},Pr.extent=function(t,n){var e,r,u,i=-1,a=t.length;if(1===arguments.length){for(;++i<a&&!(null!=(e=u=t[i])&&e>=e);)e=u=void 0;for(;++i<a;)null!=(r=t[i])&&(e>r&&(e=r),r>u&&(u=r))}else{for(;++i<a&&!(null!=(e=u=n.call(t,t[i],i))&&e>=e);)e=void 0;for(;++i<a;)null!=(r=n.call(t,t[i],i))&&(e>r&&(e=r),r>u&&(u=r))}return[e,u]},Pr.sum=function(t,n){var e,r=0,u=t.length,i=-1;if(1===arguments.length)for(;++i<u;)isNaN(e=+t[i])||(r+=e);else for(;++i<u;)isNaN(e=+n.call(t,t[i],i))||(r+=e);return r},Pr.mean=function(t,e){var r,u=0,i=t.length,a=-1,o=i;if(1===arguments.length)for(;++a<i;)n(r=t[a])?u+=r:--o;else for(;++a<i;)n(r=e.call(t,t[a],a))?u+=r:--o;return o?u/o:void 0},Pr.quantile=function(t,n){var e=(t.length-1)*n+1,r=Math.floor(e),u=+t[r-1],i=e-r;return i?u+i*(t[r]-u):u},Pr.median=function(e,r){return arguments.length>1&&(e=e.map(r)),e=e.filter(n),e.length?Pr.quantile(e.sort(t),.5):void 0};var Rr=e(t);Pr.bisectLeft=Rr.left,Pr.bisect=Pr.bisectRight=Rr.right,Pr.bisector=function(n){return e(1===n.length?function(e,r){return t(n(e),r)}:n)},Pr.shuffle=function(t){for(var n,e,r=t.length;r;)e=Math.random()*r--|0,n=t[r],t[r]=t[e],t[e]=n;return t},Pr.permute=function(t,n){for(var e=n.length,r=new Array(e);e--;)r[e]=t[n[e]];return r},Pr.pairs=function(t){for(var n,e=0,r=t.length-1,u=t[0],i=new Array(0>r?0:r);r>e;)i[e]=[n=u,u=t[++e]];return i},Pr.zip=function(){if(!(u=arguments.length))return[];for(var t=-1,n=Pr.min(arguments,r),e=new Array(n);++t<n;)for(var u,i=-1,a=e[t]=new Array(u);++i<u;)a[i]=arguments[i][t];return e},Pr.transpose=function(t){return Pr.zip.apply(Pr,t)},Pr.keys=function(t){var n=[];for(var e in t)n.push(e);return n},Pr.values=function(t){var n=[];for(var e in t)n.push(t[e]);return n},Pr.entries=function(t){var n=[];for(var e in t)n.push({key:e,value:t[e]});return n},Pr.merge=function(t){for(var n,e,r,u=t.length,i=-1,a=0;++i<u;)a+=t[i].length;for(e=new Array(a);--u>=0;)for(r=t[u],n=r.length;--n>=0;)e[--a]=r[n];return e};var Vr=Math.abs;Pr.range=function(t,n,e){if(arguments.length<3&&(e=1,arguments.length<2&&(n=t,t=0)),(n-t)/e===1/0)throw new Error("infinite range");var r,i=[],a=u(Vr(e)),o=-1;if(t*=a,n*=a,e*=a,0>e)for(;(r=t+e*++o)>n;)i.push(r/a);else for(;(r=t+e*++o)<n;)i.push(r/a);return i},Pr.map=function(t){var n=new a;if(t instanceof a)t.forEach(function(t,e){n.set(t,e)});else for(var e in t)n.set(e,t[e]);return n},i(a,{has:o,get:function(t){return this[Zr+t]},set:function(t,n){return this[Zr+t]=n},remove:s,keys:c,values:function(){var t=[];return this.forEach(function(n,e){t.push(e)}),t},entries:function(){var t=[];return this.forEach(function(n,e){t.push({key:n,value:e})}),t},size:l,empty:f,forEach:function(t){for(var n in this)n.charCodeAt(0)===$r&&t.call(this,n.substring(1),this[n])}});var Zr="\x00",$r=Zr.charCodeAt(0);Pr.nest=function(){function t(n,o,s){if(s>=i.length)return r?r.call(u,o):e?o.sort(e):o;for(var c,l,f,h,g=-1,p=o.length,d=i[s++],m=new a;++g<p;)(h=m.get(c=d(l=o[g])))?h.push(l):m.set(c,[l]);return n?(l=n(),f=function(e,r){l.set(e,t(n,r,s))}):(l={},f=function(e,r){l[e]=t(n,r,s)}),m.forEach(f),l}function n(t,e){if(e>=i.length)return t;var r=[],u=o[e++];return t.forEach(function(t,u){r.push({key:t,values:n(u,e)})}),u?r.sort(function(t,n){return u(t.key,n.key)}):r}var e,r,u={},i=[],o=[];return u.map=function(n,e){return t(e,n,0)},u.entries=function(e){return n(t(Pr.map,e,0),0)},u.key=function(t){return i.push(t),u},u.sortKeys=function(t){return o[i.length-1]=t,u},u.sortValues=function(t){return e=t,u},u.rollup=function(t){return r=t,u},u},Pr.set=function(t){var n=new h;if(t)for(var e=0,r=t.length;r>e;++e)n.add(t[e]);return n},i(h,{has:o,add:function(t){return this[Zr+t]=!0,t},remove:function(t){return t=Zr+t,t in this&&delete this[t]},values:c,size:l,empty:f,forEach:function(t){for(var n in this)n.charCodeAt(0)===$r&&t.call(this,n.substring(1))}}),Pr.functor=g;var Xr={svg:"../../../../www.w3.org/2000/svg.html",xhtml:"http://www.w3.org/1999/xhtml",xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};Pr.ns={prefix:Xr,qualify:function(t){var n=t.indexOf(":"),e=t;return n>=0&&(e=t.substring(0,n),t=t.substring(n+1)),Xr.hasOwnProperty(e)?{space:Xr[e],local:t}:t}},Pr.rebind=function(t,n){for(var e,r=1,u=arguments.length;++r<u;)t[e=arguments[r]]=p(t,n,n[e]);return t},Pr.svg={};var Br=Math.PI,Wr=2*Br,Jr=Br/2,Gr=1e-6,Kr=Br/180,Qr=180/Br;Pr.svg.arc=function(){function t(){var t=n.apply(this,arguments),i=e.apply(this,arguments),a=r.apply(this,arguments)+tu,o=u.apply(this,arguments)+tu,s=(a>o&&(s=a,a=o,o=s),o-a),c=Br>s?"0":"1",l=Math.cos(a),f=Math.sin(a),h=Math.cos(o),g=Math.sin(o);return s>=nu?t?"M0,"+i+"A"+i+","+i+" 0 1,1 0,"+-i+"A"+i+","+i+" 0 1,1 0,"+i+"M0,"+t+"A"+t+","+t+" 0 1,0 0,"+-t+"A"+t+","+t+" 0 1,0 0,"+t+"Z":"M0,"+i+"A"+i+","+i+" 0 1,1 0,"+-i+"A"+i+","+i+" 0 1,1 0,"+i+"Z":t?"M"+i*l+","+i*f+"A"+i+","+i+" 0 "+c+",1 "+i*h+","+i*g+"L"+t*h+","+t*g+"A"+t+","+t+" 0 "+c+",0 "+t*l+","+t*f+"Z":"M"+i*l+","+i*f+"A"+i+","+i+" 0 "+c+",1 "+i*h+","+i*g+"L0,0Z"}var n=d,e=m,r=v,u=y;return t.innerRadius=function(e){return arguments.length?(n=g(e),t):n},t.outerRadius=function(n){return arguments.length?(e=g(n),t):e},t.startAngle=function(n){return arguments.length?(r=g(n),t):r},t.endAngle=function(n){return arguments.length?(u=g(n),t):u},t.centroid=function(){var t=(n.apply(this,arguments)+e.apply(this,arguments))/2,i=(r.apply(this,arguments)+u.apply(this,arguments))/2+tu;return[Math.cos(i)*t,Math.sin(i)*t]},t};var tu=-Jr,nu=Wr-Gr;Pr.svg.line=function(){return w(_)};var eu=Pr.map({linear:k,"linear-closed":A,step:S,"step-before":T,"step-after":N,basis:H,"basis-open":F,"basis-closed":E,bundle:j,cardinal:z,"cardinal-open":C,"cardinal-closed":D,monotone:R});eu.forEach(function(t,n){n.key=t,n.closed=/-closed$/.test(t)});var ru=[0,2/3,1/3,0],uu=[0,1/3,2/3,0],iu=[0,1/6,2/3,1/6];Pr.svg.line.radial=function(){var t=w(V);return t.radius=t.x,delete t.x,t.angle=t.y,delete t.y,t},T.reverse=N,N.reverse=T,Pr.svg.area=function(){return Z(_)},Pr.svg.area.radial=function(){var t=Z(V);return t.radius=t.x,delete t.x,t.innerRadius=t.x0,delete t.x0,t.outerRadius=t.x1,delete t.x1,t.angle=t.y,delete t.y,t.startAngle=t.y0,delete t.y0,t.endAngle=t.y1,delete t.y1,t},Pr.svg.chord=function(){function t(t,o){var s=n(this,i,t,o),c=n(this,a,t,o);return"M"+s.p0+r(s.r,s.p1,s.a1-s.a0)+(e(s,c)?u(s.r,s.p1,s.r,s.p0):u(s.r,s.p1,c.r,c.p0)+r(c.r,c.p1,c.a1-c.a0)+u(c.r,c.p1,s.r,s.p0))+"Z"}function n(t,n,e,r){var u=n.call(t,e,r),i=o.call(t,u,r),a=s.call(t,u,r)+tu,l=c.call(t,u,r)+tu;return{r:i,a0:a,a1:l,p0:[i*Math.cos(a),i*Math.sin(a)],p1:[i*Math.cos(l),i*Math.sin(l)]}}function e(t,n){return t.a0==n.a0&&t.a1==n.a1}function r(t,n,e){return"A"+t+","+t+" 0 "+ +(e>Br)+",1 "+n}function u(t,n,e,r){return"Q 0,0 "+r}var i=$,a=X,o=B,s=v,c=y;return t.radius=function(n){return arguments.length?(o=g(n),t):o},t.source=function(n){return arguments.length?(i=g(n),t):i},t.target=function(n){return arguments.length?(a=g(n),t):a},t.startAngle=function(n){return arguments.length?(s=g(n),t):s},t.endAngle=function(n){return arguments.length?(c=g(n),t):c},t},Pr.svg.diagonal=function(){function t(t,u){var i=n.call(this,t,u),a=e.call(this,t,u),o=(i.y+a.y)/2,s=[i,{x:i.x,y:o},{x:a.x,y:o},a];return s=s.map(r),"M"+s[0]+"C"+s[1]+" "+s[2]+" "+s[3]}var n=$,e=X,r=W;return t.source=function(e){return arguments.length?(n=g(e),t):n},t.target=function(n){return arguments.length?(e=g(n),t):e},t.projection=function(n){return arguments.length?(r=n,t):r},t},Pr.svg.diagonal.radial=function(){var t=Pr.svg.diagonal(),n=W,e=t.projection;return t.projection=function(t){return arguments.length?e(J(n=t)):n},t},Pr.svg.symbol=function(){function t(t,r){return(au.get(n.call(this,t,r))||Q)(e.call(this,t,r))}var n=K,e=G;return t.type=function(e){return arguments.length?(n=g(e),t):n},t.size=function(n){return arguments.length?(e=g(n),t):e},t};var au=Pr.map({circle:Q,cross:function(t){var n=Math.sqrt(t/5)/2;return"M"+-3*n+","+-n+"H"+-n+"V"+-3*n+"H"+n+"V"+-n+"H"+3*n+"V"+n+"H"+n+"V"+3*n+"H"+-n+"V"+n+"H"+-3*n+"Z"},diamond:function(t){var n=Math.sqrt(t/(2*su)),e=n*su;return"M0,"+-n+"L"+e+",0 0,"+n+" "+-e+",0Z"},square:function(t){var n=Math.sqrt(t)/2;return"M"+-n+","+-n+"L"+n+","+-n+" "+n+","+n+" "+-n+","+n+"Z"},"triangle-down":function(t){var n=Math.sqrt(t/ou),e=n*ou/2;return"M0,"+e+"L"+n+","+-e+" "+-n+","+-e+"Z"},"triangle-up":function(t){var n=Math.sqrt(t/ou),e=n*ou/2;return"M0,"+-e+"L"+n+","+e+" "+-n+","+e+"Z"}});Pr.svg.symbolTypes=au.keys();var ou=Math.sqrt(3),su=Math.tan(30*Kr);tn.prototype.toString=function(){return this.rgb()+""},Pr.hsl=function(t,n,e){return 1===arguments.length?t instanceof en?nn(t.h,t.s,t.l):bn(""+t,Mn,nn):nn(+t,+n,+e)};var cu=en.prototype=new tn;cu.brighter=function(t){return t=Math.pow(.7,arguments.length?t:1),nn(this.h,this.s,this.l/t)},cu.darker=function(t){return t=Math.pow(.7,arguments.length?t:1),nn(this.h,this.s,t*this.l)},cu.rgb=function(){return rn(this.h,this.s,this.l)},Pr.hcl=function(t,n,e){return 1===arguments.length?t instanceof an?un(t.h,t.c,t.l):t instanceof cn?fn(t.l,t.a,t.b):fn((t=xn((t=Pr.rgb(t)).r,t.g,t.b)).l,t.a,t.b):un(+t,+n,+e)};var lu=an.prototype=new tn;lu.brighter=function(t){return un(this.h,this.c,Math.min(100,this.l+fu*(arguments.length?t:1)))},lu.darker=function(t){return un(this.h,this.c,Math.max(0,this.l-fu*(arguments.length?t:1)))},lu.rgb=function(){return on(this.h,this.c,this.l).rgb()},Pr.lab=function(t,n,e){return 1===arguments.length?t instanceof cn?sn(t.l,t.a,t.b):t instanceof an?on(t.l,t.c,t.h):xn((t=Pr.rgb(t)).r,t.g,t.b):sn(+t,+n,+e)};var fu=18,hu=.95047,gu=1,pu=1.08883,du=cn.prototype=new tn;du.brighter=function(t){return sn(Math.min(100,this.l+fu*(arguments.length?t:1)),this.a,this.b)},du.darker=function(t){return sn(Math.max(0,this.l-fu*(arguments.length?t:1)),this.a,this.b)},du.rgb=function(){return ln(this.l,this.a,this.b)},Pr.rgb=function(t,n,e){return 1===arguments.length?t instanceof yn?vn(t.r,t.g,t.b):bn(""+t,vn,rn):vn(~~t,~~n,~~e)};var mu=yn.prototype=new tn;mu.brighter=function(t){t=Math.pow(.7,arguments.length?t:1);var n=this.r,e=this.g,r=this.b,u=30;return n||e||r?(n&&u>n&&(n=u),e&&u>e&&(e=u),r&&u>r&&(r=u),vn(Math.min(255,~~(n/t)),Math.min(255,~~(e/t)),Math.min(255,~~(r/t)))):vn(u,u,u)},mu.darker=function(t){return t=Math.pow(.7,arguments.length?t:1),vn(~~(t*this.r),~~(t*this.g),~~(t*this.b))},mu.hsl=function(){return Mn(this.r,this.g,this.b)},mu.toString=function(){return"#"+_n(this.r)+_n(this.g)+_n(this.b)};var vu=Pr.map({aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074});vu.forEach(function(t,n){vu.set(t,dn(n))}),Pr.interpolateRgb=An,Pr.interpolateObject=Sn,Pr.interpolateArray=Tn,Pr.interpolateNumber=Nn,Pr.interpolateString=Cn;var yu=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,_u=new RegExp(yu.source,"g");Pr.interpolate=Dn,Pr.interpolators=[function(t,n){var e=typeof n;return("string"===e?vu.has(n)||/^(#|rgb\(|hsl\()/.test(n)?An:Cn:n instanceof tn?An:Array.isArray(n)?Tn:"object"===e&&isNaN(n)?Sn:Nn)(t,n)}],Pr.interpolateRound=zn,Pr.round=function(t,n){return n?Math.round(t*(n=Math.pow(10,n)))/n:Math.round(t)};var bu=["y","z","a","f","p","n","Âµ","m","","k","M","G","T","P","E","Z","Y"].map(Fn);Pr.formatPrefix=function(t,n){var e=0;return t&&(0>t&&(t*=-1),n&&(t=Pr.round(t,Hn(t,n))),e=1+Math.floor(1e-12+Math.log(t)/Math.LN10),e=Math.max(-24,Math.min(24,3*Math.floor((e-1)/3)))),bu[8+e/3]};var Mu=/(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i,xu=Pr.map({b:function(t){return t.toString(2)},c:function(t){return String.fromCharCode(t)},o:function(t){return t.toString(8)},x:function(t){return t.toString(16)},X:function(t){return t.toString(16).toUpperCase()},g:function(t,n){return t.toPrecision(n)},e:function(t,n){return t.toExponential(n)},f:function(t,n){return t.toFixed(n)},r:function(t,n){return(t=Pr.round(t,Hn(t,n))).toFixed(Math.max(0,Math.min(20,Hn(t*(1+1e-15),n))))}});Pr.requote=function(t){return t.replace(wu,"\\$&")};var wu=/[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g,ku=Pr.time={},Au=Date;On.prototype={getDate:function(){return this._.getUTCDate()},getDay:function(){return this._.getUTCDay()},getFullYear:function(){return this._.getUTCFullYear()},getHours:function(){return this._.getUTCHours()},getMilliseconds:function(){return this._.getUTCMilliseconds()},getMinutes:function(){return this._.getUTCMinutes()},getMonth:function(){return this._.getUTCMonth()},getSeconds:function(){return this._.getUTCSeconds()},getTime:function(){return this._.getTime()},getTimezoneOffset:function(){return 0},valueOf:function(){return this._.valueOf()},setDate:function(){Su.setUTCDate.apply(this._,arguments)},setDay:function(){Su.setUTCDay.apply(this._,arguments)},setFullYear:function(){Su.setUTCFullYear.apply(this._,arguments)},setHours:function(){Su.setUTCHours.apply(this._,arguments)},setMilliseconds:function(){Su.setUTCMilliseconds.apply(this._,arguments)},setMinutes:function(){Su.setUTCMinutes.apply(this._,arguments)},setMonth:function(){Su.setUTCMonth.apply(this._,arguments)},setSeconds:function(){Su.setUTCSeconds.apply(this._,arguments)},setTime:function(){Su.setTime.apply(this._,arguments)}};var Su=Date.prototype;ku.year=Yn(function(t){return t=ku.day(t),t.setMonth(0,1),t},function(t,n){t.setFullYear(t.getFullYear()+n)},function(t){return t.getFullYear()}),ku.years=ku.year.range,ku.years.utc=ku.year.utc.range,ku.day=Yn(function(t){var n=new Au(2e3,0);return n.setFullYear(t.getFullYear(),t.getMonth(),t.getDate()),n},function(t,n){t.setDate(t.getDate()+n)},function(t){return t.getDate()-1}),ku.days=ku.day.range,ku.days.utc=ku.day.utc.range,ku.dayOfYear=function(t){var n=ku.year(t);return Math.floor((t-n-6e4*(t.getTimezoneOffset()-n.getTimezoneOffset()))/864e5)},["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].forEach(function(t,n){n=7-n;var e=ku[t]=Yn(function(t){return(t=ku.day(t)).setDate(t.getDate()-(t.getDay()+n)%7),t},function(t,n){t.setDate(t.getDate()+7*Math.floor(n))},function(t){var e=ku.year(t).getDay();return Math.floor((ku.dayOfYear(t)+(e+n)%7)/7)-(e!==n)});ku[t+"s"]=e.range,ku[t+"s"].utc=e.utc.range,ku[t+"OfYear"]=function(t){var e=ku.year(t).getDay();return Math.floor((ku.dayOfYear(t)+(e+n)%7)/7)}}),ku.week=ku.sunday,ku.weeks=ku.sunday.range,ku.weeks.utc=ku.sunday.utc.range,ku.weekOfYear=ku.sundayOfYear;var Tu={"-":"",_:" ",0:"0"},Nu=/^\s*\d+/,Cu=/^%/;Pr.locale=function(t){return{numberFormat:En(t),timeFormat:Un(t)}};var Du=Pr.locale({decimal:".",thousands:",",grouping:[3],currency:["$",""],dateTime:"%a %b %e %X %Y",date:"%m/%d/%Y",time:"%H:%M:%S",periods:["AM","PM"],days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],shortDays:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],shortMonths:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]});Pr.format=Du.numberFormat;var zu={floor:_,ceil:_};Pr.scale={},Pr.scale.linear=function(){return pe([0,1],[0,1],Dn,!1)};var qu={s:1,g:1,p:1,r:1,e:1},Lu=[].slice,Hu=function(t){return Lu.call(t)},Fu=document,Eu=Fu.documentElement,ju=window;try{Hu(Eu.childNodes)[0].nodeType}catch(Ou){Hu=function(t){for(var n=t.length,e=new Array(n);n--;)e[n]=t[n];return e}}var Yu={}.__proto__?function(t,n){t.__proto__=n}:function(t,n){for(var e in n)t[e]=n[e]},Iu=["webkit","ms","moz","Moz","o","O"],Uu=function(t,n){return n.querySelector(t)},Pu=function(t,n){return n.querySelectorAll(t)},Ru=Eu[xe(Eu,"matchesSelector")],Vu=function(t,n){return Ru.call(t,n)};"function"==typeof Sizzle&&(Uu=function(t,n){return Sizzle(t,n)[0]||null},Pu=Sizzle,Vu=Sizzle.matchesSelector),Pr.selection=function(){return Qu};var Zu=Pr.selection.prototype=[];Zu.select=function(t){var n,e,r,u,i=[];t=ke(t);for(var a=-1,o=this.length;++a<o;){i.push(n=[]),n.parentNode=(r=this[a]).parentNode;for(var s=-1,c=r.length;++s<c;)(u=r[s])?(n.push(e=t.call(u,u.__data__,s,a)),e&&"__data__"in u&&(e.__data__=u.__data__)):n.push(null)}return we(i)},Zu.selectAll=function(t){var n,e,r=[];t=Ae(t);for(var u=-1,i=this.length;++u<i;)for(var a=this[u],o=-1,s=a.length;++o<s;)(e=a[o])&&(r.push(n=Hu(t.call(e,e.__data__,o,u))),n.parentNode=e);return we(r)},Zu.attr=function(t,n){if(arguments.length<2){if("string"==typeof t){var e=this.node();return t=Pr.ns.qualify(t),t.local?e.getAttributeNS(t.space,t.local):e.getAttribute(t)}for(n in t)this.each(Se(n,t[n]));return this}return this.each(Se(t,n))},Zu.classed=function(t,n){if(arguments.length<2){if("string"==typeof t){var e=this.node(),r=(t=Ce(t)).length,u=-1;if(n=e.classList){for(;++u<r;)if(!n.contains(t[u]))return!1}else for(n=e.getAttribute("class");++u<r;)if(!Ne(t[u]).test(n))return!1;return!0}for(n in t)this.each(De(n,t[n]));return this}return this.each(De(t,n))},Zu.style=function(t,n,e){var r=arguments.length;if(3>r){if("string"!=typeof t){2>r&&(n="");for(e in t)this.each(qe(e,t[e],n));return this}if(2>r)return ju.getComputedStyle(this.node(),null).getPropertyValue(t);e=""}return this.each(qe(t,n,e))},Zu.property=function(t,n){if(arguments.length<2){if("string"==typeof t)return this.node()[t];for(n in t)this.each(Le(n,t[n]));return this}return this.each(Le(t,n))},Zu.text=function(t){return arguments.length?this.each("function"==typeof t?function(){var n=t.apply(this,arguments);this.textContent=null==n?"":n}:null==t?function(){this.textContent=""}:function(){this.textContent=t}):this.node().textContent},Zu.html=function(t){return arguments.length?this.each("function"==typeof t?function(){var n=t.apply(this,arguments);this.innerHTML=null==n?"":n}:null==t?function(){this.innerHTML=""}:function(){this.innerHTML=t}):this.node().innerHTML},Zu.append=function(t){return t=He(t),this.select(function(){return this.appendChild(t.apply(this,arguments))})},Zu.insert=function(t,n){return t=He(t),n=ke(n),this.select(function(){return this.insertBefore(t.apply(this,arguments),n.apply(this,arguments)||null)})},Zu.remove=function(){return this.each(function(){var t=this.parentNode;t&&t.removeChild(this)})},Zu.data=function(t,n){function e(t,e){var r,u,i,o=t.length,f=e.length,h=Math.min(o,f),g=new Array(f),p=new Array(f),d=new Array(o);if(n){var m,v=new a,y=new a,_=[];for(r=-1;++r<o;)m=n.call(u=t[r],u.__data__,r),v.has(m)?d[r]=u:v.set(m,u),_.push(m);for(r=-1;++r<f;)m=n.call(e,i=e[r],r),(u=v.get(m))?(g[r]=u,u.__data__=i):y.has(m)||(p[r]=Fe(i)),y.set(m,i),v.remove(m);for(r=-1;++r<o;)v.has(_[r])&&(d[r]=t[r])}else{for(r=-1;++r<h;)u=t[r],i=e[r],u?(u.__data__=i,g[r]=u):p[r]=Fe(i);for(;f>r;++r)p[r]=Fe(e[r]);for(;o>r;++r)d[r]=t[r]}p.update=g,p.parentNode=g.parentNode=d.parentNode=t.parentNode,s.push(p),c.push(g),l.push(d)}var r,u,i=-1,o=this.length;if(!arguments.length){for(t=new Array(o=(r=this[0]).length);++i<o;)(u=r[i])&&(t[i]=u.__data__);return t}var s=Be([]),c=we([]),l=we([]);if("function"==typeof t)for(;++i<o;)e(r=this[i],t.call(r,r.parentNode.__data__,i));else for(;++i<o;)e(r=this[i],t);return c.enter=function(){return s},c.exit=function(){return l},c},Zu.datum=function(t){return arguments.length?this.property("__data__",t):this.property("__data__")},Zu.filter=function(t){var n,e,r,u=[];"function"!=typeof t&&(t=Ee(t));for(var i=0,a=this.length;a>i;i++){u.push(n=[]),n.parentNode=(e=this[i]).parentNode;for(var o=0,s=e.length;s>o;o++)(r=e[o])&&t.call(r,r.__data__,o,i)&&n.push(r)}return we(u)},Zu.order=function(){for(var t=-1,n=this.length;++t<n;)for(var e,r=this[t],u=r.length-1,i=r[u];--u>=0;)(e=r[u])&&(i&&i!==e.nextSibling&&i.parentNode.insertBefore(e,i),i=e);return this},Zu.sort=function(t){t=je.apply(this,arguments);for(var n=-1,e=this.length;++n<e;)this[n].sort(t);return this.order()},Pr.dispatch=function(){for(var t=new Ye,n=-1,e=arguments.length;++n<e;)t[arguments[n]]=Ie(t);return t},Ye.prototype.on=function(t,n){var e=t.indexOf("."),r="";if(e>=0&&(r=t.substring(e+1),t=t.substring(0,e)),t)return arguments.length<2?this[t].on(r):this[t].on(r,n);if(2===arguments.length){if(null==n)for(t in this)this.hasOwnProperty(t)&&this[t].on(r,null);return this}},Pr.event=null,Zu.on=function(t,n,e){var r=arguments.length;if(3>r){if("string"!=typeof t){2>r&&(n=!1);for(e in t)this.each(Ve(e,t[e],n));return this}if(2>r)return(r=this.node()["__on"+t])&&r._;e=!1}return this.each(Ve(t,n,e))};var $u=Pr.map({mouseenter:"mouseover",mouseleave:"mouseout"});$u.forEach(function(t){"on"+t in Fu&&$u.remove(t)}),Zu.each=function(t){return Xe(this,function(n,e,r){t.call(n,n.__data__,e,r)})},Zu.call=function(t){var n=Hu(arguments);return t.apply(n[0]=this,n),this},Zu.empty=function(){return!this.node()},Zu.node=function(){for(var t=0,n=this.length;n>t;t++)for(var e=this[t],r=0,u=e.length;u>r;r++){var i=e[r];if(i)return i}return null},Zu.size=function(){var t=0;return this.each(function(){++t}),t};var Xu=[];Pr.selection.enter=Be,Pr.selection.enter.prototype=Xu,Xu.append=Zu.append,Xu.empty=Zu.empty,Xu.node=Zu.node,Xu.call=Zu.call,Xu.size=Zu.size,Xu.select=function(t){for(var n,e,r,u,i,a=[],o=-1,s=this.length;++o<s;){r=(u=this[o]).update,a.push(n=[]),n.parentNode=u.parentNode;for(var c=-1,l=u.length;++c<l;)(i=u[c])?(n.push(r[c]=e=t.call(u.parentNode,i.__data__,c,o)),e.__data__=i.__data__):n.push(null)}return we(a)},Xu.insert=function(t,n){return arguments.length<2&&(n=We(this)),Zu.insert.call(this,t,n)},Zu.transition=function(){for(var t,n,e=ui||++oi,r=[],u=ii||{time:Date.now(),ease:ir,delay:0,duration:250},i=-1,a=this.length;++i<a;){r.push(t=[]);for(var o=this[i],s=-1,c=o.length;++s<c;)(n=o[s])&&Mr(n,s,e,u),t.push(n)}return gr(r,e)},Zu.interrupt=function(){return this.each(Je)},Pr.select=function(t){var n=["string"==typeof t?Uu(t,Fu):t];return n.parentNode=Eu,we([n])},Pr.selectAll=function(t){var n=Hu("string"==typeof t?Pu(t,Fu):t);return n.parentNode=Eu,we([n])};var Bu,Wu,Ju,Gu,Ku,Qu=Pr.select(Eu),ti=ju[xe(ju,"requestAnimationFrame")]||function(t){setTimeout(t,17)};Pr.timer=function(t,n,e){var r=arguments.length;2>r&&(n=0),3>r&&(e=Date.now());var u=e+n,i={c:t,t:u,f:!1,n:null};Wu?Wu.n=i:Bu=i,Wu=i,Ju||(Gu=clearTimeout(Gu),Ju=1,ti(Ge))},Pr.timer.flush=function(){Ke(),Qe()};var ni=function(){return _},ei=Pr.map({linear:ni,poly:ar,quad:function(){return rr},cubic:function(){return ur},sin:function(){return or},exp:function(){return sr},circle:function(){return cr},elastic:lr,back:fr,bounce:function(){return hr}}),ri=Pr.map({"in":_,out:nr,"in-out":er,"out-in":function(t){return er(nr(t))}});Pr.ease=function(t){var n=t.indexOf("-"),e=n>=0?t.substring(0,n):t,r=n>=0?t.substring(n+1):"in";return e=ei.get(e)||ni,r=ri.get(r)||_,tr(r(e.apply(null,Lu.call(arguments,1))))};var ui,ii,ai=[],oi=0;ai.call=Zu.call,ai.empty=Zu.empty,ai.node=Zu.node,ai.size=Zu.size,Pr.transition=function(t){return arguments.length?ui?t.transition():t:Qu.transition()},Pr.transition.prototype=ai,ai.select=function(t){var n,e,r,u=this.id,i=[];t=ke(t);for(var a=-1,o=this.length;++a<o;){i.push(n=[]);for(var s=this[a],c=-1,l=s.length;++c<l;)(r=s[c])&&(e=t.call(r,r.__data__,c,a))?("__data__"in r&&(e.__data__=r.__data__),Mr(e,c,u,r.__transition__[u]),n.push(e)):n.push(null)}return gr(i,u)},ai.selectAll=function(t){var n,e,r,u,i,a=this.id,o=[];t=Ae(t);for(var s=-1,c=this.length;++s<c;)for(var l=this[s],f=-1,h=l.length;++f<h;)if(r=l[f]){i=r.__transition__[a],e=t.call(r,r.__data__,f,s),o.push(n=[]);for(var g=-1,p=e.length;++g<p;)(u=e[g])&&Mr(u,g,a,i),n.push(u)}return gr(o,a)},ai.filter=function(t){var n,e,r,u=[];"function"!=typeof t&&(t=Ee(t));for(var i=0,a=this.length;a>i;i++){u.push(n=[]);for(var e=this[i],o=0,s=e.length;s>o;o++)(r=e[o])&&t.call(r,r.__data__,o,i)&&n.push(r)}return gr(u,this.id)},Pr.transform=function(t){var n=Fu.createElementNS(Pr.ns.prefix.svg,"g");return(Pr.transform=function(t){if(null!=t){n.setAttribute("transform",t);var e=n.transform.baseVal.consolidate()}return new pr(e?e.matrix:si)})(t)},pr.prototype.toString=function(){return"translate("+this.translate+")rotate("+this.rotate+")skewX("+this.skew+")scale("+this.scale+")"};var si={a:1,b:0,c:0,d:1,e:0,f:0};Pr.interpolateTransform=yr,ai.tween=function(t,n){var e=this.id;return arguments.length<2?this.node().__transition__[e].tween.get(t):Xe(this,null==n?function(n){n.__transition__[e].tween.remove(t)}:function(r){r.__transition__[e].tween.set(t,n)})},ai.attr=function(t,n){function e(){this.removeAttribute(o)}function r(){this.removeAttributeNS(o.space,o.local)}function u(t){return null==t?e:(t+="",function(){var n,e=this.getAttribute(o);return e!==t&&(n=a(e,t),function(t){this.setAttribute(o,n(t))})})}function i(t){return null==t?r:(t+="",function(){var n,e=this.getAttributeNS(o.space,o.local);return e!==t&&(n=a(e,t),function(t){this.setAttributeNS(o.space,o.local,n(t))})})}if(arguments.length<2){for(n in t)this.attr(n,t[n]);return this}var a="transform"==t?yr:Dn,o=Pr.ns.qualify(t);return _r(this,"attr."+t,n,o.local?i:u)},ai.attrTween=function(t,n){function e(t,e){var r=n.call(this,t,e,this.getAttribute(u));return r&&function(t){this.setAttribute(u,r(t))}}function r(t,e){var r=n.call(this,t,e,this.getAttributeNS(u.space,u.local));return r&&function(t){this.setAttributeNS(u.space,u.local,r(t))}}var u=Pr.ns.qualify(t);return this.tween("attr."+t,u.local?r:e)},ai.style=function(t,n,e){function r(){this.style.removeProperty(t)
}function u(n){return null==n?r:(n+="",function(){var r,u=ju.getComputedStyle(this,null).getPropertyValue(t);return u!==n&&(r=Dn(u,n),function(n){this.style.setProperty(t,r(n),e)})})}var i=arguments.length;if(3>i){if("string"!=typeof t){2>i&&(n="");for(e in t)this.style(e,t[e],n);return this}e=""}return _r(this,"style."+t,n,u)},ai.styleTween=function(t,n,e){function r(r,u){var i=n.call(this,r,u,ju.getComputedStyle(this,null).getPropertyValue(t));return i&&function(n){this.style.setProperty(t,i(n),e)}}return arguments.length<3&&(e=""),this.tween("style."+t,r)},ai.text=function(t){return _r(this,"text",t,br)},ai.remove=function(){return this.each("end.transition",function(){var t;this.__transition__.count<2&&(t=this.parentNode)&&t.removeChild(this)})},ai.ease=function(t){var n=this.id;return arguments.length<1?this.node().__transition__[n].ease:("function"!=typeof t&&(t=Pr.ease.apply(Pr,arguments)),Xe(this,function(e){e.__transition__[n].ease=t}))},ai.delay=function(t){var n=this.id;return arguments.length<1?this.node().__transition__[n].delay:Xe(this,"function"==typeof t?function(e,r,u){e.__transition__[n].delay=+t.call(e,e.__data__,r,u)}:(t=+t,function(e){e.__transition__[n].delay=t}))},ai.duration=function(t){var n=this.id;return arguments.length<1?this.node().__transition__[n].duration:Xe(this,"function"==typeof t?function(e,r,u){e.__transition__[n].duration=Math.max(1,t.call(e,e.__data__,r,u))}:(t=Math.max(1,t),function(e){e.__transition__[n].duration=t}))},ai.each=function(t,n){var e=this.id;if(arguments.length<2){var r=ii,u=ui;ui=e,Xe(this,function(n,r,u){ii=n.__transition__[e],t.call(n,n.__data__,r,u)}),ii=r,ui=u}else Xe(this,function(r){var u=r.__transition__[e];(u.event||(u.event=Pr.dispatch("start","end"))).on(t,n)});return this},ai.transition=function(){for(var t,n,e,r,u=this.id,i=++oi,a=[],o=0,s=this.length;s>o;o++){a.push(t=[]);for(var n=this[o],c=0,l=n.length;l>c;c++)(e=n[c])&&(r=Object.create(e.__transition__[u]),r.delay+=r.duration,Mr(e,c,i,r)),t.push(e)}return gr(a,i)},Pr.svg.axis=function(){function t(t){t.each(function(){var t,c=Pr.select(this),l=this.__chart__||e,f=this.__chart__=e.copy(),h=null==s?f.ticks?f.ticks.apply(f,o):f.domain():s,g=null==n?f.tickFormat?f.tickFormat.apply(f,o):_:n,p=c.selectAll(".tick").data(h,f),d=p.enter().insert("g",".domain").attr("class","tick").style("opacity",Gr),m=Pr.transition(p.exit()).style("opacity",Gr).remove(),v=Pr.transition(p.order()).style("opacity",1),y=ge(f),b=c.selectAll(".domain").data([0]),M=(b.enter().append("path").attr("class","domain"),Pr.transition(b));d.append("line"),d.append("text");var x=d.select("line"),w=v.select("line"),k=p.select("text").text(g),A=d.select("text"),S=v.select("text");switch(r){case"bottom":t=xr,x.attr("y2",u),A.attr("y",Math.max(u,0)+a),w.attr("x2",0).attr("y2",u),S.attr("x",0).attr("y",Math.max(u,0)+a),k.attr("dy",".71em").style("text-anchor","middle"),M.attr("d","M"+y[0]+","+i+"V0H"+y[1]+"V"+i);break;case"top":t=xr,x.attr("y2",-u),A.attr("y",-(Math.max(u,0)+a)),w.attr("x2",0).attr("y2",-u),S.attr("x",0).attr("y",-(Math.max(u,0)+a)),k.attr("dy","0em").style("text-anchor","middle"),M.attr("d","M"+y[0]+","+-i+"V0H"+y[1]+"V"+-i);break;case"left":t=wr,x.attr("x2",-u),A.attr("x",-(Math.max(u,0)+a)),w.attr("x2",-u).attr("y2",0),S.attr("x",-(Math.max(u,0)+a)).attr("y",0),k.attr("dy",".32em").style("text-anchor","end"),M.attr("d","M"+-i+","+y[0]+"H0V"+y[1]+"H"+-i);break;case"right":t=wr,x.attr("x2",u),A.attr("x",Math.max(u,0)+a),w.attr("x2",u).attr("y2",0),S.attr("x",Math.max(u,0)+a).attr("y",0),k.attr("dy",".32em").style("text-anchor","start"),M.attr("d","M"+i+","+y[0]+"H0V"+y[1]+"H"+i)}if(f.rangeBand){var T=f,N=T.rangeBand()/2;l=f=function(t){return T(t)+N}}else l.rangeBand?l=f:m.call(t,f);d.call(t,l),v.call(t,f)})}var n,e=Pr.scale.linear(),r=ci,u=6,i=6,a=3,o=[10],s=null;return t.scale=function(n){return arguments.length?(e=n,t):e},t.orient=function(n){return arguments.length?(r=n in li?n+"":ci,t):r},t.ticks=function(){return arguments.length?(o=arguments,t):o},t.tickValues=function(n){return arguments.length?(s=n,t):s},t.tickFormat=function(e){return arguments.length?(n=e,t):n},t.tickSize=function(n){var e=arguments.length;return e?(u=+n,i=+arguments[e-1],t):u},t.innerTickSize=function(n){return arguments.length?(u=+n,t):u},t.outerTickSize=function(n){return arguments.length?(i=+n,t):i},t.tickPadding=function(n){return arguments.length?(a=+n,t):a},t.tickSubdivide=function(){return arguments.length&&t},t};var ci="bottom",li={top:1,right:1,bottom:1,left:1},fi="onselectstart"in Fu?null:xe(Eu.style,"userSelect"),hi=0;Pr.mouse=function(t){return Ar(t,Pe())},Pr.touches=function(t,n){return arguments.length<2&&(n=Pe().touches),n?Hu(n).map(function(n){var e=Ar(t,n);return e.identifier=n.identifier,e}):[]},Pr.svg.brush=function(){function t(i){i.each(function(){var i=Pr.select(this).style("pointer-events","all").style("-webkit-tap-highlight-color","rgba(0,0,0,0)").on("mousedown.brush",u).on("touchstart.brush",u),a=i.selectAll(".background").data([0]);a.enter().append("rect").attr("class","background").style("visibility","hidden").style("cursor","crosshair"),i.selectAll(".extent").data([0]).enter().append("rect").attr("class","extent").style("cursor","move");var o=i.selectAll(".resize").data(p,_);o.exit().remove(),o.enter().append("g").attr("class",function(t){return"resize "+t}).style("cursor",function(t){return gi[t]}).append("rect").attr("x",function(t){return/[ew]$/.test(t)?-3:null}).attr("y",function(t){return/^[ns]/.test(t)?-3:null}).attr("width",6).attr("height",6).style("visibility","hidden"),o.style("display",t.empty()?"none":null);var l,f=Pr.transition(i),h=Pr.transition(a);s&&(l=ge(s),h.attr("x",l[0]).attr("width",l[1]-l[0]),e(f)),c&&(l=ge(c),h.attr("y",l[0]).attr("height",l[1]-l[0]),r(f)),n(f)})}function n(t){t.selectAll(".resize").attr("transform",function(t){return"translate("+l[+/e$/.test(t)]+","+f[+/^s/.test(t)]+")"})}function e(t){t.select(".extent").attr("x",l[0]),t.selectAll(".extent,.n>rect,.s>rect").attr("width",l[1]-l[0])}function r(t){t.select(".extent").attr("y",f[0]),t.selectAll(".extent,.e>rect,.w>rect").attr("height",f[1]-f[0])}function u(){function u(){32==Pr.event.keyCode&&(T||(y=null,C[0]-=l[1],C[1]-=f[1],T=2),Ue())}function p(){32==Pr.event.keyCode&&2==T&&(C[0]+=l[1],C[1]+=f[1],T=0,Ue())}function d(){var t=Pr.mouse(b),u=!1;_&&(t[0]+=_[0],t[1]+=_[1]),T||(Pr.event.altKey?(y||(y=[(l[0]+l[1])/2,(f[0]+f[1])/2]),C[0]=l[+(t[0]<y[0])],C[1]=f[+(t[1]<y[1])]):y=null),A&&m(t,s,0)&&(e(w),u=!0),S&&m(t,c,1)&&(r(w),u=!0),u&&(n(w),x({type:"brush",mode:T?"move":"resize"}))}function m(t,n,e){var r,u,o=ge(n),s=o[0],c=o[1],p=C[e],d=e?f:l,m=d[1]-d[0];return T&&(s-=p,c-=m+p),r=(e?g:h)?Math.max(s,Math.min(c,t[e])):t[e],T?u=(r+=p)+m:(y&&(p=Math.max(s,Math.min(c,2*y[e]-r))),r>p?(u=r,r=p):u=p),d[0]!=r||d[1]!=u?(e?a=null:i=null,d[0]=r,d[1]=u,!0):void 0}function v(){d(),w.style("pointer-events","all").selectAll(".resize").style("display",t.empty()?"none":null),Pr.select("body").style("cursor",null),D.on("mousemove.brush",null).on("mouseup.brush",null).on("touchmove.brush",null).on("touchend.brush",null).on("keydown.brush",null).on("keyup.brush",null),N(),x({type:"brushend"})}var y,_,b=this,M=Pr.select(Pr.event.target),x=o.of(b,arguments),w=Pr.select(b),k=M.datum(),A=!/^(n|s)$/.test(k)&&s,S=!/^(e|w)$/.test(k)&&c,T=M.classed("extent"),N=kr(),C=Pr.mouse(b),D=Pr.select(ju).on("keydown.brush",u).on("keyup.brush",p);if(Pr.event.changedTouches?D.on("touchmove.brush",d).on("touchend.brush",v):D.on("mousemove.brush",d).on("mouseup.brush",v),w.interrupt().selectAll("*").interrupt(),T)C[0]=l[0]-C[0],C[1]=f[0]-C[1];else if(k){var z=+/w$/.test(k),q=+/^n/.test(k);_=[l[1-z]-C[0],f[1-q]-C[1]],C[0]=l[z],C[1]=f[q]}else Pr.event.altKey&&(y=C.slice());w.style("pointer-events","none").selectAll(".resize").style("display",null),Pr.select("body").style("cursor",M.style("cursor")),x({type:"brushstart"}),d()}var i,a,o=Re(t,"brushstart","brush","brushend"),s=null,c=null,l=[0,0],f=[0,0],h=!0,g=!0,p=pi[0];return t.event=function(t){t.each(function(){var t=o.of(this,arguments),n={x:l,y:f,i:i,j:a},e=this.__chart__||n;this.__chart__=n,ui?Pr.select(this).transition().each("start.brush",function(){i=e.i,a=e.j,l=e.x,f=e.y,t({type:"brushstart"})}).tween("brush:brush",function(){var e=Tn(l,n.x),r=Tn(f,n.y);return i=a=null,function(u){l=n.x=e(u),f=n.y=r(u),t({type:"brush",mode:"resize"})}}).each("end.brush",function(){i=n.i,a=n.j,t({type:"brush",mode:"resize"}),t({type:"brushend"})}):(t({type:"brushstart"}),t({type:"brush",mode:"resize"}),t({type:"brushend"}))})},t.x=function(n){return arguments.length?(s=n,p=pi[!s<<1|!c],t):s},t.y=function(n){return arguments.length?(c=n,p=pi[!s<<1|!c],t):c},t.clamp=function(n){return arguments.length?(s&&c?(h=!!n[0],g=!!n[1]):s?h=!!n:c&&(g=!!n),t):s&&c?[h,g]:s?h:c?g:null},t.extent=function(n){var e,r,u,o,h;return arguments.length?(s&&(e=n[0],r=n[1],c&&(e=e[0],r=r[0]),i=[e,r],s.invert&&(e=s(e),r=s(r)),e>r&&(h=e,e=r,r=h),(e!=l[0]||r!=l[1])&&(l=[e,r])),c&&(u=n[0],o=n[1],s&&(u=u[1],o=o[1]),a=[u,o],c.invert&&(u=c(u),o=c(o)),u>o&&(h=u,u=o,o=h),(u!=f[0]||o!=f[1])&&(f=[u,o])),t):(s&&(i?(e=i[0],r=i[1]):(e=l[0],r=l[1],s.invert&&(e=s.invert(e),r=s.invert(r)),e>r&&(h=e,e=r,r=h))),c&&(a?(u=a[0],o=a[1]):(u=f[0],o=f[1],c.invert&&(u=c.invert(u),o=c.invert(o)),u>o&&(h=u,u=o,o=h))),s&&c?[[e,u],[r,o]]:s?[e,r]:c&&[u,o])},t.clear=function(){return t.empty()||(l=[0,0],f=[0,0],i=a=null),t},t.empty=function(){return!!s&&l[0]==l[1]||!!c&&f[0]==f[1]},Pr.rebind(t,o,"on")};var gi={n:"ns-resize",e:"ew-resize",s:"ns-resize",w:"ew-resize",nw:"nwse-resize",ne:"nesw-resize",se:"nwse-resize",sw:"nesw-resize"},pi=[["n","e","s","w","nw","ne","se","sw"],["e","w"],["n","s"],[]];Pr.scale.log=function(){return Sr(Pr.scale.linear().domain([0,1]),10,!0,[1,10])};var di=Pr.format(".0e"),mi={floor:function(t){return-Math.ceil(-t)},ceil:function(t){return-Math.floor(-t)}};Pr.scale.pow=function(){return Tr(Pr.scale.linear(),1,[0,1])},Pr.scale.sqrt=function(){return Pr.scale.pow().exponent(.5)},Pr.scale.ordinal=function(){return Cr([],{t:"range",a:[[]]})},Pr.scale.category10=function(){return Pr.scale.ordinal().range(vi)},Pr.scale.category20=function(){return Pr.scale.ordinal().range(yi)},Pr.scale.category20b=function(){return Pr.scale.ordinal().range(_i)},Pr.scale.category20c=function(){return Pr.scale.ordinal().range(bi)};var vi=[2062260,16744206,2924588,14034728,9725885,9197131,14907330,8355711,12369186,1556175].map(mn),yi=[2062260,11454440,16744206,16759672,2924588,10018698,14034728,16750742,9725885,12955861,9197131,12885140,14907330,16234194,8355711,13092807,12369186,14408589,1556175,10410725].map(mn),_i=[3750777,5395619,7040719,10264286,6519097,9216594,11915115,13556636,9202993,12426809,15186514,15190932,8666169,11356490,14049643,15177372,8077683,10834324,13528509,14589654].map(mn),bi=[3244733,7057110,10406625,13032431,15095053,16616764,16625259,16634018,3253076,7652470,10607003,13101504,7695281,10394312,12369372,14342891,6513507,9868950,12434877,14277081].map(mn);Pr.scale.quantile=function(){return Dr([],[])},Pr.scale.quantize=function(){return zr(0,1,[0,1])},Pr.scale.threshold=function(){return qr([.5],[0,1])},Pr.scale.identity=function(){return Lr([0,1])},Pr.touch=function(t,n,e){if(arguments.length<3&&(e=n,n=Pe().changedTouches),n)for(var r,u=0,i=n.length;i>u;++u)if((r=n[u]).identifier===e)return Ar(t,r)};var Mi=ku.format=Du.timeFormat,xi=Mi.utc,wi=xi("%Y-%m-%dT%H:%M:%S.%LZ");Mi.iso=Date.prototype.toISOString&&+new Date("2000-01-01T00:00:00.000Z")?Hr:wi,Hr.parse=function(t){var n=new Date(t);return isNaN(n)?null:n},Hr.toString=wi.toString,ku.second=Yn(function(t){return new Au(1e3*Math.floor(t/1e3))},function(t,n){t.setTime(t.getTime()+1e3*Math.floor(n))},function(t){return t.getSeconds()}),ku.seconds=ku.second.range,ku.seconds.utc=ku.second.utc.range,ku.minute=Yn(function(t){return new Au(6e4*Math.floor(t/6e4))},function(t,n){t.setTime(t.getTime()+6e4*Math.floor(n))},function(t){return t.getMinutes()}),ku.minutes=ku.minute.range,ku.minutes.utc=ku.minute.utc.range,ku.hour=Yn(function(t){var n=t.getTimezoneOffset()/60;return new Au(36e5*(Math.floor(t/36e5-n)+n))},function(t,n){t.setTime(t.getTime()+36e5*Math.floor(n))},function(t){return t.getHours()}),ku.hours=ku.hour.range,ku.hours.utc=ku.hour.utc.range,ku.month=Yn(function(t){return t=ku.day(t),t.setDate(1),t},function(t,n){t.setMonth(t.getMonth()+n)},function(t){return t.getMonth()}),ku.months=ku.month.range,ku.months.utc=ku.month.utc.range;var ki=[1e3,5e3,15e3,3e4,6e4,3e5,9e5,18e5,36e5,108e5,216e5,432e5,864e5,1728e5,6048e5,2592e6,7776e6,31536e6],Ai=[[ku.second,1],[ku.second,5],[ku.second,15],[ku.second,30],[ku.minute,1],[ku.minute,5],[ku.minute,15],[ku.minute,30],[ku.hour,1],[ku.hour,3],[ku.hour,6],[ku.hour,12],[ku.day,1],[ku.day,2],[ku.week,1],[ku.month,1],[ku.month,3],[ku.year,1]],Si=Mi.multi([[".%L",function(t){return t.getMilliseconds()}],[":%S",function(t){return t.getSeconds()}],["%I:%M",function(t){return t.getMinutes()}],["%I %p",function(t){return t.getHours()}],["%a %d",function(t){return t.getDay()&&1!=t.getDate()}],["%b %d",function(t){return 1!=t.getDate()}],["%B",function(t){return t.getMonth()}],["%Y",b]]),Ti={range:function(t,n,e){return Pr.range(Math.ceil(t/e)*e,+n,e).map(Er)},floor:_,ceil:_};Ai.year=ku.year,ku.scale=function(){return Fr(Pr.scale.linear(),Ai,Si)};var Ni=Ai.map(function(t){return[t[0].utc,t[1]]}),Ci=xi.multi([[".%L",function(t){return t.getUTCMilliseconds()}],[":%S",function(t){return t.getUTCSeconds()}],["%I:%M",function(t){return t.getUTCMinutes()}],["%I %p",function(t){return t.getUTCHours()}],["%a %d",function(t){return t.getUTCDay()&&1!=t.getUTCDate()}],["%b %d",function(t){return 1!=t.getUTCDate()}],["%B",function(t){return t.getUTCMonth()}],["%Y",b]]);Ni.year=ku.year.utc,ku.scale.utc=function(){return Fr(Pr.scale.linear(),Ni,Ci)},Pr.xhr=jr(_),Pr.text=jr(function(t){return t.responseText}),Pr.json=function(t,n){return Or(t,"application/json",Ir,n)},Pr.html=function(t,n){return Or(t,"text/html",Ur,n)},Pr.xml=jr(function(t){return t.responseXML}),"function"==typeof define&&define.amd?define(Pr):"object"==typeof module&&module.exports?module.exports=Pr:this.d3=Pr}();
},{}]},{},[1])
(1)
});