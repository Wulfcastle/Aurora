(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
var fs = require('fs');

var Geocoder = require('./src/geocoder'),
    Style = require('./src/style'),
    Markers = require('./src/markers'),
    Draw = require('./src/draw'),
    drop = require('./src/drop'),
    Layers = require('./src/layers'),
    Info = require('./src/info');

var inputIncrement = require('./src/lib/inputincrement'),
    pager = require('./src/lib/pager'),
    color = require('./src/lib/color'),
    zoom = require('./src/lib/zoom'),
    Streets = require('./src/lib/streets');

if (!App) throw new Error('Global App object required');
if (!Views) throw new Error('Global Views object required');

var templates = {
    mapview: _("<a href='#' id='zoom-out' class='fill-darken1 keyline-right inline icon minus'></a><!--\n--><a href='#' id='zoom-in' class='fill-darken1 keyline-right inline icon plus'></a><!--\n--><span class='inline display-view center'>\n  <span class='clip inline'><%=obj.lat%>, <%=obj.lng%></span><span class='hide-small-screen clip inline'>, <%=obj.zoom%></span>\n</span>\n").template()
};

var Editor = Backbone.View.extend({});

Editor.prototype.events = (function() {
    var events = {};
    events['change #save-center']               = 'saveCenter';
    events['click .modes a']                    = 'targetToggle';
    events['click #editor-menu a.signup']       = 'signup';
    events['click .modes a.project-save']       = 'save';
    events['click .readonly']                   = 'inputselect';
    events['keyup #project-data-search']        = 'layersSearch';
    events['click #project-data-browse a']      = 'layersSet';
    events['click #project-layers .close']      = 'layersSet';
    events['click #project-layers a']           = 'layersView';
    events['click .addlayers']                  = 'layersBrowse';
    events['click #marker-menu .js-tabs label'] = 'layersRender';
    events['click .app .js-tabs a']             = 'tabs';
    events['click .app .js-tabs label']         = 'tabs';
    events['click .app .color-tabs a']          = 'tabs';
    events['click .pager a']                    = 'pager';
    events['keyup #project-settings input[type=text]'] = 'set';
    events['keyup #project-settings textarea']      = 'set';
    events['click #private']                    = 'set';
    events['click .js-help-toggle']             = 'helpToggle';
    events['click .draw-controls .button']      = 'drawMode';
    events['click #marker-tray a']              = 'markerEdit';
    events['click #marker-tray .trash']         = 'markerDel';
    events['click #marker-edit .trash']         = 'markerDel';
    events['change #marker-edit input[type=number]'] = 'markerSet';
    events['keyup #marker-edit input']          = 'markerSet';
    events['keyup #marker-edit textarea']       = 'markerSet';
    events['click #marker-edit input[type=radio]'] = 'markerSet';
    events['click #style-type input']           = 'styleSet';
    events['click #style-l10n input']           = 'styleSet';
    events['click #style-swatches input']       = 'styleSwatch';
    events['click #style-tint a.palette']       = 'stylePalette';
    events['mousedown .color-picker .color-h']  = 'enterColorH';
    events['mousedown .color-picker .color-sl'] = 'enterColorSL';
    events['mousemove .color-picker']           = 'colorHSL';
    events['mouseup   .color-picker']           = 'clearSelectMode';
    events['keyup .color-picker .color-hex']    = 'colorHex';
    events['change input.clamp']                = 'colorClamp';
    events['click #style-tint .disable']        = 'colorOn';
    events['click #style-tint .enable']         = 'colorOn';
    events['click .color-picker .invert']       = 'colorInv';
    events.dragenter                            = 'mapDragEnter';
    events.dragover                             = 'mapDragEnter';
    events.dragleave                            = 'mapDragLeave';
    events['drop #dropzone']                    = 'mapDrop';
    events['change #manual-import']             = 'mapDrop';
    events['click .marker-import-manual']       = 'manualImport';
    events['click .app.modes > a']              = 'changeMode';
    events['change #search-results input']      = 'searchSet';
    events['click #search-results label']       = 'searchSet';
    events['click .module > .close']            = 'reset';
    events['click #zoom-in']                    = 'zoomIn';
    events['click #zoom-out']                   = 'zoomOut';
    events['click #import .tabs a']             = 'propertyPane';
    events['click #import-assign']              = 'importAssign';
    events['click #geocode-submit']             = 'geocodeFields';
    events['click #cancel-tip']                 = 'drawMode';
    events['click .increment']                  = 'inputIncrement';
    events['click .track-kml-download']         = 'downloadKML';
    events['click .track-geojson-download']     = 'downloadGeoJSON';
    events['click .track-ios-docs']             = 'iosDocs';
    events['click .track-android-docs']         = 'androidDocs';
    events['click .track-js-docs']              = 'jsDocs';
    events['click .track-api-docs']             = 'apiDocs';
    events['change .embed-option']              = 'updateEmbed';
    return events;
})();

Editor.prototype.downloadKML = function(ev) {
    analytics.track('Downloaded Markers as KML');
};

Editor.prototype.downloadGeoJSON = function(ev) {
    analytics.track('Downloaded Markers as GeoJSON');
};

Editor.prototype.iosDocs = function(ev) {
    analytics.track('Viewed iOS docs from editor');
};

Editor.prototype.jsDocs = function(ev) {
    analytics.track('Viewed Javascript docs from editor');
};

Editor.prototype.apiDocs = function(ev) {
    analytics.track('Viewed API docs from editor');
};

Editor.prototype.targetToggle = function(ev) {
    if (window.location.hash === $(ev.currentTarget).attr('href')) {
        window.location.hash = '#';
        return false;
    }
};

Editor.prototype.zoomToggle = zoom.zoomToggle;
Editor.prototype.zoomIn = zoom.zoomIn;
Editor.prototype.zoomOut = zoom.zoomOut;

Editor.prototype.mapDragEnter = drop.mapDragEnter;
Editor.prototype.mapDragLeave = drop.mapDragLeave;
Editor.prototype.mapDrop = drop.mapDrop;

Editor.prototype.displayView = _.throttle(function() {
    var zoom = this.getZoom();
    var lat = parseFloat(this.getCenter().wrap().lat.toFixed(3));
    var lng = parseFloat(this.getCenter().wrap().lng.toFixed(3));
    $('#mapview').html(templates.mapview({ zoom: zoom, lat: lat, lng: lng }));
}, 500);

Editor.prototype.manualImport = function() {
    $('#manual-import').trigger('click');
    return false;
};

Editor.prototype.propertyPane = function(ev) {
    var panels = $('#import').find('.property-panes');
    var pane = $(ev.currentTarget).attr('href').split('#')[1];
    var current = panels.attr('class').match(/active[0-9]+/)[0];
    $(ev.currentTarget).addClass('active').siblings().removeClass('active');
    panels.removeClass(current).addClass(pane);
    return false;
};

Editor.prototype.geocodeFields = function(ev) {
    var values = [];
    var $modal = $(ev.currentTarget).parents('#geocode');

    $modal.find('input:checked')
        .each(function() {
            if ($(this).data('query')) values.push($(this).data('query'));
        });

    if (Views.modal.modals && Views.modal.modals.autogeocode) {
        Views.modal.modals.autogeocode.callback(null, values);
    } else {
        Views.modal.done('autogeocode');
    }

    return false;
};

Editor.prototype.importAssign = function(ev) {
    var values = {};
    var $modal = $(ev.currentTarget).parents('#import');

    $modal.find('input:checked')
        .each(function() {
            if ($(this).data('geojson')) {
                var parts = $(this).data('geojson').split('.');
                values[parts[0]] = parts[1];
            }
        });

    // Test for user entered input for marker-color
    var colorInput = $modal.find('#marker-color').val();
    if (colorInput && (/^#?([0-9a-f]{6})$/i).test(color.formatHex(colorInput))) {
        values['marker-color'] = color.formatHex(colorInput);
    }

    if (Views.modal.modals && Views.modal.modals.propertyassign) {
        Views.modal.modals.propertyassign.callback(null, values);
    } else {
        Views.modal.done('propertyassign');
    }

    return false;
};

Editor.prototype.renderName = function(model, val) {
    $('.project-name').text(val);
};

Editor.prototype.renderID = function(model, val) {
    if (model.id.split('.')[0] === 'api') return;
    $('.project-id').each(function() {
        if ($(this).is('input')) {
            $(this).attr('value',model.id);
        } else {
            $(this).text(model.id);
        }
    });
    if (this.info) {
        this.info.render();
        this.updateEmbed();
    }
};

Editor.prototype.signup = function(ev) {
    Views.modal.show('auth', {close:true}, function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
    });
    Views.modal.slide('active3');
};

Editor.prototype.set = function(ev) {
    var el = $(ev.currentTarget);
    var attr = {};
    if (el.is('input[type=checkbox]') || el.is('input[type=radio]')) {
        attr[el.attr('name')] = el.is(':checked');
    } else {
        attr[el.attr('name')] = el.val();
    }
    this.model.set(attr);
};

Editor.prototype.saved = function() {
    this.changes = false;
    $('#project').removeClass('changed');
    $('#map-saveshare').removeClass('active1 active2').addClass('active1');
    // potentially update map id
    this.info.render();
    this.updateEmbed();
    bindClipboard();
    analytics.track('Saved a Map');
};

Editor.prototype.changed = function() {
    this.changes = true;
    $('#project').addClass('changed');
    $('#map-saveshare').removeClass('active1 active2').addClass('active2');
};

Editor.prototype.reset = function() {
    window.location.href = '#app';
    this.markers.clear();
    this.map.closePopup();
};

Editor.prototype.tabs = App.tabs;

Editor.prototype.inputselect = function(ev) {
    $(ev.currentTarget).select();
};

Editor.prototype.inputIncrement = inputIncrement;
Editor.prototype.pager = pager;

Editor.prototype.helpToggle = function(ev) {
    if ($(this.el).is('.showhelp')) {
        App.storage('editor.help', true);
        $(this.el).removeClass('showhelp');
    } else {
        App.storage('editor.help', null);
        $(this.el).addClass('showhelp');
    }
    return false;
};

Editor.prototype.styleSet = function(ev) {
    var el = $(ev.currentTarget);
    this.style[ev.currentTarget.name](ev.currentTarget.value);
    this.style.refresh();
    this.style.make();
};

Editor.prototype.markerDel = function(ev) {
    var id = $(ev.currentTarget).is('a') ?
        $(ev.currentTarget).attr('href').split('#').pop() :
        $(ev.currentTarget).parent().attr('id');
    this.markers.del(id);
    analytics.track('Deleted a Marker');
    return false;
};

Editor.prototype.drawMode = function(ev) {
    ev.preventDefault();
    var drawMode = $(ev.currentTarget).attr('href').split('#')[1];
    this.draw.activate(drawMode);
    return false;
};

Editor.prototype.markerEdit = function(ev) {
    var id = $(ev.currentTarget).attr('id');
    this.markers.edit(id);
    analytics.track('Edited a Marker');
    return false;
};

Editor.prototype.markerSet = _(function(ev) {
    if (!this.markers.editing) throw new Error('Nothing to edit');
    var el = $(ev.currentTarget);
    var key = ev.currentTarget.name;
    var val = ev.currentTarget.value;
    var v = val;

    // Validation
    if (key === 'marker-color' && !(/^#?([0-9a-f]{6})$/i).test(color.formatHex(val))) return;
    if (key === 'fill' && !(/^#?([0-9a-f]{6})$/i).test(color.formatHex(val))) return;
    if (key === 'stroke' && !(/^#?([0-9a-f]{6})$/i).test(color.formatHex(val))) return;
    if (key === 'fill-opacity') val = inRange(val, 0, 1, 0.5);
    if (key === 'stroke-opacity') val = inRange(val, 0, 1, 0.5);
    if (key === 'stroke-width') val = inRange(val, 0, 20, 3);

    // hex value keyed in, so clear the swatch checkmark
    if ($(ev.target).hasClass('color-hex')) {
        $('#marker-edit .label-select:checked').prop('checked', false);
    }

    if (key === 'latitude'  || key === 'longitude') {
        var f = parseFloat(val);
        if (!isNaN(f)) {
            this.markers.editing.geometry.coordinates[key === 'longitude' ? 0 : 1] = f;
            var latLng = L.latLng(
                this.markers.editing.geometry.coordinates[1],
                this.markers.editing.geometry.coordinates[0]).wrap();
            this.markers.layerById(this.markers.editing.properties.id).setLatLng(latLng);
            this.changed();
        }
    } else {
        if (v === val) {
            if (key === 'marker-color' ||
                key === 'fill' ||
                key === 'stroke') {
                setHex(key, val);
                val = color.formatHex(val);
            } else {
                $('#' + key).val(val);
            }
        }
        $('#' + this.markers.editing.id + ' .' + key).text(val);
        this.markers.editing.properties[key] = val;
        this.markers.refresh(this.markers.editing.properties.id);
        this.changed();
    }

    this.markers.syncUI();
}).throttle(50);

function setHex(key, val) {
    if (val[0] !== '#') val = '#' + val;
    var hsl = Streets.parseTintString(color.formatHex(val)),
        avg = (hsl.l[0] + hsl.l[1])/2;
    $('#' + key)
        .val(val)
        .css('background-color', val)
        .css('color', (avg >= 0.5) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,1)');
}

function inRange(v, a, b, def) {
    var f = parseFloat(v);
    if (isNaN(f)) return def;
    return Math.min(Math.max(f, a), b);
}

Editor.prototype.enterColorH = function(ev) {
    this.colorSelectMode = 'h';
    this.colorSelectTarget = ev.currentTarget;
    this.colorHSL(ev);
};

Editor.prototype.enterColorSL = function(ev) {
    this.colorSelectMode = 'sl';
    this.colorSelectTarget = ev.currentTarget;
    this.colorHSL(ev);
};

Editor.prototype.clearSelectMode = function() {
    this.colorSelectMode = false;
    this.colorSelectTarget = null;
};

Editor.prototype.colorHSL = color.colorHSL;

Editor.prototype.colorHex = color.colorHex;

Editor.prototype.styleSwatch = function(ev) {
    var hsl = Streets.parseTintString(ev.currentTarget.value);
    this.style.styles.whiz.h = Streets.avg(hsl.h);
    this.style.styles.whiz.s = Streets.avg(hsl.s);
    this.style.styles.whiz.l = Streets.avg(hsl.l);
    this.style.render('whiz');
};

Editor.prototype.stylePalette = function(ev) {
    var id = $(ev.currentTarget).attr('id').split('palette-').pop();
    if (id === 'custom') {
        $(this.$('#style-tint .color-tabs a').get(2)).click();
    } else {
        this.style.palette(id);
    }
    $(ev.currentTarget).addClass('active').siblings().removeClass('active');
    return false;
};

Editor.prototype.colorClamp = color.colorClamp;

Editor.prototype.colorOn = function(ev) {
    var id = $('input[name=id]', $(ev.currentTarget).attr('href')).val();
    this.style.styles[id].on = !this.style.styles[id].on;
    this.style.styles[id].a = this.style.styles[id].on ?
        (this.style.styles[id].a || 1) :
        this.style.styles[id].a;
    this.style.render(id);
    return false;
};

Editor.prototype.colorInv = function(ev) {
    var id = this.style.id(ev);
    this.style.styles[id].inv = !this.style.styles[id].inv;
    this.style.render(id);
    return false;
};

Editor.prototype.layersSet = function(ev) {
    var el = $(ev.currentTarget).is('a') ? $(ev.currentTarget) : $(ev.currentTarget).parents('a');
    this.layers.toggle(el.data('id'));
    return false;
};

Editor.prototype.layersBrowse = function(ev) {
    this.layers.browse();
    return false;
};

Editor.prototype.layersRender = function(ev) {
    this.layers.render();
};

Editor.prototype.layersSearch = function(ev) {
    this.layers.search(ev.currentTarget.value);
};

Editor.prototype.layersView = function(ev) {
    var el = $(ev.currentTarget).is('a') ? $(ev.currentTarget) : $(ev.currentTarget).parents('a');
    this.layers.setview(el.data('id'));
    return false;
};

Editor.prototype.searchSet = function(ev) {
    if (ev.type == 'click') ev = $('#' + ev.currentTarget.htmlFor);
    this.search.setview(ev);
    return false;
};

Editor.prototype.changeMode = function(ev) {
    this.draw.clear();
    this.markers.clear();
};

// Called from global App keydown.
Editor.prototype.keydown = function(ev) {
    if (!(/#(app|code|data|search|style|project)/).test(window.location.hash)) return;

    var key = ev.which,
        $target = $(ev.target);

    switch (window.location.hash) {
    case '#search':
        switch (key) {
        case 27: // esc
            return this.reset();
        case 38: // up
            ev.preventDefault();
            this.search.select(-1);
            return this.search.setview() && false;
        case 40: // down
            ev.preventDefault();
            this.search.select(1);
            return this.search.setview() && false;
        case 13: // return
            ev.preventDefault();
            return this.search.setview();
        default:
            this.search.focus(ev);
            return this.search.debounced(this.search.input.value);
        }
        break;
    case '#project':
    case '#style':
    case '#data':
        switch (key) {
        case 13: // return
            if (!ev.shiftKey) {
                ev.preventDefault();
                return ev.target.blur();
            }
            break;
        case 27: // esc
            if (_.contains(['input', 'textarea'], ev.target.tagName.toLowerCase())) {
                ev.preventDefault();
                return ev.target.blur();
            } else if (window.location.hash === '#data') {
                return this.draw.mode !== 'browse' ? this.draw.clear() : this.reset();
            } else {
                return this.reset();
            }
            break;
        }
        break;
    // Any state
    default:
        // 0-9a-z => start a new search.
        if (!ev.ctrlKey && !ev.metaKey && !ev.altKey && key >= 48 && key <= 90) {
            window.location.hash = '#search';
            this.search.input.value = '';
            this.search.focus(ev);
        }
        break;
    }

    // ESC: return to app default state
    if (key === 27) {
        return this.reset();
    }

    // TAB: listen for someone tabbing between inputs
    // This prevents half-scroll behavior due to how we use sliding panes
    if (key === 9 && $target.hasClass('js-noTabExit')) {
        ev.preventDefault();
    }
};

// Called from global App keyup.
Editor.prototype.keyup = function(ev) {
    if (!(/#(app|code|data|project|search|style)/).test(window.location.hash)) return;

    var key = ev.which;

    switch (window.location.hash) {
    case '#search':
        switch (key) {
        case 38:
        case 40:
        case 13:
            break;
        default:
            this.search.focus(ev);
            return this.search.debounced(this.search.input.value);
        }
        break;
    }
};

Editor.prototype.saveCenter = function() {
    this.changed();
    return false;
};

Editor.prototype.save = function() {
    var editor = this;
    var attr = {};
    attr.created = +new Date();
    if ($('#save-center').is(':checked')) {
        var center = this.map.getCenter().wrap();
        var zoom = this.map.getZoom();
        attr.center = [center.lng, center.lat, zoom];
    }
    // dont POST the map _rev back to the api. no conflicts,  last write wins.
    this.model.unset('_rev');
    this.model.set(attr);
    $('#app').addClass('loading');
    App.save(this.model, mapSaved);

    function mapSaved(err) {
        if (err) {
            $('#app').removeClass('loading');
            return err.code !== 'closed' && Views.modal.show('err', err);
        }
        editor.markers.save(markersSaved);
    }

    function markersSaved(err) {
        $('#app').removeClass('loading');
        if (err) return err.code !== 'closed' && Views.modal.show('err', err);
        editor.markers.model.set('id', editor.model.id);
        editor.saved();
        if (window.location.hash !== '#project') {
            editor.reset();
            window.location.hash = '#saved';
        }

        if (!App.param('id') && window.history && window.history.replaceState) {
            window.history.replaceState({}, '',
                '/editor/?id=' + editor.model.id + location.hash);
        }
    }

    return false;
};

Editor.prototype.updateEmbed = function() {
    var center = this.map.getCenter().wrap();
    var opts = ['attribution'];
    $('.embed-option').each(function() {
        if (this.checked) opts.push(this.id);
    });

    var url = 'https://a.tiles.mapbox.com/v4/' + this.model.id + '/' + opts.join(',') + '.html?access_token=' + (App.user ? App.user.accessToken : App.accessToken);
    var iframe = "<iframe width='100%' height='500px' frameBorder='0' src='" + url + "'></iframe>";
    $('#map-embed').val(iframe);
    $('#js-clipboard-embed').attr('data-clipboard-text', iframe);
};

Editor.prototype.render = function() {
    $('#project input[name=name]').val(this.model.get('name'));
    $('#project textarea[name=description]').val(this.model.get('description'));
    $('#project input[name=private]').attr('checked', !!this.model.get('private'));

    // If project is new, set center by default
    if(!this.model.get('_rev')) {
        $('#save-center').prop('checked', true);
        this.changed();
    }

    this.dropzone = this.$el.find('#dropzone');
    this.renderName(this.model, this.model.get('name'));
    this.renderID(this.model, this.model.id);
};

Editor.prototype.redraw = function() {
    if (!this.map) return;
    var layers = this.model.attributes.layers;
    if (layers.length > 15) {
        Views.modal.show('err', new Error('Your project exceeds the max layer limit of 15.'));
        layers = layers.slice(0,15);
    }
    var token = '?access_token=' + App.accessToken;
    var updated = '&update=' + (+new Date()).toString(36).substr(0,5);
    this.tilejson.tiles = [App.tileApi + '/v4/' + layers.join(',') + '/{z}/{x}/{y}.png' + token + updated];
    this.map.tileLayer._setTileJSON(this.tilejson);
    this.map.tileLayer.redraw();

    // Model attributes have been updated.
    this.changed();

    // Clear out stale values.
    var view = this;
    delete this.tilejson.grids;
    delete this.tilejson.legend;
    delete this.tilejson.attribution;
    if (this.map.gridLayer) {
        this.map.removeLayer(this.map.gridLayer);
        delete this.map.gridLayer;
    }
    if (this.map.gridControl) {
        this.map.removeControl(this.map.gridControl);
        delete this.map.gridControl;
    }
    if (this.map.legendControl) _(this.map.legendControl._legends).each(function(i,t) {
        view.map.legendControl.removeLegend(t);
    });

    App.tilejson(layers.join(','), function(err, json) {
        if (err) return;

        // Update min/max/bounds of tileLayer.
        view.tilejson.minzoom = json.minzoom;
        view.tilejson.maxzoom = json.maxzoom;
        view.tilejson.bounds = json.bounds;
        view.map.tileLayer.options.minZoom = json.minzoom;
        view.map.tileLayer.options.maxZoom = json.maxzoom;
        view.map.tileLayer.options.bounds = new L.LatLngBounds(
            new L.LatLng(json.bounds[1], json.bounds[0]),
            new L.LatLng(json.bounds[3], json.bounds[2])
        );
        view.map._updateZoomLevels();
        // Update grids/templates.
        if (json.template) {
            view.tilejson.grids = [App.tileApi + '/v4/' + layers.join(',') + '/{z}/{x}/{y}.grid.json' + token + updated];
            view.map.gridLayer = L.mapbox.gridLayer({
                grids: view.tilejson.grids,
                minzoom: json.minzoom,
                maxzoom: json.maxzoom
            });
            view.map.addLayer(view.map.gridLayer);
            view.map.gridControl = L.mapbox.gridControl(view.map.gridLayer, {template:json.template});
            view.map.addControl(view.map.gridControl);
        }
        // Update legend.
        if (json.legend) {
            view.tilejson.legend = json.legend;
            view.map.legendControl.addLegend(json.legend);
        }
        // Update attribution.
        if (json.attribution) {
            view.tilejson.attribution = json.attribution;
        }
        view.changed();
    });
};

function updateAvatar() {
    if (App.user && App.user.avatar) {
        $('#avatar').removeClass('big mapbox');
        $('#avatar').css('background-image', 'url("' + App.user.avatar + '")');
        $('#avatar').css('background-size', 'cover');
    } else {
        $('#avatar').addClass('big mapbox');
    }
}

function hashChange() {
    if (window.location.hash === '#search') $('#search input').focus();
}

Editor.prototype.initialize = function(options) {
    if (!this.model) throw new Error('Editor requires loaded model instance');
    if (!options.tilejson) throw new Error('Editor requires loaded tilejson object');

    this.tilejson = options.tilejson;

    if (window.location.hash === '#welcome') window.welcomeFlow = true;

    updateAvatar();

    this.redraw = _(this.redraw).bind(this);
    this.changed = _(this.changed).bind(this);
    this.model.on('change', _(this.changed).throttle(50));
    this.model.on('change:id', _(_.bind(this.renderID, this)).throttle(50));
    this.model.on('change:name', _(this.renderName).throttle(50));
    this.model.on('change:layers', _(this.redraw).throttle(500));

    this.render();

    var editor = this;

    // Omit the data key when instantiating the map.
    // Markers are loaded separately from the API by the marker module.
    var map = L.mapbox.map('map-app', _(this.tilejson).omit('data'), {
        zoomControl: false
    });
    this.map = map;

    var style = Style(App, editor);
    var markers = Markers(App, editor);
    var layers = Layers(App, map, editor);
    var draw = Draw(App, markers, editor);
    var search = Geocoder(editor, map, draw);
    var info = Info(editor, map, markers);
    // var geojsonPanel = GeoJSON(App, map, markers, editor);
    // this.geojsonPanel = geojsonPanel;

    this.style = style;
    this.markers = markers;
    this.search = search;
    this.layers = layers;
    this.draw = draw;
    this.info = info;

    // Display map coordinates
    this.map.on('move', this.displayView);
    this.map.on('moveend', _.bind(this.updateEmbed, this));

    // Global zoom handler
    this.map.on('zoomend', this.zoomToggle);

    // Global onhashchange handler. Calls module onhashchange handlers if set.
    if ('onhashchange' in window) window.onhashchange = function() {
        if (markers && markers.onhashchange) markers.onhashchange();
        if (draw && draw.onhashchange) draw.onhashchange();
        hashChange();
    };

    // Set initial mapview values
    this.displayView.call(this.map);

    // Project Info
    info.render();

    // Global onunload handler.
    if ('onbeforeunload' in window && !App.param('dev')) window.onbeforeunload = function() {
        if (editor.changes) return editor.model.escape('name') + ' has unsaved changes.';
    };

    // Show help if not hidden.
    var hideHelp = App.storage('editor.help');
    if (!hideHelp) this.helpToggle();
    bindClipboard();
    this.updateEmbed();
    return this;
};

function bindClipboard() {
    $('.js-clipboard').each(function() {
        var $clip = $(this);
        if (!$clip.data('zeroclipboard-bound')) {
            var clip = new ZeroClipboard(this);
            $clip.data('zeroclipboard-bound', true);
            clip.on('aftercopy', function() {
                $clip.siblings('input').select();
                $clip.addClass('clipped');
                setTimeout(function() {
                    $clip.removeClass('clipped');
                }, 1000);
            });
        }
    });
}

App.onUserLoad(function load() {
    if (Views.editor) return;
    if (!window.location.hash && !$('#splash').size()) window.location.hash = '#app';

    var mapid = App.param('id')||'api.tmpmap';
    var newmap = '?newmap=1';
    if (App.param('preset')) newmap += '&preset=' + App.param('preset');
    if (App.param('layers')) newmap += '&layers=' + App.param('layers');
    if (App.param('id')) App.storage('map.id', App.param('id'));

    Views.editor = true;
    (function getdata(opts) {
        if (!opts.model) {
            App.fetch('/api/Map/' + mapid + newmap, function(err, model) {
                if (!err && model.get('_type') !== 'composite') {
                    err = new Error('Cannot edit project ' + model.escape('id'));
                }
                if (err) return Views.modal.show('err', err);
                opts.model = model;
                getdata(opts);
            });
        } else if (!opts.tilejson) {
            var loaded = function(tilejson) {
                opts.tilejson = tilejson;
                // tilestream-pro#3591
                if (tilejson === undefined) tilejson.minzoom = 0;
                if (tilejson === undefined) tilejson.maxzoom = 19;
                tilejson.center = opts.model.get('center') || tilejson.center;
                getdata(opts);
            };
            App.tilejson(opts.model.get('layers').slice(0,15).join(','), function(err, tilejson) {
                if (err && err.status !== 404) {
                    Views.modal.show('err', err);
                // If a project has only 404'ing tilejson layers then *none*
                // of the layers exist. Fallback to a fully transparent
                // mapbox-streets rather than failing hard.
                } else if (err) {
                    App.tilejson('base.mapbox-streets', function(err, tilejson) {
                        if (err) return Views.modal.show('err', err);
                        loaded(tilejson);
                    });
                // Tilejson for layers loaded successfully.
                } else {
                    loaded(tilejson);
                }
            });
        } else if (!App.param('layers') && !opts.model.get('_rev') && !opts.local) {
            App.local(function(err, local) {
                opts.local = local || opts.model.get('center');
                opts.model.set({center:opts.local});
                getdata(opts);
            });
        } else {
            opts.el = $('body');
            Views.editor = new Editor(opts);
        }
    })({});
});

})();

},{"./src/draw":14,"./src/drop":15,"./src/geocoder":16,"./src/info":17,"./src/layers":18,"./src/lib/color":19,"./src/lib/inputincrement":24,"./src/lib/pager":26,"./src/lib/streets":28,"./src/lib/zoom":30,"./src/markers":31,"./src/style":32,"fs":33}],2:[function(require,module,exports){
var dsv = require('dsv'),
    sexagesimal = require('sexagesimal');

function isLat(f) { return !!f.match(/(Lat)(itude)?/gi); }
function isLon(f) { return !!f.match(/(L)(on|ng)(gitude)?/i); }

function keyCount(o) {
    return (typeof o == 'object') ? Object.keys(o).length : 0;
}

function autoDelimiter(x) {
    var delimiters = [',', ';', '\t', '|'];
    var results = [];

    delimiters.forEach(function(delimiter) {
        var res = dsv(delimiter).parse(x);
        if (res.length >= 1) {
            var count = keyCount(res[0]);
            for (var i = 0; i < res.length; i++) {
                if (keyCount(res[i]) !== count) return;
            }
            results.push({
                delimiter: delimiter,
                arity: Object.keys(res[0]).length,
            });
        }
    });

    if (results.length) {
        return results.sort(function(a, b) {
            return b.arity - a.arity;
        })[0].delimiter;
    } else {
        return null;
    }
}

function auto(x) {
    var delimiter = autoDelimiter(x);
    if (!delimiter) return null;
    return dsv(delimiter).parse(x);
}

function csv2geojson(x, options, callback) {

    if (!callback) {
        callback = options;
        options = {};
    }

    options.delimiter = options.delimiter || ',';

    var latfield = options.latfield || '',
        lonfield = options.lonfield || '';

    var features = [],
        featurecollection = { type: 'FeatureCollection', features: features };

    if (options.delimiter === 'auto' && typeof x == 'string') {
        options.delimiter = autoDelimiter(x);
        if (!options.delimiter) return callback({
            type: 'Error',
            message: 'Could not autodetect delimiter'
        });
    }

    var parsed = (typeof x == 'string') ? dsv(options.delimiter).parse(x) : x;

    if (!parsed.length) return callback(null, featurecollection);

    if (!latfield || !lonfield) {
        for (var f in parsed[0]) {
            if (!latfield && isLat(f)) latfield = f;
            if (!lonfield && isLon(f)) lonfield = f;
        }
        if (!latfield || !lonfield) {
            var fields = [];
            for (var k in parsed[0]) fields.push(k);
            return callback({
                type: 'Error',
                message: 'Latitude and longitude fields not present',
                data: parsed,
                fields: fields
            });
        }
    }

    var errors = [];

    for (var i = 0; i < parsed.length; i++) {
        if (parsed[i][lonfield] !== undefined &&
            parsed[i][lonfield] !== undefined) {

            var lonk = parsed[i][lonfield],
                latk = parsed[i][latfield],
                lonf, latf,
                a;

            a = sexagesimal(lonk, 'EW');
            if (a) lonk = a;
            a = sexagesimal(latk, 'NS');
            if (a) latk = a;

            lonf = parseFloat(lonk);
            latf = parseFloat(latk);

            if (isNaN(lonf) ||
                isNaN(latf)) {
                errors.push({
                    message: 'A row contained an invalid value for latitude or longitude',
                    row: parsed[i]
                });
            } else {
                if (!options.includeLatLon) {
                    delete parsed[i][lonfield];
                    delete parsed[i][latfield];
                }

                features.push({
                    type: 'Feature',
                    properties: parsed[i],
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            parseFloat(lonf),
                            parseFloat(latf)
                        ]
                    }
                });
            }
        }
    }

    callback(errors.length ? errors: null, featurecollection);
}

function toLine(gj) {
    var features = gj.features;
    var line = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: []
        }
    };
    for (var i = 0; i < features.length; i++) {
        line.geometry.coordinates.push(features[i].geometry.coordinates);
    }
    line.properties = features[0].properties;
    return {
        type: 'FeatureCollection',
        features: [line]
    };
}

function toPolygon(gj) {
    var features = gj.features;
    var poly = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [[]]
        }
    };
    for (var i = 0; i < features.length; i++) {
        poly.geometry.coordinates[0].push(features[i].geometry.coordinates);
    }
    poly.properties = features[0].properties;
    return {
        type: 'FeatureCollection',
        features: [poly]
    };
}

module.exports = {
    isLon: isLon,
    isLat: isLat,
    csv: dsv.csv.parse,
    tsv: dsv.tsv.parse,
    dsv: dsv,
    auto: auto,
    csv2geojson: csv2geojson,
    toLine: toLine,
    toPolygon: toPolygon
};

},{"dsv":3,"sexagesimal":4}],3:[function(require,module,exports){
var fs = require("fs");

module.exports = new Function("dsv.version = \"0.0.3\";\n\ndsv.tsv = dsv(\"\\t\");\ndsv.csv = dsv(\",\");\n\nfunction dsv(delimiter) {\n  var dsv = {},\n      reFormat = new RegExp(\"[\\\"\" + delimiter + \"\\n]\"),\n      delimiterCode = delimiter.charCodeAt(0);\n\n  dsv.parse = function(text, f) {\n    var o;\n    return dsv.parseRows(text, function(row, i) {\n      if (o) return o(row, i - 1);\n      var a = new Function(\"d\", \"return {\" + row.map(function(name, i) {\n        return JSON.stringify(name) + \": d[\" + i + \"]\";\n      }).join(\",\") + \"}\");\n      o = f ? function(row, i) { return f(a(row), i); } : a;\n    });\n  };\n\n  dsv.parseRows = function(text, f) {\n    var EOL = {}, // sentinel value for end-of-line\n        EOF = {}, // sentinel value for end-of-file\n        rows = [], // output rows\n        N = text.length,\n        I = 0, // current character index\n        n = 0, // the current line number\n        t, // the current token\n        eol; // is the current token followed by EOL?\n\n    function token() {\n      if (I >= N) return EOF; // special case: end of file\n      if (eol) return eol = false, EOL; // special case: end of line\n\n      // special case: quotes\n      var j = I;\n      if (text.charCodeAt(j) === 34) {\n        var i = j;\n        while (i++ < N) {\n          if (text.charCodeAt(i) === 34) {\n            if (text.charCodeAt(i + 1) !== 34) break;\n            ++i;\n          }\n        }\n        I = i + 2;\n        var c = text.charCodeAt(i + 1);\n        if (c === 13) {\n          eol = true;\n          if (text.charCodeAt(i + 2) === 10) ++I;\n        } else if (c === 10) {\n          eol = true;\n        }\n        return text.substring(j + 1, i).replace(/\"\"/g, \"\\\"\");\n      }\n\n      // common case: find next delimiter or newline\n      while (I < N) {\n        var c = text.charCodeAt(I++), k = 1;\n        if (c === 10) eol = true; // \\n\n        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \\r|\\r\\n\n        else if (c !== delimiterCode) continue;\n        return text.substring(j, I - k);\n      }\n\n      // special case: last token before EOF\n      return text.substring(j);\n    }\n\n    while ((t = token()) !== EOF) {\n      var a = [];\n      while (t !== EOL && t !== EOF) {\n        a.push(t);\n        t = token();\n      }\n      if (f && !(a = f(a, n++))) continue;\n      rows.push(a);\n    }\n\n    return rows;\n  };\n\n  dsv.format = function(rows) {\n    if (Array.isArray(rows[0])) return dsv.formatRows(rows); // deprecated; use formatRows\n    var fieldSet = {}, fields = [];\n\n    // Compute unique fields in order of discovery.\n    rows.forEach(function(row) {\n      for (var field in row) {\n        if (!(field in fieldSet)) {\n          fields.push(fieldSet[field] = field);\n        }\n      }\n    });\n\n    return [fields.map(formatValue).join(delimiter)].concat(rows.map(function(row) {\n      return fields.map(function(field) {\n        return formatValue(row[field]);\n      }).join(delimiter);\n    })).join(\"\\n\");\n  };\n\n  dsv.formatRows = function(rows) {\n    return rows.map(formatRow).join(\"\\n\");\n  };\n\n  function formatRow(row) {\n    return row.map(formatValue).join(delimiter);\n  }\n\n  function formatValue(text) {\n    return reFormat.test(text) ? \"\\\"\" + text.replace(/\\\"/g, \"\\\"\\\"\") + \"\\\"\" : text;\n  }\n\n  return dsv;\n}\n" + ";return dsv")();

},{"fs":33}],4:[function(require,module,exports){
module.exports = function(x, dims) {
    if (!dims) dims = 'NSEW';
    if (typeof x !== 'string') return null;
    var r = /^([0-9.]+)Â°? *(?:([0-9.]+)['â€™â€²â€˜] *)?(?:([0-9.]+)(?:''|"|â€|â€³) *)?([NSEW])?/,
        m = x.match(r);
    if (!m) return null;
    else if (m[4] && dims.indexOf(m[4]) === -1) return null;
    else return (((m[1]) ? parseFloat(m[1]) : 0) +
        ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
        ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
        ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1);
};

},{}],5:[function(require,module,exports){
var d3 = require('d3');
var queue = require('queue-async');

module.exports = geocodemany;

function geocodemany(mapid, throttle) {
    throttle = (throttle === undefined) ? 200 : throttle;
    return function(list, transform, progress, callback) {

        var q = queue(1),
            todo = list.length,
            out = [],
            left = [],
            statuses = d3.range(todo).map(function() { return undefined; }),
            done = 0;

        function error(err, callback) {
            statuses[done] = false;
            progress({
                todo: todo,
                done: ++done,
                status: 'error',
                statuses: statuses
            });
            setTimeout(function() {
                callback(null, err);
            }, throttle);
        }

        // forgive me
        function copy(o) { return JSON.parse(JSON.stringify(o)); }

        function run(obj, callback) {
            var str = transform(obj);
            var output = copy(obj);
            d3.json('https://api.tiles.mapbox.com/v3/' + mapid + '/geocode/' +
                encodeURIComponent(str) + '.json')
                .on('load', function(data) {
                    if (data && data.results && data.results.length &&
                        data.results[0].length) {

                        var ll = data.results[0][0];
                        output.latitude = ll.lat;
                        output.longitude = ll.lon;
                        statuses[done] = true;
                        progress({
                            todo: todo,
                            data: data ? data : {},
                            done: ++done,
                            status: 'success',
                            statuses: statuses
                        });
                        setTimeout(function() {
                            callback(null, output);
                        }, throttle);

                    } else {

                        error({
                            error: new Error('Location not found'),
                            __iserror__: true,
                            data: output
                        }, callback);

                    }
                })
                .on('error', function(err) {

                    error({
                        error: err,
                        __iserror__: true,
                        data: output
                    }, callback);

                })
                .get();
        }

        function enqueue(obj) {
            q.defer(run, obj);
        }

        list.forEach(enqueue);

        q.awaitAll(function(err, res) {
            callback(res
                .filter(function(r) { return r.__iserror__; })
                .map(function(r) { delete r.__iserror__; return r; }),
                res.filter(function(r) { return !r.__iserror__; }));
        });
    };
}

},{"d3":6,"queue-async":7}],6:[function(require,module,exports){
!function() {
  var d3 = {
    version: "3.4.6"
  };
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  var d3_arraySlice = [].slice, d3_array = function(list) {
    return d3_arraySlice.call(list);
  };
  var d3_document = document, d3_documentElement = d3_document.documentElement, d3_window = window;
  try {
    d3_array(d3_documentElement.childNodes)[0].nodeType;
  } catch (e) {
    d3_array = function(list) {
      var i = list.length, array = new Array(i);
      while (i--) array[i] = list[i];
      return array;
    };
  }
  try {
    d3_document.createElement("div").style.setProperty("opacity", 0, "");
  } catch (error) {
    var d3_element_prototype = d3_window.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = d3_window.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
    d3_element_prototype.setAttribute = function(name, value) {
      d3_element_setAttribute.call(this, name, value + "");
    };
    d3_element_prototype.setAttributeNS = function(space, local, value) {
      d3_element_setAttributeNS.call(this, space, local, value + "");
    };
    d3_style_prototype.setProperty = function(name, value, priority) {
      d3_style_setProperty.call(this, name, value + "", priority);
    };
  }
  d3.ascending = d3_ascending;
  function d3_ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n && !((a = c = array[i]) != null && a <= a)) a = c = undefined;
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n && !((a = c = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (!isNaN(a = +array[i])) s += a;
    } else {
      while (++i < n) if (!isNaN(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  function d3_number(x) {
    return x != null && !isNaN(x);
  }
  d3.mean = function(array, f) {
    var s = 0, n = array.length, a, i = -1, j = n;
    if (arguments.length === 1) {
      while (++i < n) if (d3_number(a = array[i])) s += a; else --j;
    } else {
      while (++i < n) if (d3_number(a = f.call(array, array[i], i))) s += a; else --j;
    }
    return j ? s / j : undefined;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.median = function(array, f) {
    if (arguments.length > 1) array = array.map(f);
    array = array.filter(d3_number);
    return array.length ? d3.quantile(array.sort(d3_ascending), .5) : undefined;
  };
  function d3_bisector(compare) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  }
  var d3_bisect = d3_bisector(d3_ascending);
  d3.bisectLeft = d3_bisect.left;
  d3.bisect = d3.bisectRight = d3_bisect.right;
  d3.bisector = function(f) {
    return d3_bisector(f.length === 1 ? function(d, x) {
      return d3_ascending(f(d), x);
    } : f);
  };
  d3.shuffle = function(array) {
    var m = array.length, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m], array[m] = array[i], array[i] = t;
    }
    return array;
  };
  d3.permute = function(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.pairs = function(array) {
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];
    return pairs;
  };
  d3.zip = function() {
    if (!(n = arguments.length)) return [];
    for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m; ) {
      for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n; ) {
        zip[j] = arguments[j][i];
      }
    }
    return zips;
  };
  function d3_zipLength(d) {
    return d.length;
  }
  d3.transpose = function(matrix) {
    return d3.zip.apply(d3, matrix);
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  };
  var abs = Math.abs;
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  function d3_class(ctor, properties) {
    try {
      for (var key in properties) {
        Object.defineProperty(ctor.prototype, key, {
          value: properties[key],
          enumerable: false
        });
      }
    } catch (e) {
      ctor.prototype = properties;
    }
  }
  d3.map = function(object) {
    var map = new d3_Map();
    if (object instanceof d3_Map) object.forEach(function(key, value) {
      map.set(key, value);
    }); else for (var key in object) map.set(key, object[key]);
    return map;
  };
  function d3_Map() {}
  d3_class(d3_Map, {
    has: d3_map_has,
    get: function(key) {
      return this[d3_map_prefix + key];
    },
    set: function(key, value) {
      return this[d3_map_prefix + key] = value;
    },
    remove: d3_map_remove,
    keys: d3_map_keys,
    values: function() {
      var values = [];
      this.forEach(function(key, value) {
        values.push(value);
      });
      return values;
    },
    entries: function() {
      var entries = [];
      this.forEach(function(key, value) {
        entries.push({
          key: key,
          value: value
        });
      });
      return entries;
    },
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) f.call(this, key.substring(1), this[key]);
    }
  });
  var d3_map_prefix = "\x00", d3_map_prefixCode = d3_map_prefix.charCodeAt(0);
  function d3_map_has(key) {
    return d3_map_prefix + key in this;
  }
  function d3_map_remove(key) {
    key = d3_map_prefix + key;
    return key in this && delete this[key];
  }
  function d3_map_keys() {
    var keys = [];
    this.forEach(function(key) {
      keys.push(key);
    });
    return keys;
  }
  function d3_map_size() {
    var size = 0;
    for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) ++size;
    return size;
  }
  function d3_map_empty() {
    for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) return false;
    return true;
  }
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(mapType, array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      if (mapType) {
        object = mapType();
        setter = function(keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        setter = function(keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }
      valuesByKey.forEach(setter);
      return object;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var array = [], sortKey = sortKeys[depth++];
      map.forEach(function(key, keyMap) {
        array.push({
          key: key,
          values: entries(keyMap, depth)
        });
      });
      return sortKey ? array.sort(function(a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }
    nest.map = function(array, mapType) {
      return map(mapType, array, 0);
    };
    nest.entries = function(array) {
      return entries(map(d3.map, array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.set = function(array) {
    var set = new d3_Set();
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
    return set;
  };
  function d3_Set() {}
  d3_class(d3_Set, {
    has: d3_map_has,
    add: function(value) {
      this[d3_map_prefix + value] = true;
      return value;
    },
    remove: function(value) {
      value = d3_map_prefix + value;
      return value in this && delete this[value];
    },
    values: d3_map_keys,
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var value in this) if (value.charCodeAt(0) === d3_map_prefixCode) f.call(this, value.substring(1));
    }
  });
  d3.behavior = {};
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.substring(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
      var prefixName = d3_vendorPrefixes[i] + name;
      if (prefixName in object) return prefixName;
    }
  }
  var d3_vendorPrefixes = [ "webkit", "ms", "moz", "Moz", "o", "O" ];
  function d3_noop() {}
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i >= 0) {
      name = type.substring(i + 1);
      type = type.substring(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
      if (listener == null) for (type in this) {
        if (this.hasOwnProperty(type)) this[type].on(name, null);
      }
      return this;
    }
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.event = null;
  function d3_eventPreventDefault() {
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  var d3_subclass = {}.__proto__ ? function(object, prototype) {
    object.__proto__ = prototype;
  } : function(object, prototype) {
    for (var property in prototype) object[property] = prototype[property];
  };
  function d3_selection(groups) {
    d3_subclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectMatcher = d3_documentElement[d3_vendorSymbol(d3_documentElement, "matchesSelector")], d3_selectMatches = function(n, s) {
    return d3_selectMatcher.call(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = Sizzle;
    d3_selectMatches = Sizzle.matchesSelector;
  }
  d3.selection = function() {
    return d3_selectionRoot;
  };
  var d3_selectionPrototype = d3.selection.prototype = [];
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_selectAll(selector, this);
    };
  }
  var d3_nsPrefix = {
    svg: "../../www.w3.org/2000/svg.html",
    xhtml: "http://www.w3.org/1999/xhtml",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0) {
        prefix = name.substring(0, i);
        name = name.substring(i + 1);
      }
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = d3_selection_classes(name)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classes(name) {
    return name.trim().split(/^|\s+/);
  }
  function d3_selection_classed(name, value) {
    name = d3_selection_classes(name).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.getAttribute("class") || "";
      if (value) {
        re.lastIndex = 0;
        if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
      } else {
        node.setAttribute("class", d3_collapse(c.replace(re, " ")));
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3_selection_creator(name);
    return this.select(function() {
      return this.appendChild(name.apply(this, arguments));
    });
  };
  function d3_selection_creator(name) {
    return typeof name === "function" ? name : (name = d3.ns.qualify(name)).local ? function() {
      return this.ownerDocument.createElementNS(name.space, name.local);
    } : function() {
      return this.ownerDocument.createElementNS(this.namespaceURI, name);
    };
  }
  d3_selectionPrototype.insert = function(name, before) {
    name = d3_selection_creator(name);
    before = d3_selection_selector(before);
    return this.select(function() {
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
    });
  };
  d3_selectionPrototype.remove = function() {
    return this.each(function() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    });
  };
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), dataByKeyValue = new d3_Map(), keyValues = [], keyValue;
        for (i = -1; ++i < n; ) {
          keyValue = key.call(node = group[i], node.__data__, i);
          if (nodeByKeyValue.has(keyValue)) {
            exitNodes[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
          keyValues.push(keyValue);
        }
        for (i = -1; ++i < m; ) {
          keyValue = key.call(groupData, nodeData = groupData[i], i);
          if (node = nodeByKeyValue.get(keyValue)) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          } else if (!dataByKeyValue.has(keyValue)) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
          dataByKeyValue.set(keyValue, nodeData);
          nodeByKeyValue.remove(keyValue);
        }
        for (i = -1; ++i < n; ) {
          if (nodeByKeyValue.has(keyValues[i])) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3_ascending;
    return function(a, b) {
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
    };
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.size = function() {
    var n = 0;
    this.each(function() {
      ++n;
    });
    return n;
  };
  function d3_selection_enter(selection) {
    d3_subclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  d3_selection_enterPrototype.insert = function(name, before) {
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
    return d3_selectionPrototype.insert.call(this, name, before);
  };
  function d3_selection_enterInsertBefore(enter) {
    var i0, j0;
    return function(d, i, j) {
      var group = enter[j].update, n = group.length, node;
      if (j != j0) j0 = j, i0 = 0;
      if (i >= i0) i0 = i + 1;
      while (!(node = group[i0]) && ++i0 < n) ;
      return node;
    };
  }
  d3_selectionPrototype.transition = function() {
    var id = d3_transitionInheritId || ++d3_transitionId, subgroups = [], subgroup, node, transition = d3_transitionInherit || {
      time: Date.now(),
      ease: d3_ease_cubicInOut,
      delay: 0,
      duration: 250
    };
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_selectionPrototype.interrupt = function() {
    return this.each(d3_selection_interrupt);
  };
  function d3_selection_interrupt() {
    var lock = this.__transition__;
    if (lock) ++lock.active;
  }
  d3.select = function(node) {
    var group = [ typeof node === "string" ? d3_select(node, d3_document) : node ];
    group.parentNode = d3_documentElement;
    return d3_selection([ group ]);
  };
  d3.selectAll = function(nodes) {
    var group = d3_array(typeof nodes === "string" ? d3_selectAll(nodes, d3_document) : nodes);
    group.parentNode = d3_documentElement;
    return d3_selection([ group ]);
  };
  var d3_selectionRoot = d3.select(d3_documentElement);
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf("."), wrap = d3_selection_onListener;
    if (i > 0) type = type.substring(0, i);
    var filter = d3_selection_onFilters.get(type);
    if (filter) type = filter, wrap = d3_selection_onFilter;
    function onRemove() {
      var l = this[name];
      if (l) {
        this.removeEventListener(type, l, l.$);
        delete this[name];
      }
    }
    function onAdd() {
      var l = wrap(listener, d3_array(arguments));
      onRemove.call(this);
      this.addEventListener(type, this[name] = l, l.$ = capture);
      l._ = listener;
    }
    function removeAll() {
      var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"), match;
      for (var name in this) {
        if (match = name.match(re)) {
          var l = this[name];
          this.removeEventListener(match[1], l, l.$);
          delete this[name];
        }
      }
    }
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;
  }
  var d3_selection_onFilters = d3.map({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  });
  d3_selection_onFilters.forEach(function(k) {
    if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
  });
  function d3_selection_onListener(listener, argumentz) {
    return function(e) {
      var o = d3.event;
      d3.event = e;
      argumentz[0] = this.__data__;
      try {
        listener.apply(this, argumentz);
      } finally {
        d3.event = o;
      }
    };
  }
  function d3_selection_onFilter(listener, argumentz) {
    var l = d3_selection_onListener(listener, argumentz);
    return function(e) {
      var target = this, related = e.relatedTarget;
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {
        l.call(target, e);
      }
    };
  }
  var d3_event_dragSelect = "onselectstart" in d3_document ? null : d3_vendorSymbol(d3_documentElement.style, "userSelect"), d3_event_dragId = 0;
  function d3_event_dragSuppress() {
    var name = ".dragsuppress-" + ++d3_event_dragId, click = "click" + name, w = d3.select(d3_window).on("touchmove" + name, d3_eventPreventDefault).on("dragstart" + name, d3_eventPreventDefault).on("selectstart" + name, d3_eventPreventDefault);
    if (d3_event_dragSelect) {
      var style = d3_documentElement.style, select = style[d3_event_dragSelect];
      style[d3_event_dragSelect] = "none";
    }
    return function(suppressClick) {
      w.on(name, null);
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
      if (suppressClick) {
        function off() {
          w.on(click, null);
        }
        w.on(click, function() {
          d3_eventPreventDefault();
          off();
        }, true);
        setTimeout(off, 0);
      }
    };
  }
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  function d3_mousePoint(container, e) {
    if (e.changedTouches) e = e.changedTouches[0];
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = e.clientX, point.y = e.clientY;
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, d3_behavior_dragMouseSubject, "mousemove", "mouseup"), touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_behavior_dragTouchSubject, "touchmove", "touchend");
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", touchstart);
    }
    function dragstart(id, position, subject, move, end) {
      return function() {
        var that = this, target = d3.event.target, parent = that.parentNode, dispatch = event.of(that, arguments), dragged = 0, dragId = id(), dragName = ".drag" + (dragId == null ? "" : "-" + dragId), dragOffset, dragSubject = d3.select(subject()).on(move + dragName, moved).on(end + dragName, ended), dragRestore = d3_event_dragSuppress(), position0 = position(parent, dragId);
        if (origin) {
          dragOffset = origin.apply(that, arguments);
          dragOffset = [ dragOffset.x - position0[0], dragOffset.y - position0[1] ];
        } else {
          dragOffset = [ 0, 0 ];
        }
        dispatch({
          type: "dragstart"
        });
        function moved() {
          var position1 = position(parent, dragId), dx, dy;
          if (!position1) return;
          dx = position1[0] - position0[0];
          dy = position1[1] - position0[1];
          dragged |= dx | dy;
          position0 = position1;
          dispatch({
            type: "drag",
            x: position1[0] + dragOffset[0],
            y: position1[1] + dragOffset[1],
            dx: dx,
            dy: dy
          });
        }
        function ended() {
          if (!position(parent, dragId)) return;
          dragSubject.on(move + dragName, null).on(end + dragName, null);
          dragRestore(dragged && d3.event.target === target);
          dispatch({
            type: "dragend"
          });
        }
      };
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  function d3_behavior_dragTouchId() {
    return d3.event.changedTouches[0].identifier;
  }
  function d3_behavior_dragTouchSubject() {
    return d3.event.target;
  }
  function d3_behavior_dragMouseSubject() {
    return d3_window;
  }
  var Ï€ = Math.PI, Ï„ = 2 * Ï€, halfÏ€ = Ï€ / 2, Îµ = 1e-6, Îµ2 = Îµ * Îµ, d3_radians = Ï€ / 180, d3_degrees = 180 / Ï€;
  function d3_sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function d3_cross2d(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
  function d3_acos(x) {
    return x > 1 ? 0 : x < -1 ? Ï€ : Math.acos(x);
  }
  function d3_asin(x) {
    return x > 1 ? halfÏ€ : x < -1 ? -halfÏ€ : Math.asin(x);
  }
  function d3_sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }
  function d3_cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }
  function d3_tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }
  function d3_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  var Ï = Math.SQRT2, Ï2 = 2, Ï4 = 4;
  d3.interpolateZoom = function(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2];
    var dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + Ï4 * d2) / (2 * w0 * Ï2 * d1), b1 = (w1 * w1 - w0 * w0 - Ï4 * d2) / (2 * w1 * Ï2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), dr = r1 - r0, S = (dr || Math.log(w1 / w0)) / Ï;
    function interpolate(t) {
      var s = t * S;
      if (dr) {
        var coshr0 = d3_cosh(r0), u = w0 / (Ï2 * d1) * (coshr0 * d3_tanh(Ï * s + r0) - d3_sinh(r0));
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(Ï * s + r0) ];
      }
      return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(Ï * s) ];
    }
    interpolate.duration = S * 1e3;
    return interpolate;
  };
  d3.behavior.zoom = function() {
    var view = {
      x: 0,
      y: 0,
      k: 1
    }, translate0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"), x0, x1, y0, y1;
    function zoom(g) {
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on(mousemove, mousewheelreset).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
      g.each(function() {
        var dispatch = event.of(this, arguments), view1 = view;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.zoom", function() {
            view = this.__chart__ || {
              x: 0,
              y: 0,
              k: 1
            };
            zoomstarted(dispatch);
          }).tween("zoom:zoom", function() {
            var dx = size[0], dy = size[1], cx = dx / 2, cy = dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
            return function(t) {
              var l = i(t), k = dx / l[2];
              this.__chart__ = view = {
                x: cx - l[0] * k,
                y: cy - l[1] * k,
                k: k
              };
              zoomed(dispatch);
            };
          }).each("end.zoom", function() {
            zoomended(dispatch);
          });
        } else {
          this.__chart__ = view;
          zoomstarted(dispatch);
          zoomed(dispatch);
          zoomended(dispatch);
        }
      });
    };
    zoom.translate = function(_) {
      if (!arguments.length) return [ view.x, view.y ];
      view = {
        x: +_[0],
        y: +_[1],
        k: view.k
      };
      rescale();
      return zoom;
    };
    zoom.scale = function(_) {
      if (!arguments.length) return view.k;
      view = {
        x: view.x,
        y: view.y,
        k: +_
      };
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(_) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.center = function(_) {
      if (!arguments.length) return center;
      center = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.size = function(_) {
      if (!arguments.length) return size;
      size = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    function location(p) {
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      view.x += p[0] - l[0];
      view.y += p[1] - l[1];
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - view.x) / view.k;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - view.y) / view.k;
      }).map(y0.invert));
    }
    function zoomstarted(dispatch) {
      dispatch({
        type: "zoomstart"
      });
    }
    function zoomed(dispatch) {
      rescale();
      dispatch({
        type: "zoom",
        scale: view.k,
        translate: [ view.x, view.y ]
      });
    }
    function zoomended(dispatch) {
      dispatch({
        type: "zoomend"
      });
    }
    function mousedowned() {
      var that = this, target = d3.event.target, dispatch = event.of(that, arguments), dragged = 0, subject = d3.select(d3_window).on(mousemove, moved).on(mouseup, ended), location0 = location(d3.mouse(that)), dragRestore = d3_event_dragSuppress();
      d3_selection_interrupt.call(that);
      zoomstarted(dispatch);
      function moved() {
        dragged = 1;
        translateTo(d3.mouse(that), location0);
        zoomed(dispatch);
      }
      function ended() {
        subject.on(mousemove, d3_window === that ? mousewheelreset : null).on(mouseup, null);
        dragRestore(dragged && d3.event.target === target);
        zoomended(dispatch);
      }
    }
    function touchstarted() {
      var that = this, dispatch = event.of(that, arguments), locations0 = {}, distance0 = 0, scale0, zoomName = ".zoom-" + d3.event.changedTouches[0].identifier, touchmove = "touchmove" + zoomName, touchend = "touchend" + zoomName, target = d3.select(d3.event.target).on(touchmove, moved).on(touchend, ended), subject = d3.select(that).on(mousedown, null).on(touchstart, started), dragRestore = d3_event_dragSuppress();
      d3_selection_interrupt.call(that);
      started();
      zoomstarted(dispatch);
      function relocate() {
        var touches = d3.touches(that);
        scale0 = view.k;
        touches.forEach(function(t) {
          if (t.identifier in locations0) locations0[t.identifier] = location(t);
        });
        return touches;
      }
      function started() {
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          locations0[changed[i].identifier] = null;
        }
        var touches = relocate(), now = Date.now();
        if (touches.length === 1) {
          if (now - touchtime < 500) {
            var p = touches[0], l = locations0[p.identifier];
            scaleTo(view.k * 2);
            translateTo(p, l);
            d3_eventPreventDefault();
            zoomed(dispatch);
          }
          touchtime = now;
        } else if (touches.length > 1) {
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
          distance0 = dx * dx + dy * dy;
        }
      }
      function moved() {
        var touches = d3.touches(that), p0, l0, p1, l1;
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
          p1 = touches[i];
          if (l1 = locations0[p1.identifier]) {
            if (l0) break;
            p0 = p1, l0 = l1;
          }
        }
        if (l1) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
          scaleTo(scale1 * scale0);
        }
        touchtime = null;
        translateTo(p0, l0);
        zoomed(dispatch);
      }
      function ended() {
        if (d3.event.touches.length) {
          var changed = d3.event.changedTouches;
          for (var i = 0, n = changed.length; i < n; ++i) {
            delete locations0[changed[i].identifier];
          }
          for (var identifier in locations0) {
            return void relocate();
          }
        }
        target.on(zoomName, null);
        subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
        dragRestore();
        zoomended(dispatch);
      }
    }
    function mousewheeled() {
      var dispatch = event.of(this, arguments);
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this), 
      zoomstarted(dispatch);
      mousewheelTimer = setTimeout(function() {
        mousewheelTimer = null;
        zoomended(dispatch);
      }, 50);
      d3_eventPreventDefault();
      var point = center || d3.mouse(this);
      if (!translate0) translate0 = location(point);
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
      translateTo(point, translate0);
      zoomed(dispatch);
    }
    function mousewheelreset() {
      translate0 = null;
    }
    function dblclicked() {
      var dispatch = event.of(this, arguments), p = d3.mouse(this), l = location(p), k = Math.log(view.k) / Math.LN2;
      zoomstarted(dispatch);
      scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));
      translateTo(p, l);
      zoomed(dispatch);
      zoomended(dispatch);
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ];
  var d3_behavior_zoomDelta, d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() {
    return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
  }, "wheel") : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() {
    return d3.event.wheelDelta;
  }, "mousewheel") : (d3_behavior_zoomDelta = function() {
    return -d3.event.detail;
  }, "MozMousePixelScroll");
  function d3_Color() {}
  d3_Color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.hsl = function(h, s, l) {
    return arguments.length === 1 ? h instanceof d3_Hsl ? d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : d3_hsl(+h, +s, +l);
  };
  function d3_hsl(h, s, l) {
    return new d3_Hsl(h, s, l);
  }
  function d3_Hsl(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
  }
  var d3_hslPrototype = d3_Hsl.prototype = new d3_Color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = function(h, c, l) {
    return arguments.length === 1 ? h instanceof d3_Hcl ? d3_hcl(h.h, h.c, h.l) : h instanceof d3_Lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : d3_hcl(+h, +c, +l);
  };
  function d3_hcl(h, c, l) {
    return new d3_Hcl(h, c, l);
  }
  function d3_Hcl(h, c, l) {
    this.h = h;
    this.c = c;
    this.l = l;
  }
  var d3_hclPrototype = d3_Hcl.prototype = new d3_Color();
  d3_hclPrototype.brighter = function(k) {
    return d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    if (isNaN(h)) h = 0;
    if (isNaN(c)) c = 0;
    return d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = function(l, a, b) {
    return arguments.length === 1 ? l instanceof d3_Lab ? d3_lab(l.l, l.a, l.b) : l instanceof d3_Hcl ? d3_hcl_lab(l.l, l.c, l.h) : d3_rgb_lab((l = d3.rgb(l)).r, l.g, l.b) : d3_lab(+l, +a, +b);
  };
  function d3_lab(l, a, b) {
    return new d3_Lab(l, a, b);
  }
  function d3_Lab(l, a, b) {
    this.l = l;
    this.a = a;
    this.b = b;
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_Lab.prototype = new d3_Color();
  d3_labPrototype.brighter = function(k) {
    return d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return l > 0 ? d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : d3_hcl(NaN, NaN, l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  d3.rgb = function(r, g, b) {
    return arguments.length === 1 ? r instanceof d3_Rgb ? d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : d3_rgb(~~r, ~~g, ~~b);
  };
  function d3_rgbNumber(value) {
    return d3_rgb(value >> 16, value >> 8 & 255, value & 255);
  }
  function d3_rgbString(value) {
    return d3_rgbNumber(value) + "";
  }
  function d3_rgb(r, g, b) {
    return new d3_Rgb(r, g, b);
  }
  function d3_Rgb(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  var d3_rgbPrototype = d3_Rgb.prototype = new d3_Color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return d3_rgb(Math.min(255, ~~(r / k)), Math.min(255, ~~(g / k)), Math.min(255, ~~(b / k)));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_rgb(~~(k * this.r), ~~(k * this.g), ~~(k * this.b));
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    var r = 0, g = 0, b = 0, m1, m2, color;
    m1 = /([a-z]+)\((.*)\)/i.exec(format);
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (color = d3_rgb_names.get(format)) return rgb(color.r, color.g, color.b);
    if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.substring(1), 16))) {
      if (format.length === 4) {
        r = (color & 3840) >> 4;
        r = r >> 4 | r;
        g = color & 240;
        g = g >> 4 | g;
        b = color & 15;
        b = b << 4 | b;
      } else if (format.length === 7) {
        r = (color & 16711680) >> 16;
        g = (color & 65280) >> 8;
        b = color & 255;
      }
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      h = NaN;
      s = l > 0 && l < 1 ? 0 : h;
    }
    return d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgbNumber(value));
  });
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  function d3_identity(d) {
    return d;
  }
  d3.xhr = d3_xhrType(d3_identity);
  function d3_xhrType(response) {
    return function(url, mimeType, callback) {
      if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
      mimeType = null;
      return d3_xhr(url, mimeType, response, callback);
    };
  }
  function d3_xhr(url, mimeType, response, callback) {
    var xhr = {}, dispatch = d3.dispatch("beforesend", "progress", "load", "error"), headers = {}, request = new XMLHttpRequest(), responseType = null;
    if (d3_window.XDomainRequest && !("withCredentials" in request) && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var status = request.status, result;
      if (!status && request.responseText || status >= 200 && status < 300 || status === 304) {
        try {
          result = response.call(xhr, request);
        } catch (e) {
          dispatch.error.call(xhr, e);
          return;
        }
        dispatch.load.call(xhr, result);
      } else {
        dispatch.error.call(xhr, request);
      }
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.responseType = function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (responseType != null) request.responseType = responseType;
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      dispatch.beforesend.call(xhr, request);
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  }
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  d3.dsv = function(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);
      xhr.row = function(_) {
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;
      };
      return xhr;
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    function typedResponse(f) {
      return function(request) {
        return dsv.parse(request.responseText, f);
      };
    }
    dsv.parse = function(text, f) {
      var o;
      return dsv.parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) {
          return f(a(row), i);
        } : a;
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.substring(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.substring(j, I - k);
        }
        return text.substring(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && !(a = f(a, n++))) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);
      var fieldSet = new d3_Set(), fields = [];
      rows.forEach(function(row) {
        for (var field in row) {
          if (!fieldSet.has(field)) {
            fields.push(fieldSet.add(field));
          }
        }
      });
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    };
    dsv.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  };
  d3.csv = d3.dsv(",", "text/csv");
  d3.tsv = d3.dsv("	", "text/tab-separated-values");
  d3.touch = function(container, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
    if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return d3_mousePoint(container, touch);
      }
    }
  };
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_active, d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) {
    setTimeout(callback, 17);
  };
  d3.timer = function(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();
    var time = then + delay, timer = {
      c: callback,
      t: time,
      f: false,
      n: null
    };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  };
  function d3_timer_step() {
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
  };
  function d3_timer_mark() {
    var now = Date.now();
    d3_timer_active = d3_timer_queueHead;
    while (d3_timer_active) {
      if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
      d3_timer_active = d3_timer_active.n;
    }
    return now;
  }
  function d3_timer_sweep() {
    var t0, t1 = d3_timer_queueHead, time = Infinity;
    while (t1) {
      if (t1.f) {
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
      } else {
        if (t1.t < time) time = t1.t;
        t1 = (t0 = t1).n;
      }
    }
    d3_timer_queueTail = t0;
    return time;
  }
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "Âµ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  function d3_locale_numberFormat(locale) {
    var locale_decimal = locale.decimal, locale_thousands = locale.thousands, locale_grouping = locale.grouping, locale_currency = locale.currency, formatGroup = locale_grouping ? function(value) {
      var i = value.length, t = [], j = 0, g = locale_grouping[0];
      while (i > 0 && g > 0) {
        t.push(value.substring(i -= g, i + g));
        g = locale_grouping[j = (j + 1) % locale_grouping.length];
      }
      return t.reverse().join(locale_thousands);
    } : d3_identity;
    return function(specifier) {
      var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, prefix = "", suffix = "", integer = false;
      if (precision) precision = +precision.substring(1);
      if (zfill || fill === "0" && align === "=") {
        zfill = fill = "0";
        align = "=";
        if (comma) width -= Math.floor((width - 1) / 4);
      }
      switch (type) {
       case "n":
        comma = true;
        type = "g";
        break;

       case "%":
        scale = 100;
        suffix = "%";
        type = "f";
        break;

       case "p":
        scale = 100;
        suffix = "%";
        type = "r";
        break;

       case "b":
       case "o":
       case "x":
       case "X":
        if (symbol === "#") prefix = "0" + type.toLowerCase();

       case "c":
       case "d":
        integer = true;
        precision = 0;
        break;

       case "s":
        scale = -1;
        type = "r";
        break;
      }
      if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];
      if (type == "r" && !precision) type = "g";
      if (precision != null) {
        if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
      }
      type = d3_format_types.get(type) || d3_format_typeDefault;
      var zcomma = zfill && comma;
      return function(value) {
        var fullSuffix = suffix;
        if (integer && value % 1) return "";
        var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign;
        if (scale < 0) {
          var unit = d3.formatPrefix(value, precision);
          value = unit.scale(value);
          fullSuffix = unit.symbol + suffix;
        } else {
          value *= scale;
        }
        value = type(value, precision);
        var i = value.lastIndexOf("."), before = i < 0 ? value : value.substring(0, i), after = i < 0 ? "" : locale_decimal + value.substring(i + 1);
        if (!zfill && comma) before = formatGroup(before);
        var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
        if (zcomma) before = formatGroup(padding + before);
        negative += prefix;
        value = before + after;
        return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + fullSuffix;
      };
    };
  }
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_time = d3.time = {}, d3_date = Date;
  function d3_date_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_date_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_date(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_date(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_date = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_date = Date;
      }
    };
  }
  d3_time.year = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3_time.years = d3_time.year.range;
  d3_time.years.utc = d3_time.year.utc.range;
  d3_time.day = d3_time_interval(function(date) {
    var day = new d3_date(2e3, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3_time.days = d3_time.day.range;
  d3_time.days.utc = d3_time.day.utc.range;
  d3_time.dayOfYear = function(date) {
    var year = d3_time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ].forEach(function(day, i) {
    i = 7 - i;
    var interval = d3_time[day] = d3_time_interval(function(date) {
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3_time[day + "s"] = interval.range;
    d3_time[day + "s"].utc = interval.utc.range;
    d3_time[day + "OfYear"] = function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3_time.week = d3_time.sunday;
  d3_time.weeks = d3_time.sunday.range;
  d3_time.weeks.utc = d3_time.sunday.utc.range;
  d3_time.weekOfYear = d3_time.sundayOfYear;
  function d3_locale_timeFormat(locale) {
    var locale_dateTime = locale.dateTime, locale_date = locale.date, locale_time = locale.time, locale_periods = locale.periods, locale_days = locale.days, locale_shortDays = locale.shortDays, locale_months = locale.months, locale_shortMonths = locale.shortMonths;
    function d3_time_format(template) {
      var n = template.length;
      function format(date) {
        var string = [], i = -1, j = 0, c, p, f;
        while (++i < n) {
          if (template.charCodeAt(i) === 37) {
            string.push(template.substring(j, i));
            if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
            if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(template.substring(j, i));
        return string.join("");
      }
      format.parse = function(string) {
        var d = {
          y: 1900,
          m: 0,
          d: 1,
          H: 0,
          M: 0,
          S: 0,
          L: 0,
          Z: null
        }, i = d3_time_parse(d, template, string, 0);
        if (i != string.length) return null;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();
        if ("j" in d) date.setFullYear(d.y, 0, d.j); else if ("w" in d && ("W" in d || "U" in d)) {
          date.setFullYear(d.y, 0, 1);
          date.setFullYear(d.y, 0, "W" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);
        } else date.setFullYear(d.y, d.m, d.d);
        date.setHours(d.H + Math.floor(d.Z / 100), d.M + d.Z % 100, d.S, d.L);
        return localZ ? date._ : date;
      };
      format.toString = function() {
        return template;
      };
      return format;
    }
    function d3_time_parse(date, template, string, j) {
      var c, p, t, i = 0, n = template.length, m = string.length;
      while (i < n) {
        if (j >= m) return -1;
        c = template.charCodeAt(i++);
        if (c === 37) {
          t = template.charAt(i++);
          p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
          if (!p || (j = p(date, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    d3_time_format.utc = function(template) {
      var local = d3_time_format(template);
      function format(date) {
        try {
          d3_date = d3_date_utc;
          var utc = new d3_date();
          utc._ = date;
          return local(utc);
        } finally {
          d3_date = Date;
        }
      }
      format.parse = function(string) {
        try {
          d3_date = d3_date_utc;
          var date = local.parse(string);
          return date && date._;
        } finally {
          d3_date = Date;
        }
      };
      format.toString = local.toString;
      return format;
    };
    d3_time_format.multi = d3_time_format.utc.multi = d3_time_formatMulti;
    var d3_time_periodLookup = d3.map(), d3_time_dayRe = d3_time_formatRe(locale_days), d3_time_dayLookup = d3_time_formatLookup(locale_days), d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays), d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays), d3_time_monthRe = d3_time_formatRe(locale_months), d3_time_monthLookup = d3_time_formatLookup(locale_months), d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths), d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);
    locale_periods.forEach(function(p, i) {
      d3_time_periodLookup.set(p.toLowerCase(), i);
    });
    var d3_time_formats = {
      a: function(d) {
        return locale_shortDays[d.getDay()];
      },
      A: function(d) {
        return locale_days[d.getDay()];
      },
      b: function(d) {
        return locale_shortMonths[d.getMonth()];
      },
      B: function(d) {
        return locale_months[d.getMonth()];
      },
      c: d3_time_format(locale_dateTime),
      d: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      e: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      H: function(d, p) {
        return d3_time_formatPad(d.getHours(), p, 2);
      },
      I: function(d, p) {
        return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
      },
      j: function(d, p) {
        return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);
      },
      L: function(d, p) {
        return d3_time_formatPad(d.getMilliseconds(), p, 3);
      },
      m: function(d, p) {
        return d3_time_formatPad(d.getMonth() + 1, p, 2);
      },
      M: function(d, p) {
        return d3_time_formatPad(d.getMinutes(), p, 2);
      },
      p: function(d) {
        return locale_periods[+(d.getHours() >= 12)];
      },
      S: function(d, p) {
        return d3_time_formatPad(d.getSeconds(), p, 2);
      },
      U: function(d, p) {
        return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);
      },
      w: function(d) {
        return d.getDay();
      },
      W: function(d, p) {
        return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);
      },
      x: d3_time_format(locale_date),
      X: d3_time_format(locale_time),
      y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 100, p, 2);
      },
      Y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
      },
      Z: d3_time_zone,
      "%": function() {
        return "%";
      }
    };
    var d3_time_parsers = {
      a: d3_time_parseWeekdayAbbrev,
      A: d3_time_parseWeekday,
      b: d3_time_parseMonthAbbrev,
      B: d3_time_parseMonth,
      c: d3_time_parseLocaleFull,
      d: d3_time_parseDay,
      e: d3_time_parseDay,
      H: d3_time_parseHour24,
      I: d3_time_parseHour24,
      j: d3_time_parseDayOfYear,
      L: d3_time_parseMilliseconds,
      m: d3_time_parseMonthNumber,
      M: d3_time_parseMinutes,
      p: d3_time_parseAmPm,
      S: d3_time_parseSeconds,
      U: d3_time_parseWeekNumberSunday,
      w: d3_time_parseWeekdayNumber,
      W: d3_time_parseWeekNumberMonday,
      x: d3_time_parseLocaleDate,
      X: d3_time_parseLocaleTime,
      y: d3_time_parseYear,
      Y: d3_time_parseFullYear,
      Z: d3_time_parseZone,
      "%": d3_time_parseLiteralPercent
    };
    function d3_time_parseWeekdayAbbrev(date, string, i) {
      d3_time_dayAbbrevRe.lastIndex = 0;
      var n = d3_time_dayAbbrevRe.exec(string.substring(i));
      return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseWeekday(date, string, i) {
      d3_time_dayRe.lastIndex = 0;
      var n = d3_time_dayRe.exec(string.substring(i));
      return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonthAbbrev(date, string, i) {
      d3_time_monthAbbrevRe.lastIndex = 0;
      var n = d3_time_monthAbbrevRe.exec(string.substring(i));
      return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonth(date, string, i) {
      d3_time_monthRe.lastIndex = 0;
      var n = d3_time_monthRe.exec(string.substring(i));
      return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseLocaleFull(date, string, i) {
      return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
    }
    function d3_time_parseLocaleDate(date, string, i) {
      return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
    }
    function d3_time_parseLocaleTime(date, string, i) {
      return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
    }
    function d3_time_parseAmPm(date, string, i) {
      var n = d3_time_periodLookup.get(string.substring(i, i += 2).toLowerCase());
      return n == null ? -1 : (date.p = n, i);
    }
    return d3_time_format;
  }
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  }, d3_time_numberRe = /^\s*\d+/, d3_time_percentRe = /^%/;
  function d3_time_formatPad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_parseWeekdayNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 1));
    return n ? (date.w = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberSunday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i));
    return n ? (date.U = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberMonday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i));
    return n ? (date.W = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 4));
    return n ? (date.y = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
  }
  function d3_time_parseZone(date, string, i) {
    return /^[+-]\d{4}$/.test(string = string.substring(i, i + 5)) ? (date.Z = -string, 
    i + 5) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.d = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseDayOfYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 3));
    return n ? (date.j = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.H = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.M = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.S = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 3));
    return n ? (date.L = +n[0], i + n[0].length) : -1;
  }
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = ~~(abs(z) / 60), zm = abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  function d3_time_parseLiteralPercent(date, string, i) {
    d3_time_percentRe.lastIndex = 0;
    var n = d3_time_percentRe.exec(string.substring(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function d3_time_formatMulti(formats) {
    var n = formats.length, i = -1;
    while (++i < n) formats[i][0] = this(formats[i][0]);
    return function(date) {
      var i = 0, f = formats[i];
      while (!f[1](date)) f = formats[++i];
      return f[0](date);
    };
  }
  d3.locale = function(locale) {
    return {
      numberFormat: d3_locale_numberFormat(locale),
      timeFormat: d3_locale_timeFormat(locale)
    };
  };
  var d3_locale_enUS = d3.locale({
    decimal: ".",
    thousands: ",",
    grouping: [ 3 ],
    currency: [ "$", "" ],
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: [ "AM", "PM" ],
    days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    shortDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    shortMonths: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
  });
  d3.format = d3_locale_enUS.numberFormat;
  d3.geo = {};
  function d3_adder() {}
  d3_adder.prototype = {
    s: 0,
    t: 0,
    add: function(y) {
      d3_adderSum(y, this.t, d3_adderTemp);
      d3_adderSum(d3_adderTemp.s, this.s, this);
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
    },
    reset: function() {
      this.s = this.t = 0;
    },
    valueOf: function() {
      return this.s;
    }
  };
  var d3_adderTemp = new d3_adder();
  function d3_adderSum(a, b, o) {
    var x = o.s = a + b, bv = x - a, av = x - bv;
    o.t = a - av + (b - bv);
  }
  d3.geo.stream = function(object, listener) {
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      object = object.coordinates;
      listener.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * Ï€;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingSum.reset();
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * d3_geo_areaRingSum;
      d3_geo_areaSum += area < 0 ? 4 * Ï€ + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var Î»00, Ï†00, Î»0, cosÏ†0, sinÏ†0;
    d3_geo_area.point = function(Î», Ï†) {
      d3_geo_area.point = nextPoint;
      Î»0 = (Î»00 = Î») * d3_radians, cosÏ†0 = Math.cos(Ï† = (Ï†00 = Ï†) * d3_radians / 2 + Ï€ / 4), 
      sinÏ†0 = Math.sin(Ï†);
    };
    function nextPoint(Î», Ï†) {
      Î» *= d3_radians;
      Ï† = Ï† * d3_radians / 2 + Ï€ / 4;
      var dÎ» = Î» - Î»0, sdÎ» = dÎ» >= 0 ? 1 : -1, adÎ» = sdÎ» * dÎ», cosÏ† = Math.cos(Ï†), sinÏ† = Math.sin(Ï†), k = sinÏ†0 * sinÏ†, u = cosÏ†0 * cosÏ† + k * Math.cos(adÎ»), v = k * sdÎ» * Math.sin(adÎ»);
      d3_geo_areaRingSum.add(Math.atan2(v, u));
      Î»0 = Î», cosÏ†0 = cosÏ†, sinÏ†0 = sinÏ†;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(Î»00, Ï†00);
    };
  }
  function d3_geo_cartesian(spherical) {
    var Î» = spherical[0], Ï† = spherical[1], cosÏ† = Math.cos(Ï†);
    return [ cosÏ† * Math.cos(Î»), cosÏ† * Math.sin(Î»), Math.sin(Ï†) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return abs(a[0] - b[0]) < Îµ && abs(a[1] - b[1]) < Îµ;
  }
  d3.geo.bounds = function() {
    var Î»0, Ï†0, Î»1, Ï†1, Î»_, Î»__, Ï†__, p0, dÎ»Sum, ranges, range;
    var bound = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        bound.point = ringPoint;
        bound.lineStart = ringStart;
        bound.lineEnd = ringEnd;
        dÎ»Sum = 0;
        d3_geo_area.polygonStart();
      },
      polygonEnd: function() {
        d3_geo_area.polygonEnd();
        bound.point = point;
        bound.lineStart = lineStart;
        bound.lineEnd = lineEnd;
        if (d3_geo_areaRingSum < 0) Î»0 = -(Î»1 = 180), Ï†0 = -(Ï†1 = 90); else if (dÎ»Sum > Îµ) Ï†1 = 90; else if (dÎ»Sum < -Îµ) Ï†0 = -90;
        range[0] = Î»0, range[1] = Î»1;
      }
    };
    function point(Î», Ï†) {
      ranges.push(range = [ Î»0 = Î», Î»1 = Î» ]);
      if (Ï† < Ï†0) Ï†0 = Ï†;
      if (Ï† > Ï†1) Ï†1 = Ï†;
    }
    function linePoint(Î», Ï†) {
      var p = d3_geo_cartesian([ Î» * d3_radians, Ï† * d3_radians ]);
      if (p0) {
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
        d3_geo_cartesianNormalize(inflection);
        inflection = d3_geo_spherical(inflection);
        var dÎ» = Î» - Î»_, s = dÎ» > 0 ? 1 : -1, Î»i = inflection[0] * d3_degrees * s, antimeridian = abs(dÎ») > 180;
        if (antimeridian ^ (s * Î»_ < Î»i && Î»i < s * Î»)) {
          var Ï†i = inflection[1] * d3_degrees;
          if (Ï†i > Ï†1) Ï†1 = Ï†i;
        } else if (Î»i = (Î»i + 360) % 360 - 180, antimeridian ^ (s * Î»_ < Î»i && Î»i < s * Î»)) {
          var Ï†i = -inflection[1] * d3_degrees;
          if (Ï†i < Ï†0) Ï†0 = Ï†i;
        } else {
          if (Ï† < Ï†0) Ï†0 = Ï†;
          if (Ï† > Ï†1) Ï†1 = Ï†;
        }
        if (antimeridian) {
          if (Î» < Î»_) {
            if (angle(Î»0, Î») > angle(Î»0, Î»1)) Î»1 = Î»;
          } else {
            if (angle(Î», Î»1) > angle(Î»0, Î»1)) Î»0 = Î»;
          }
        } else {
          if (Î»1 >= Î»0) {
            if (Î» < Î»0) Î»0 = Î»;
            if (Î» > Î»1) Î»1 = Î»;
          } else {
            if (Î» > Î»_) {
              if (angle(Î»0, Î») > angle(Î»0, Î»1)) Î»1 = Î»;
            } else {
              if (angle(Î», Î»1) > angle(Î»0, Î»1)) Î»0 = Î»;
            }
          }
        }
      } else {
        point(Î», Ï†);
      }
      p0 = p, Î»_ = Î»;
    }
    function lineStart() {
      bound.point = linePoint;
    }
    function lineEnd() {
      range[0] = Î»0, range[1] = Î»1;
      bound.point = point;
      p0 = null;
    }
    function ringPoint(Î», Ï†) {
      if (p0) {
        var dÎ» = Î» - Î»_;
        dÎ»Sum += abs(dÎ») > 180 ? dÎ» + (dÎ» > 0 ? 360 : -360) : dÎ»;
      } else Î»__ = Î», Ï†__ = Ï†;
      d3_geo_area.point(Î», Ï†);
      linePoint(Î», Ï†);
    }
    function ringStart() {
      d3_geo_area.lineStart();
    }
    function ringEnd() {
      ringPoint(Î»__, Ï†__);
      d3_geo_area.lineEnd();
      if (abs(dÎ»Sum) > Îµ) Î»0 = -(Î»1 = 180);
      range[0] = Î»0, range[1] = Î»1;
      p0 = null;
    }
    function angle(Î»0, Î»1) {
      return (Î»1 -= Î»0) < 0 ? Î»1 + 360 : Î»1;
    }
    function compareRanges(a, b) {
      return a[0] - b[0];
    }
    function withinRange(x, range) {
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
    }
    return function(feature) {
      Ï†1 = Î»1 = -(Î»0 = Ï†0 = Infinity);
      ranges = [];
      d3.geo.stream(feature, bound);
      var n = ranges.length;
      if (n) {
        ranges.sort(compareRanges);
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
          b = ranges[i];
          if (withinRange(b[0], a) || withinRange(b[1], a)) {
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
          } else {
            merged.push(a = b);
          }
        }
        var best = -Infinity, dÎ»;
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
          b = merged[i];
          if ((dÎ» = angle(a[1], b[0])) > best) best = dÎ», Î»0 = b[0], Î»1 = a[1];
        }
      }
      ranges = range = null;
      return Î»0 === Infinity || Ï†0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ Î»0, Ï†0 ], [ Î»1, Ï†1 ] ];
    };
  }();
  d3.geo.centroid = function(object) {
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
    if (m < Îµ2) {
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
      if (d3_geo_centroidW1 < Îµ) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
      m = x * x + y * y + z * z;
      if (m < Îµ2) return [ NaN, NaN ];
    }
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
  };
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
  var d3_geo_centroid = {
    sphere: d3_noop,
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(Î», Ï†) {
    Î» *= d3_radians;
    var cosÏ† = Math.cos(Ï† *= d3_radians);
    d3_geo_centroidPointXYZ(cosÏ† * Math.cos(Î»), cosÏ† * Math.sin(Î»), Math.sin(Ï†));
  }
  function d3_geo_centroidPointXYZ(x, y, z) {
    ++d3_geo_centroidW0;
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    d3_geo_centroid.point = function(Î», Ï†) {
      Î» *= d3_radians;
      var cosÏ† = Math.cos(Ï† *= d3_radians);
      x0 = cosÏ† * Math.cos(Î»);
      y0 = cosÏ† * Math.sin(Î»);
      z0 = Math.sin(Ï†);
      d3_geo_centroid.point = nextPoint;
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    function nextPoint(Î», Ï†) {
      Î» *= d3_radians;
      var cosÏ† = Math.cos(Ï† *= d3_radians), x = cosÏ† * Math.cos(Î»), y = cosÏ† * Math.sin(Î»), z = Math.sin(Ï†), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  function d3_geo_centroidRingStart() {
    var Î»00, Ï†00, x0, y0, z0;
    d3_geo_centroid.point = function(Î», Ï†) {
      Î»00 = Î», Ï†00 = Ï†;
      d3_geo_centroid.point = nextPoint;
      Î» *= d3_radians;
      var cosÏ† = Math.cos(Ï† *= d3_radians);
      x0 = cosÏ† * Math.cos(Î»);
      y0 = cosÏ† * Math.sin(Î»);
      z0 = Math.sin(Ï†);
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    d3_geo_centroid.lineEnd = function() {
      nextPoint(Î»00, Ï†00);
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
      d3_geo_centroid.point = d3_geo_centroidPoint;
    };
    function nextPoint(Î», Ï†) {
      Î» *= d3_radians;
      var cosÏ† = Math.cos(Ï† *= d3_radians), x = cosÏ† * Math.cos(Î»), y = cosÏ† * Math.sin(Î»), z = Math.sin(Ï†), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
      d3_geo_centroidX2 += v * cx;
      d3_geo_centroidY2 += v * cy;
      d3_geo_centroidZ2 += v * cz;
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_true() {
    return true;
  }
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
      a.o = b;
      subject.push(a);
      clip.push(b);
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
      a.o = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(compare);
    d3_geo_clipPolygonLinkCircular(subject);
    d3_geo_clipPolygonLinkCircular(clip);
    if (!subject.length) return;
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
      clip[i].e = entry = !entry;
    }
    var start = subject[0], points, point;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      listener.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, listener);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, listener);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      listener.lineEnd();
    }
  }
  function d3_geo_clipPolygonLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
    return function(rotate, listener) {
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
          if (segments.length) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
          } else if (clipStartInside) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          if (polygonStarted) listener.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(Î», Ï†) {
        var point = rotate(Î», Ï†);
        if (pointVisible(Î» = point[0], Ï† = point[1])) listener.point(Î», Ï†);
      }
      function pointLine(Î», Ï†) {
        var point = rotate(Î», Ï†);
        line.point(point[0], point[1]);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygonStarted = false, polygon, ring;
      function pointRing(Î», Ï†) {
        ring.push([ Î», Ï† ]);
        var point = rotate(Î», Ï†);
        ringListener.point(point[0], point[1]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          var n = segment.length - 1, i = -1, point;
          if (n > 0) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            while (++i < n) listener.point((point = segment[i])[0], point[1]);
            listener.lineEnd();
          }
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(Î», Ï†) {
        line.push([ Î», Ï† ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      },
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      }
    };
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfÏ€ - Îµ : halfÏ€ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfÏ€ - Îµ : halfÏ€ - b[1]);
  }
  function d3_geo_pointInPolygon(point, polygon) {
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
    d3_geo_areaRingSum.reset();
    for (var i = 0, n = polygon.length; i < n; ++i) {
      var ring = polygon[i], m = ring.length;
      if (!m) continue;
      var point0 = ring[0], Î»0 = point0[0], Ï†0 = point0[1] / 2 + Ï€ / 4, sinÏ†0 = Math.sin(Ï†0), cosÏ†0 = Math.cos(Ï†0), j = 1;
      while (true) {
        if (j === m) j = 0;
        point = ring[j];
        var Î» = point[0], Ï† = point[1] / 2 + Ï€ / 4, sinÏ† = Math.sin(Ï†), cosÏ† = Math.cos(Ï†), dÎ» = Î» - Î»0, sdÎ» = dÎ» >= 0 ? 1 : -1, adÎ» = sdÎ» * dÎ», antimeridian = adÎ» > Ï€, k = sinÏ†0 * sinÏ†;
        d3_geo_areaRingSum.add(Math.atan2(k * sdÎ» * Math.sin(adÎ»), cosÏ†0 * cosÏ† + k * Math.cos(adÎ»)));
        polarAngle += antimeridian ? dÎ» + sdÎ» * Ï„ : dÎ»;
        if (antimeridian ^ Î»0 >= meridian ^ Î» >= meridian) {
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
          d3_geo_cartesianNormalize(arc);
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);
          d3_geo_cartesianNormalize(intersection);
          var Ï†arc = (antimeridian ^ dÎ» >= 0 ? -1 : 1) * d3_asin(intersection[2]);
          if (parallel > Ï†arc || parallel === Ï†arc && (arc[0] || arc[1])) {
            winding += antimeridian ^ dÎ» >= 0 ? 1 : -1;
          }
        }
        if (!j++) break;
        Î»0 = Î», sinÏ†0 = sinÏ†, cosÏ†0 = cosÏ†, point0 = point;
      }
    }
    return (polarAngle < -Îµ || polarAngle < Îµ && d3_geo_areaRingSum < 0) ^ winding & 1;
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -Ï€, -Ï€ / 2 ]);
  function d3_geo_clipAntimeridianLine(listener) {
    var Î»0 = NaN, Ï†0 = NaN, sÎ»0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(Î»1, Ï†1) {
        var sÎ»1 = Î»1 > 0 ? Ï€ : -Ï€, dÎ» = abs(Î»1 - Î»0);
        if (abs(dÎ» - Ï€) < Îµ) {
          listener.point(Î»0, Ï†0 = (Ï†0 + Ï†1) / 2 > 0 ? halfÏ€ : -halfÏ€);
          listener.point(sÎ»0, Ï†0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sÎ»1, Ï†0);
          listener.point(Î»1, Ï†0);
          clean = 0;
        } else if (sÎ»0 !== sÎ»1 && dÎ» >= Ï€) {
          if (abs(Î»0 - sÎ»0) < Îµ) Î»0 -= sÎ»0 * Îµ;
          if (abs(Î»1 - sÎ»1) < Îµ) Î»1 -= sÎ»1 * Îµ;
          Ï†0 = d3_geo_clipAntimeridianIntersect(Î»0, Ï†0, Î»1, Ï†1);
          listener.point(sÎ»0, Ï†0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sÎ»1, Ï†0);
          clean = 0;
        }
        listener.point(Î»0 = Î»1, Ï†0 = Ï†1);
        sÎ»0 = sÎ»1;
      },
      lineEnd: function() {
        listener.lineEnd();
        Î»0 = Ï†0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(Î»0, Ï†0, Î»1, Ï†1) {
    var cosÏ†0, cosÏ†1, sinÎ»0_Î»1 = Math.sin(Î»0 - Î»1);
    return abs(sinÎ»0_Î»1) > Îµ ? Math.atan((Math.sin(Ï†0) * (cosÏ†1 = Math.cos(Ï†1)) * Math.sin(Î»1) - Math.sin(Ï†1) * (cosÏ†0 = Math.cos(Ï†0)) * Math.sin(Î»0)) / (cosÏ†0 * cosÏ†1 * sinÎ»0_Î»1)) : (Ï†0 + Ï†1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var Ï†;
    if (from == null) {
      Ï† = direction * halfÏ€;
      listener.point(-Ï€, Ï†);
      listener.point(0, Ï†);
      listener.point(Ï€, Ï†);
      listener.point(Ï€, 0);
      listener.point(Ï€, -Ï†);
      listener.point(0, -Ï†);
      listener.point(-Ï€, -Ï†);
      listener.point(-Ï€, 0);
      listener.point(-Ï€, Ï†);
    } else if (abs(from[0] - to[0]) > Îµ) {
      var s = from[0] < to[0] ? Ï€ : -Ï€;
      Ï† = direction * s / 2;
      listener.point(-s, Ï†);
      listener.point(0, Ï†);
      listener.point(s, Ï†);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_clipCircle(radius) {
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > Îµ, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -Ï€, radius - Ï€ ]);
    function visible(Î», Ï†) {
      return Math.cos(Î») * Math.cos(Ï†) > cr;
    }
    function clipLine(listener) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(Î», Ï†) {
          var point1 = [ Î», Ï† ], point2, v = visible(Î», Ï†), c = smallRadius ? v ? 0 : code(Î», Ï†) : v ? code(Î» + (Î» < 0 ? Ï€ : -Ï€), Ï†) : 0;
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += Îµ;
              point1[1] += Îµ;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
              } else {
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
            listener.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      q = d3_geo_spherical(q);
      if (!two) return q;
      var Î»0 = a[0], Î»1 = b[0], Ï†0 = a[1], Ï†1 = b[1], z;
      if (Î»1 < Î»0) z = Î»0, Î»0 = Î»1, Î»1 = z;
      var Î´Î» = Î»1 - Î»0, polar = abs(Î´Î» - Ï€) < Îµ, meridian = polar || Î´Î» < Îµ;
      if (!polar && Ï†1 < Ï†0) z = Ï†0, Ï†0 = Ï†1, Ï†1 = z;
      if (meridian ? polar ? Ï†0 + Ï†1 > 0 ^ q[1] < (abs(q[0] - Î»0) < Îµ ? Ï†0 : Ï†1) : Ï†0 <= q[1] && q[1] <= Ï†1 : Î´Î» > Ï€ ^ (Î»0 <= q[0] && q[0] <= Î»1)) {
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
        d3_geo_cartesianAdd(q1, A);
        return [ q, d3_geo_spherical(q1) ];
      }
    }
    function code(Î», Ï†) {
      var r = smallRadius ? radius : Ï€ - radius, code = 0;
      if (Î» < -r) code |= 1; else if (Î» > r) code |= 2;
      if (Ï† < -r) code |= 4; else if (Ï† > r) code |= 8;
      return code;
    }
  }
  function d3_geom_clipLine(x0, y0, x1, y1) {
    return function(line) {
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      if (t0 > 0) line.a = {
        x: ax + t0 * dx,
        y: ay + t0 * dy
      };
      if (t1 < 1) line.b = {
        x: ax + t1 * dx,
        y: ay + t1 * dy
      };
      return line;
    };
  }
  var d3_geo_clipExtentMAX = 1e9;
  d3.geo.clipExtent = function() {
    var x0, y0, x1, y1, stream, clip, clipExtent = {
      stream: function(output) {
        if (stream) stream.valid = false;
        stream = clip(output);
        stream.valid = true;
        return stream;
      },
      extent: function(_) {
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
        if (stream) stream.valid = false, stream = null;
        return clipExtent;
      }
    };
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
  };
  function d3_geo_clipExtent(x0, y0, x1, y1) {
    return function(listener) {
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          listener = bufferListener;
          segments = [];
          polygon = [];
          clean = true;
        },
        polygonEnd: function() {
          listener = listener_;
          segments = d3.merge(segments);
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
          if (inside || visible) {
            listener.polygonStart();
            if (inside) {
              listener.lineStart();
              interpolate(null, null, 1, listener);
              listener.lineEnd();
            }
            if (visible) {
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
            }
            listener.polygonEnd();
          }
          segments = polygon = ring = null;
        }
      };
      function insidePolygon(p) {
        var wn = 0, n = polygon.length, y = p[1];
        for (var i = 0; i < n; ++i) {
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
            b = v[j];
            if (a[1] <= y) {
              if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
            } else {
              if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
            }
            a = b;
          }
        }
        return wn !== 0;
      }
      function interpolate(from, to, direction, listener) {
        var a = 0, a1 = 0;
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
          do {
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          } while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          listener.point(to[0], to[1]);
        }
      }
      function pointVisible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }
      function point(x, y) {
        if (pointVisible(x, y)) listener.point(x, y);
      }
      var x__, y__, v__, x_, y_, v_, first, clean;
      function lineStart() {
        clip.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferListener.rejoin();
          segments.push(bufferListener.buffer());
        }
        clip.point = point;
        if (v_) listener.lineEnd();
      }
      function linePoint(x, y) {
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
        var v = pointVisible(x, y);
        if (polygon) ring.push([ x, y ]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        } else {
          if (v && v_) listener.point(x, y); else {
            var l = {
              a: {
                x: x_,
                y: y_
              },
              b: {
                x: x,
                y: y
              }
            };
            if (clipLine(l)) {
              if (!v_) {
                listener.lineStart();
                listener.point(l.a.x, l.a.y);
              }
              listener.point(l.b.x, l.b.y);
              if (!v) listener.lineEnd();
              clean = false;
            } else if (v) {
              listener.lineStart();
              listener.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clip;
    };
    function corner(p, direction) {
      return abs(p[0] - x0) < Îµ ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < Îµ ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < Îµ ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compare(a, b) {
      return comparePoints(a.x, b.x);
    }
    function comparePoints(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_geo_conic(projectAt) {
    var Ï†0 = 0, Ï†1 = Ï€ / 3, m = d3_geo_projectionMutator(projectAt), p = m(Ï†0, Ï†1);
    p.parallels = function(_) {
      if (!arguments.length) return [ Ï†0 / Ï€ * 180, Ï†1 / Ï€ * 180 ];
      return m(Ï†0 = _[0] * Ï€ / 180, Ï†1 = _[1] * Ï€ / 180);
    };
    return p;
  }
  function d3_geo_conicEqualArea(Ï†0, Ï†1) {
    var sinÏ†0 = Math.sin(Ï†0), n = (sinÏ†0 + Math.sin(Ï†1)) / 2, C = 1 + sinÏ†0 * (2 * n - sinÏ†0), Ï0 = Math.sqrt(C) / n;
    function forward(Î», Ï†) {
      var Ï = Math.sqrt(C - 2 * n * Math.sin(Ï†)) / n;
      return [ Ï * Math.sin(Î» *= n), Ï0 - Ï * Math.cos(Î») ];
    }
    forward.invert = function(x, y) {
      var Ï0_y = Ï0 - y;
      return [ Math.atan2(x, Ï0_y) / n, d3_asin((C - (x * x + Ï0_y * Ï0_y) * n * n) / (2 * n)) ];
    };
    return forward;
  }
  (d3.geo.conicEqualArea = function() {
    return d3_geo_conic(d3_geo_conicEqualArea);
  }).raw = d3_geo_conicEqualArea;
  d3.geo.albers = function() {
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
  };
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
    var point, pointStream = {
      point: function(x, y) {
        point = [ x, y ];
      }
    }, lower48Point, alaskaPoint, hawaiiPoint;
    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      point = null;
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
      return point;
    }
    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function(stream) {
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
      return {
        point: function(x, y) {
          lower48Stream.point(x, y);
          alaskaStream.point(x, y);
          hawaiiStream.point(x, y);
        },
        sphere: function() {
          lower48Stream.sphere();
          alaskaStream.sphere();
          hawaiiStream.sphere();
        },
        lineStart: function() {
          lower48Stream.lineStart();
          alaskaStream.lineStart();
          hawaiiStream.lineStart();
        },
        lineEnd: function() {
          lower48Stream.lineEnd();
          alaskaStream.lineEnd();
          hawaiiStream.lineEnd();
        },
        polygonStart: function() {
          lower48Stream.polygonStart();
          alaskaStream.polygonStart();
          hawaiiStream.polygonStart();
        },
        polygonEnd: function() {
          lower48Stream.polygonEnd();
          alaskaStream.polygonEnd();
          hawaiiStream.polygonEnd();
        }
      };
    };
    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_);
      alaska.precision(_);
      hawaii.precision(_);
      return albersUsa;
    };
    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_);
      alaska.scale(_ * .35);
      hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + Îµ, y + .12 * k + Îµ ], [ x - .214 * k - Îµ, y + .234 * k - Îµ ] ]).stream(pointStream).point;
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + Îµ, y + .166 * k + Îµ ], [ x - .115 * k - Îµ, y + .234 * k - Îµ ] ]).stream(pointStream).point;
      return albersUsa;
    };
    return albersUsa.scale(1070);
  };
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
  var d3_geo_pathBounds = {
    point: d3_geo_pathBoundsPoint,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_pathBoundsPoint(x, y) {
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathBufferCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathBufferCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    d3_geo_centroidX0 += x;
    d3_geo_centroidY0 += y;
    ++d3_geo_centroidZ0;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      z = y0 * x - x0 * y;
      d3_geo_centroidX2 += z * (x0 + x);
      d3_geo_centroidY2 += z * (y0 + y);
      d3_geo_centroidZ2 += z * 3;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x, y);
      context.arc(x, y, pointRadius, 0, Ï„);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  function d3_geo_resample(project) {
    var Î´2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
    function resample(stream) {
      return (maxDepth ? resampleRecursive : resampleNone)(stream);
    }
    function resampleNone(stream) {
      return d3_geo_transformPoint(stream, function(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      });
    }
    function resampleRecursive(stream) {
      var Î»00, Ï†00, x00, y00, a00, b00, c00, Î»0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(Î», Ï†) {
        var c = d3_geo_cartesian([ Î», Ï† ]), p = project(Î», Ï†);
        resampleLineTo(x0, y0, Î»0, a0, b0, c0, x0 = p[0], y0 = p[1], Î»0 = Î», a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resample.point = ringPoint;
        resample.lineEnd = ringEnd;
      }
      function ringPoint(Î», Ï†) {
        linePoint(Î»00 = Î», Ï†00 = Ï†), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resample.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, Î»0, a0, b0, c0, x00, y00, Î»00, a00, b00, c00, maxDepth, stream);
        resample.lineEnd = lineEnd;
        lineEnd();
      }
      return resample;
    }
    function resampleLineTo(x0, y0, Î»0, a0, b0, c0, x1, y1, Î»1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * Î´2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), Ï†2 = Math.asin(c /= m), Î»2 = abs(abs(c) - 1) < Îµ || abs(Î»0 - Î»1) < Îµ ? (Î»0 + Î»1) / 2 : Math.atan2(b, a), p = project(Î»2, Ï†2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > Î´2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x0, y0, Î»0, a0, b0, c0, x2, y2, Î»2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, Î»2, a, b, c, x1, y1, Î»1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(Î´2);
      maxDepth = (Î´2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
        d3.geo.stream(object, cacheStream);
      }
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
    };
    path.bounds = function(object) {
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return reset();
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return reset();
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    function reset() {
      cacheStream = null;
      return path;
    }
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(x, y) {
      return project([ x * d3_degrees, y * d3_degrees ]);
    });
    return function(stream) {
      return d3_geo_projectionRadians(resample(stream));
    };
  }
  d3.geo.transform = function(methods) {
    return {
      stream: function(stream) {
        var transform = new d3_geo_transform(stream);
        for (var k in methods) transform[k] = methods[k];
        return transform;
      }
    };
  };
  function d3_geo_transform(stream) {
    this.stream = stream;
  }
  d3_geo_transform.prototype = {
    point: function(x, y) {
      this.stream.point(x, y);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };
  function d3_geo_transformPoint(stream, point) {
    return {
      point: point,
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + Î´x, Î´y - x[1] * k ];
    }), k = 150, x = 480, y = 250, Î» = 0, Ï† = 0, Î´Î» = 0, Î´Ï† = 0, Î´Î³ = 0, Î´x, Î´y, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + Î´x, Î´y - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - Î´x) / k, (Î´y - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(output) {
      if (stream) stream.valid = false;
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
      stream.valid = true;
      return stream;
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
      return invalidate();
    };
    projection.clipExtent = function(_) {
      if (!arguments.length) return clipExtent;
      clipExtent = _;
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
      return invalidate();
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ Î» * d3_degrees, Ï† * d3_degrees ];
      Î» = _[0] % 360 * d3_radians;
      Ï† = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ Î´Î» * d3_degrees, Î´Ï† * d3_degrees, Î´Î³ * d3_degrees ];
      Î´Î» = _[0] % 360 * d3_radians;
      Î´Ï† = _[1] % 360 * d3_radians;
      Î´Î³ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(Î´Î», Î´Ï†, Î´Î³), project);
      var center = project(Î», Ï†);
      Î´x = x - center[0] * k;
      Î´y = y + center[1] * k;
      return invalidate();
    }
    function invalidate() {
      if (stream) stream.valid = false, stream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadians(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      stream.point(x * d3_radians, y * d3_radians);
    });
  }
  function d3_geo_equirectangular(Î», Ï†) {
    return [ Î», Ï† ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  d3.geo.rotation = function(rotate) {
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    }
    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    };
    return forward;
  };
  function d3_geo_identityRotation(Î», Ï†) {
    return [ Î» > Ï€ ? Î» - Ï„ : Î» < -Ï€ ? Î» + Ï„ : Î», Ï† ];
  }
  d3_geo_identityRotation.invert = d3_geo_equirectangular;
  function d3_geo_rotation(Î´Î», Î´Ï†, Î´Î³) {
    return Î´Î» ? Î´Ï† || Î´Î³ ? d3_geo_compose(d3_geo_rotationÎ»(Î´Î»), d3_geo_rotationÏ†Î³(Î´Ï†, Î´Î³)) : d3_geo_rotationÎ»(Î´Î») : Î´Ï† || Î´Î³ ? d3_geo_rotationÏ†Î³(Î´Ï†, Î´Î³) : d3_geo_identityRotation;
  }
  function d3_geo_forwardRotationÎ»(Î´Î») {
    return function(Î», Ï†) {
      return Î» += Î´Î», [ Î» > Ï€ ? Î» - Ï„ : Î» < -Ï€ ? Î» + Ï„ : Î», Ï† ];
    };
  }
  function d3_geo_rotationÎ»(Î´Î») {
    var rotation = d3_geo_forwardRotationÎ»(Î´Î»);
    rotation.invert = d3_geo_forwardRotationÎ»(-Î´Î»);
    return rotation;
  }
  function d3_geo_rotationÏ†Î³(Î´Ï†, Î´Î³) {
    var cosÎ´Ï† = Math.cos(Î´Ï†), sinÎ´Ï† = Math.sin(Î´Ï†), cosÎ´Î³ = Math.cos(Î´Î³), sinÎ´Î³ = Math.sin(Î´Î³);
    function rotation(Î», Ï†) {
      var cosÏ† = Math.cos(Ï†), x = Math.cos(Î») * cosÏ†, y = Math.sin(Î») * cosÏ†, z = Math.sin(Ï†), k = z * cosÎ´Ï† + x * sinÎ´Ï†;
      return [ Math.atan2(y * cosÎ´Î³ - k * sinÎ´Î³, x * cosÎ´Ï† - z * sinÎ´Ï†), d3_asin(k * cosÎ´Î³ + y * sinÎ´Î³) ];
    }
    rotation.invert = function(Î», Ï†) {
      var cosÏ† = Math.cos(Ï†), x = Math.cos(Î») * cosÏ†, y = Math.sin(Î») * cosÏ†, z = Math.sin(Ï†), k = z * cosÎ´Î³ - y * sinÎ´Î³;
      return [ Math.atan2(y * cosÎ´Î³ + z * sinÎ´Î³, x * cosÎ´Ï† + k * sinÎ´Ï†), d3_asin(k * cosÎ´Ï† - x * sinÎ´Ï†) ];
    };
    return rotation;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radius, precision) {
    var cr = Math.cos(radius), sr = Math.sin(radius);
    return function(from, to, direction, listener) {
      var step = direction * precision;
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * Ï„;
      } else {
        from = radius + direction * Ï„;
        to = radius - .5 * step;
      }
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = d3_acos(-a[1]);
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - Îµ) % (2 * Math.PI);
  }
  d3.geo.distance = function(a, b) {
    var Î”Î» = (b[0] - a[0]) * d3_radians, Ï†0 = a[1] * d3_radians, Ï†1 = b[1] * d3_radians, sinÎ”Î» = Math.sin(Î”Î»), cosÎ”Î» = Math.cos(Î”Î»), sinÏ†0 = Math.sin(Ï†0), cosÏ†0 = Math.cos(Ï†0), sinÏ†1 = Math.sin(Ï†1), cosÏ†1 = Math.cos(Ï†1), t;
    return Math.atan2(Math.sqrt((t = cosÏ†1 * sinÎ”Î») * t + (t = cosÏ†0 * sinÏ†1 - sinÏ†0 * cosÏ†1 * cosÎ”Î») * t), sinÏ†0 * sinÏ†1 + cosÏ†0 * cosÏ†1 * cosÎ”Î»);
  };
  d3.geo.graticule = function() {
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
        return abs(x % DX) > Îµ;
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
        return abs(y % DY) > Îµ;
      }).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return graticule.minorExtent();
      return graticule.majorExtent(_).minorExtent(_);
    };
    graticule.majorExtent = function(_) {
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.minorExtent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return graticule.minorStep();
      return graticule.majorStep(_).minorStep(_);
    };
    graticule.majorStep = function(_) {
      if (!arguments.length) return [ DX, DY ];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.minorStep = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, 90);
      y = d3_geo_graticuleY(x0, x1, precision);
      X = d3_geo_graticuleX(Y0, Y1, 90);
      Y = d3_geo_graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.majorExtent([ [ -180, -90 + Îµ ], [ 180, 90 - Îµ ] ]).minorExtent([ [ -180, -80 - Îµ ], [ 180, 80 + Îµ ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - Îµ, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - Îµ, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_source(d) {
    return d.source;
  }
  function d3_target(d) {
    return d.target;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_;
    function greatArc() {
      return {
        type: "LineString",
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]
      };
    }
    greatArc.distance = function() {
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.precision = function() {
      return arguments.length ? greatArc : 0;
    };
    return greatArc;
  };
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.length = function(object) {
    d3_geo_lengthSum = 0;
    d3.geo.stream(object, d3_geo_length);
    return d3_geo_lengthSum;
  };
  var d3_geo_lengthSum;
  var d3_geo_length = {
    sphere: d3_noop,
    point: d3_noop,
    lineStart: d3_geo_lengthLineStart,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_lengthLineStart() {
    var Î»0, sinÏ†0, cosÏ†0;
    d3_geo_length.point = function(Î», Ï†) {
      Î»0 = Î» * d3_radians, sinÏ†0 = Math.sin(Ï† *= d3_radians), cosÏ†0 = Math.cos(Ï†);
      d3_geo_length.point = nextPoint;
    };
    d3_geo_length.lineEnd = function() {
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;
    };
    function nextPoint(Î», Ï†) {
      var sinÏ† = Math.sin(Ï† *= d3_radians), cosÏ† = Math.cos(Ï†), t = abs((Î» *= d3_radians) - Î»0), cosÎ”Î» = Math.cos(t);
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosÏ† * Math.sin(t)) * t + (t = cosÏ†0 * sinÏ† - sinÏ†0 * cosÏ† * cosÎ”Î») * t), sinÏ†0 * sinÏ† + cosÏ†0 * cosÏ† * cosÎ”Î»);
      Î»0 = Î», sinÏ†0 = sinÏ†, cosÏ†0 = cosÏ†;
    }
  }
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(Î», Ï†) {
      var cosÎ» = Math.cos(Î»), cosÏ† = Math.cos(Ï†), k = scale(cosÎ» * cosÏ†);
      return [ k * cosÏ† * Math.sin(Î»), k * Math.sin(Ï†) ];
    }
    azimuthal.invert = function(x, y) {
      var Ï = Math.sqrt(x * x + y * y), c = angle(Ï), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, Ï * cosc), Math.asin(Ï && y * sinc / Ï) ];
    };
    return azimuthal;
  }
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosÎ»cosÏ†) {
    return Math.sqrt(2 / (1 + cosÎ»cosÏ†));
  }, function(Ï) {
    return 2 * Math.asin(Ï / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosÎ»cosÏ†) {
    var c = Math.acos(cosÎ»cosÏ†);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  function d3_geo_conicConformal(Ï†0, Ï†1) {
    var cosÏ†0 = Math.cos(Ï†0), t = function(Ï†) {
      return Math.tan(Ï€ / 4 + Ï† / 2);
    }, n = Ï†0 === Ï†1 ? Math.sin(Ï†0) : Math.log(cosÏ†0 / Math.cos(Ï†1)) / Math.log(t(Ï†1) / t(Ï†0)), F = cosÏ†0 * Math.pow(t(Ï†0), n) / n;
    if (!n) return d3_geo_mercator;
    function forward(Î», Ï†) {
      if (F > 0) {
        if (Ï† < -halfÏ€ + Îµ) Ï† = -halfÏ€ + Îµ;
      } else {
        if (Ï† > halfÏ€ - Îµ) Ï† = halfÏ€ - Îµ;
      }
      var Ï = F / Math.pow(t(Ï†), n);
      return [ Ï * Math.sin(n * Î»), F - Ï * Math.cos(n * Î») ];
    }
    forward.invert = function(x, y) {
      var Ï0_y = F - y, Ï = d3_sgn(n) * Math.sqrt(x * x + Ï0_y * Ï0_y);
      return [ Math.atan2(x, Ï0_y) / n, 2 * Math.atan(Math.pow(F / Ï, 1 / n)) - halfÏ€ ];
    };
    return forward;
  }
  (d3.geo.conicConformal = function() {
    return d3_geo_conic(d3_geo_conicConformal);
  }).raw = d3_geo_conicConformal;
  function d3_geo_conicEquidistant(Ï†0, Ï†1) {
    var cosÏ†0 = Math.cos(Ï†0), n = Ï†0 === Ï†1 ? Math.sin(Ï†0) : (cosÏ†0 - Math.cos(Ï†1)) / (Ï†1 - Ï†0), G = cosÏ†0 / n + Ï†0;
    if (abs(n) < Îµ) return d3_geo_equirectangular;
    function forward(Î», Ï†) {
      var Ï = G - Ï†;
      return [ Ï * Math.sin(n * Î»), G - Ï * Math.cos(n * Î») ];
    }
    forward.invert = function(x, y) {
      var Ï0_y = G - y;
      return [ Math.atan2(x, Ï0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + Ï0_y * Ï0_y) ];
    };
    return forward;
  }
  (d3.geo.conicEquidistant = function() {
    return d3_geo_conic(d3_geo_conicEquidistant);
  }).raw = d3_geo_conicEquidistant;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosÎ»cosÏ†) {
    return 1 / cosÎ»cosÏ†;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  function d3_geo_mercator(Î», Ï†) {
    return [ Î», Math.log(Math.tan(Ï€ / 4 + Ï† / 2)) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ x, 2 * Math.atan(Math.exp(y)) - halfÏ€ ];
  };
  function d3_geo_mercatorProjection(project) {
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
    m.scale = function() {
      var v = scale.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.translate = function() {
      var v = translate.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.clipExtent = function(_) {
      var v = clipExtent.apply(m, arguments);
      if (v === m) {
        if (clipAuto = _ == null) {
          var k = Ï€ * scale(), t = translate();
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
        }
      } else if (clipAuto) {
        v = null;
      }
      return v;
    };
    return m.clipExtent(null);
  }
  (d3.geo.mercator = function() {
    return d3_geo_mercatorProjection(d3_geo_mercator);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosÎ»cosÏ†) {
    return 1 / (1 + cosÎ»cosÏ†);
  }, function(Ï) {
    return 2 * Math.atan(Ï);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_transverseMercator(Î», Ï†) {
    return [ Math.log(Math.tan(Ï€ / 4 + Ï† / 2)), -Î» ];
  }
  d3_geo_transverseMercator.invert = function(x, y) {
    return [ -y, 2 * Math.atan(Math.exp(x)) - halfÏ€ ];
  };
  (d3.geo.transverseMercator = function() {
    var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
    projection.center = function(_) {
      return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ -_[1], _[0] ]);
    };
    projection.rotate = function(_) {
      return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
      [ _[0], _[1], _[2] - 90 ]);
    };
    return projection.rotate([ 0, 0 ]);
  }).raw = d3_geo_transverseMercator;
  d3.geom = {};
  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  d3.geom.hull = function(vertices) {
    var x = d3_geom_pointX, y = d3_geom_pointY;
    if (arguments.length) return hull(vertices);
    function hull(data) {
      if (data.length < 3) return [];
      var fx = d3_functor(x), fy = d3_functor(y), i, n = data.length, points = [], flippedPoints = [];
      for (i = 0; i < n; i++) {
        points.push([ +fx.call(this, data[i], i), +fy.call(this, data[i], i), i ]);
      }
      points.sort(d3_geom_hullOrder);
      for (i = 0; i < n; i++) flippedPoints.push([ points[i][0], -points[i][1] ]);
      var upper = d3_geom_hullUpper(points), lower = d3_geom_hullUpper(flippedPoints);
      var skipLeft = lower[0] === upper[0], skipRight = lower[lower.length - 1] === upper[upper.length - 1], polygon = [];
      for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
      for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);
      return polygon;
    }
    hull.x = function(_) {
      return arguments.length ? (x = _, hull) : x;
    };
    hull.y = function(_) {
      return arguments.length ? (y = _, hull) : y;
    };
    return hull;
  };
  function d3_geom_hullUpper(points) {
    var n = points.length, hull = [ 0, 1 ], hs = 2;
    for (var i = 2; i < n; i++) {
      while (hs > 1 && d3_cross2d(points[hull[hs - 2]], points[hull[hs - 1]], points[i]) <= 0) --hs;
      hull[hs++] = i;
    }
    return hull.slice(0, hs);
  }
  function d3_geom_hullOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }
  d3.geom.polygon = function(coordinates) {
    d3_subclass(coordinates, d3_geom_polygonPrototype);
    return coordinates;
  };
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];
  d3_geom_polygonPrototype.area = function() {
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;
    while (++i < n) {
      a = b;
      b = this[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
    return area * .5;
  };
  d3_geom_polygonPrototype.centroid = function(k) {
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;
    if (!arguments.length) k = -1 / (6 * this.area());
    while (++i < n) {
      a = b;
      b = this[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [ x * k, y * k ];
  };
  d3_geom_polygonPrototype.clip = function(subject) {
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = this[i];
      c = input[(m = input.length - closed) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      if (closed) subject.push(subject[0]);
      a = b;
    }
    return subject;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  function d3_geom_polygonClosed(coordinates) {
    var a = coordinates[0], b = coordinates[coordinates.length - 1];
    return !(a[0] - b[0] || a[1] - b[1]);
  }
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];
  function d3_geom_voronoiBeach() {
    d3_geom_voronoiRedBlackNode(this);
    this.edge = this.site = this.circle = null;
  }
  function d3_geom_voronoiCreateBeach(site) {
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();
    beach.site = site;
    return beach;
  }
  function d3_geom_voronoiDetachBeach(beach) {
    d3_geom_voronoiDetachCircle(beach);
    d3_geom_voronoiBeaches.remove(beach);
    d3_geom_voronoiBeachPool.push(beach);
    d3_geom_voronoiRedBlackNode(beach);
  }
  function d3_geom_voronoiRemoveBeach(beach) {
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {
      x: x,
      y: y
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];
    d3_geom_voronoiDetachBeach(beach);
    var lArc = previous;
    while (lArc.circle && abs(x - lArc.circle.x) < Îµ && abs(y - lArc.circle.cy) < Îµ) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      d3_geom_voronoiDetachBeach(lArc);
      lArc = previous;
    }
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachCircle(lArc);
    var rArc = next;
    while (rArc.circle && abs(x - rArc.circle.x) < Îµ && abs(y - rArc.circle.cy) < Îµ) {
      next = rArc.N;
      disappearing.push(rArc);
      d3_geom_voronoiDetachBeach(rArc);
      rArc = next;
    }
    disappearing.push(rArc);
    d3_geom_voronoiDetachCircle(rArc);
    var nArcs = disappearing.length, iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }
    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiAddBeach(site) {
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;
    while (node) {
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
      if (dxl > Îµ) node = node.L; else {
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
        if (dxr > Îµ) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -Îµ) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -Îµ) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    var newArc = d3_geom_voronoiCreateBeach(site);
    d3_geom_voronoiBeaches.insert(lArc, newArc);
    if (!lArc && !rArc) return;
    if (lArc === rArc) {
      d3_geom_voronoiDetachCircle(lArc);
      rArc = d3_geom_voronoiCreateBeach(lArc.site);
      d3_geom_voronoiBeaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      d3_geom_voronoiAttachCircle(lArc);
      d3_geom_voronoiAttachCircle(rArc);
      return;
    }
    if (!rArc) {
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      return;
    }
    d3_geom_voronoiDetachCircle(lArc);
    d3_geom_voronoiDetachCircle(rArc);
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {
      x: (cy * hb - by * hc) / d + ax,
      y: (bx * hc - cx * hb) / d + ay
    };
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
    if (!pby2) return rfocx;
    var lArc = arc.P;
    if (!lArc) return -Infinity;
    site = lArc.site;
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
    if (!plby2) return lfocx;
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    return (rfocx + lfocx) / 2;
  }
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  }
  function d3_geom_voronoiCell(site) {
    this.site = site;
    this.edges = [];
  }
  d3_geom_voronoiCell.prototype.prepare = function() {
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;
    while (iHalfEdge--) {
      edge = halfEdges[iHalfEdge].edge;
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
    }
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
    return halfEdges.length;
  };
  function d3_geom_voronoiCloseCells(extent) {
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;
    while (iCell--) {
      cell = cells[iCell];
      if (!cell || !cell.prepare()) continue;
      halfEdges = cell.edges;
      nHalfEdges = halfEdges.length;
      iHalfEdge = 0;
      while (iHalfEdge < nHalfEdges) {
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
        if (abs(x3 - x2) > Îµ || abs(y3 - y2) > Îµ) {
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < Îµ && y1 - y3 > Îµ ? {
            x: x0,
            y: abs(x2 - x0) < Îµ ? y2 : y1
          } : abs(y3 - y1) < Îµ && x1 - x3 > Îµ ? {
            x: abs(y2 - y1) < Îµ ? x2 : x1,
            y: y1
          } : abs(x3 - x1) < Îµ && y3 - y0 > Îµ ? {
            x: x1,
            y: abs(x2 - x1) < Îµ ? y2 : y0
          } : abs(y3 - y0) < Îµ && x3 - x0 > Îµ ? {
            x: abs(y2 - y0) < Îµ ? x2 : x0,
            y: y0
          } : null), cell.site, null));
          ++nHalfEdges;
        }
      }
    }
  }
  function d3_geom_voronoiHalfEdgeOrder(a, b) {
    return b.angle - a.angle;
  }
  function d3_geom_voronoiCircle() {
    d3_geom_voronoiRedBlackNode(this);
    this.x = this.y = this.arc = this.site = this.cy = null;
  }
  function d3_geom_voronoiAttachCircle(arc) {
    var lArc = arc.P, rArc = arc.N;
    if (!lArc || !rArc) return;
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
    if (lSite === rSite) return;
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -Îµ2) return;
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = cy + Math.sqrt(x * x + y * y);
    circle.cy = cy;
    arc.circle = circle;
    var before = null, node = d3_geom_voronoiCircles._;
    while (node) {
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
        if (node.L) node = node.L; else {
          before = node.P;
          break;
        }
      } else {
        if (node.R) node = node.R; else {
          before = node;
          break;
        }
      }
    }
    d3_geom_voronoiCircles.insert(before, circle);
    if (!before) d3_geom_voronoiFirstCircle = circle;
  }
  function d3_geom_voronoiDetachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
      d3_geom_voronoiCircles.remove(circle);
      d3_geom_voronoiCirclePool.push(circle);
      d3_geom_voronoiRedBlackNode(circle);
      arc.circle = null;
    }
  }
  function d3_geom_voronoiClipEdges(extent) {
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;
    while (i--) {
      e = edges[i];
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < Îµ && abs(e.a.y - e.b.y) < Îµ) {
        e.a = e.b = null;
        edges.splice(i, 1);
      }
    }
  }
  function d3_geom_voronoiConnectEdge(edge, extent) {
    var vb = edge.b;
    if (vb) return true;
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!va) va = {
          x: fx,
          y: y0
        }; else if (va.y >= y1) return;
        vb = {
          x: fx,
          y: y1
        };
      } else {
        if (!va) va = {
          x: fx,
          y: y1
        }; else if (va.y < y0) return;
        vb = {
          x: fx,
          y: y0
        };
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!va) va = {
            x: (y0 - fb) / fm,
            y: y0
          }; else if (va.y >= y1) return;
          vb = {
            x: (y1 - fb) / fm,
            y: y1
          };
        } else {
          if (!va) va = {
            x: (y1 - fb) / fm,
            y: y1
          }; else if (va.y < y0) return;
          vb = {
            x: (y0 - fb) / fm,
            y: y0
          };
        }
      } else {
        if (ly < ry) {
          if (!va) va = {
            x: x0,
            y: fm * x0 + fb
          }; else if (va.x >= x1) return;
          vb = {
            x: x1,
            y: fm * x1 + fb
          };
        } else {
          if (!va) va = {
            x: x1,
            y: fm * x1 + fb
          }; else if (va.x < x0) return;
          vb = {
            x: x0,
            y: fm * x0 + fb
          };
        }
      }
    }
    edge.a = va;
    edge.b = vb;
    return true;
  }
  function d3_geom_voronoiEdge(lSite, rSite) {
    this.l = lSite;
    this.r = rSite;
    this.a = this.b = null;
  }
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, rSite);
    d3_geom_voronoiEdges.push(edge);
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
    return edge;
  }
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, null);
    edge.a = va;
    edge.b = vb;
    d3_geom_voronoiEdges.push(edge);
    return edge;
  }
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
    if (!edge.a && !edge.b) {
      edge.a = vertex;
      edge.l = lSite;
      edge.r = rSite;
    } else if (edge.l === rSite) {
      edge.b = vertex;
    } else {
      edge.a = vertex;
    }
  }
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
    var va = edge.a, vb = edge.b;
    this.edge = edge;
    this.site = lSite;
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
  }
  d3_geom_voronoiHalfEdge.prototype = {
    start: function() {
      return this.edge.l === this.site ? this.edge.a : this.edge.b;
    },
    end: function() {
      return this.edge.l === this.site ? this.edge.b : this.edge.a;
    }
  };
  function d3_geom_voronoiRedBlackTree() {
    this._ = null;
  }
  function d3_geom_voronoiRedBlackNode(node) {
    node.U = node.C = node.L = node.R = node.P = node.N = null;
  }
  d3_geom_voronoiRedBlackTree.prototype = {
    insert: function(after, node) {
      var parent, grandpa, uncle;
      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = d3_geom_voronoiRedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;
      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              d3_geom_voronoiRedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              d3_geom_voronoiRedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },
    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);
      if (parent) {
        if (parent.L === node) parent.L = next; else parent.R = next;
      } else {
        this._ = next;
      }
      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }
      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) {
        node.C = false;
        return;
      }
      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);
      if (node) node.C = false;
    }
  };
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
    var p = node, q = node.R, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {
    var p = node, q = node.L, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }
  function d3_geom_voronoiRedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }
  function d3_geom_voronoi(sites, bbox) {
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;
    d3_geom_voronoiEdges = [];
    d3_geom_voronoiCells = new Array(sites.length);
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();
    while (true) {
      circle = d3_geom_voronoiFirstCircle;
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        if (site.x !== x0 || site.y !== y0) {
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
          d3_geom_voronoiAddBeach(site);
          x0 = site.x, y0 = site.y;
        }
        site = sites.pop();
      } else if (circle) {
        d3_geom_voronoiRemoveBeach(circle.arc);
      } else {
        break;
      }
    }
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);
    var diagram = {
      cells: d3_geom_voronoiCells,
      edges: d3_geom_voronoiEdges
    };
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;
    return diagram;
  }
  function d3_geom_voronoiVertexOrder(a, b) {
    return b.y - a.y || b.x - a.x;
  }
  d3.geom.voronoi = function(points) {
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;
    if (points) return voronoi(points);
    function voronoi(data) {
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {
          var s = e.start();
          return [ s.x, s.y ];
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];
        polygon.point = data[i];
      });
      return polygons;
    }
    function sites(data) {
      return data.map(function(d, i) {
        return {
          x: Math.round(fx(d, i) / Îµ) * Îµ,
          y: Math.round(fy(d, i) / Îµ) * Îµ,
          i: i
        };
      });
    }
    voronoi.links = function(data) {
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
        return edge.l && edge.r;
      }).map(function(edge) {
        return {
          source: data[edge.l.i],
          target: data[edge.r.i]
        };
      });
    };
    voronoi.triangles = function(data) {
      var triangles = [];
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;
        while (++j < m) {
          e0 = e1;
          s0 = s1;
          e1 = edges[j].edge;
          s1 = e1.l === site ? e1.r : e1.l;
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);
          }
        }
      });
      return triangles;
    };
    voronoi.x = function(_) {
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
    };
    voronoi.y = function(_) {
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
    };
    voronoi.clipExtent = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
      return voronoi;
    };
    voronoi.size = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);
    };
    return voronoi;
  };
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];
  function d3_geom_voronoiTriangleArea(a, b, c) {
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
  }
  d3.geom.delaunay = function(vertices) {
    return d3.geom.voronoi().triangles(vertices);
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;
    if (compat = arguments.length) {
      x = d3_geom_quadtreeCompatX;
      y = d3_geom_quadtreeCompatY;
      if (compat === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      }
      return quadtree(points);
    }
    function quadtree(data) {
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
      } else {
        x2_ = y2_ = -(x1_ = y1_ = Infinity);
        xs = [], ys = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          xs.push(d.x);
          ys.push(d.y);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          xs.push(x_);
          ys.push(y_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_;
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;
      function insert(n, d, x, y, x1, y1, x2, y2) {
        if (isNaN(x) || isNaN(y)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) < .01) {
              insertChild(n, d, x, y, x1, y1, x2, y2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.point = null;
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
              insertChild(n, d, x, y, x1, y1, x2, y2);
            }
          } else {
            n.x = x, n.y = y, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, x1, y1, x2, y2);
        }
      }
      function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, right = x >= sx, bottom = y >= sy, i = (bottom << 1) + right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
        if (right) x1 = sx; else x2 = sx;
        if (bottom) y1 = sy; else y2 = sy;
        insert(n, d, x, y, x1, y1, x2, y2);
      }
      var root = d3_geom_quadtreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
      };
      root.visit = function(f) {
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = data = d = null;
      return root;
    }
    quadtree.x = function(_) {
      return arguments.length ? (x = _, quadtree) : x;
    };
    quadtree.y = function(_) {
      return arguments.length ? (y = _, quadtree) : y;
    };
    quadtree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], 
      y2 = +_[1][1];
      return quadtree;
    };
    quadtree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
      return quadtree;
    };
    return quadtree;
  };
  function d3_geom_quadtreeCompatX(d) {
    return d.x;
  }
  function d3_geom_quadtreeCompatY(d) {
    return d.y;
  }
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  d3.interpolateRgb = d3_interpolateRgb;
  function d3_interpolateRgb(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  }
  d3.interpolateObject = d3_interpolateObject;
  function d3_interpolateObject(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolate(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }
  d3.interpolateNumber = d3_interpolateNumber;
  function d3_interpolateNumber(a, b) {
    b -= a = +a;
    return function(t) {
      return a + b * t;
    };
  }
  d3.interpolateString = d3_interpolateString;
  function d3_interpolateString(a, b) {
    var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = d3_interpolate_numberA.exec(a)) && (bm = d3_interpolate_numberB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.substring(bi, bs);
        if (s[i]) s[i] += bs; else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm; else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({
          i: i,
          x: d3_interpolateNumber(am, bm)
        });
      }
      bi = d3_interpolate_numberB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.substring(bi);
      if (s[i]) s[i] += bs; else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? (b = q[0].x, function(t) {
      return b(t) + "";
    }) : function() {
      return b;
    } : (b = q.length, function(t) {
      for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    });
  }
  var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");
  d3.interpolate = d3_interpolate;
  function d3_interpolate(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  }
  d3.interpolators = [ function(a, b) {
    var t = typeof b;
    return (t === "string" ? d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_Color ? d3_interpolateRgb : Array.isArray(b) ? d3_interpolateArray : t === "object" && isNaN(b) ? d3_interpolateObject : d3_interpolateNumber)(a, b);
  } ];
  d3.interpolateArray = d3_interpolateArray;
  function d3_interpolateArray(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.substring(0, i) : name, m = i >= 0 ? name.substring(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * halfÏ€);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / Ï„ * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * Ï„ / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.interpolateHcl = d3_interpolateHcl;
  function d3_interpolateHcl(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  }
  d3.interpolateHsl = d3_interpolateHsl;
  function d3_interpolateHsl(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + "";
    };
  }
  d3.interpolateLab = d3_interpolateLab;
  function d3_interpolateLab(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  }
  d3.interpolateRound = d3_interpolateRound;
  function d3_interpolateRound(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      if (string != null) {
        g.setAttribute("transform", string);
        var t = g.transform.baseVal.consolidate();
      }
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolateTransform = d3_interpolateTransform;
  function d3_interpolateTransform(a, b) {
    var s = [], q = [], n, A = d3.transform(a), B = d3.transform(b), ta = A.translate, tb = B.translate, ra = A.rotate, rb = B.rotate, wa = A.skew, wb = B.skew, ka = A.scale, kb = B.scale;
    if (ta[0] != tb[0] || ta[1] != tb[1]) {
      s.push("translate(", null, ",", null, ")");
      q.push({
        i: 1,
        x: d3_interpolateNumber(ta[0], tb[0])
      }, {
        i: 3,
        x: d3_interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    } else {
      s.push("");
    }
    if (ra != rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(s.pop() + "rotate(", null, ")") - 2,
        x: d3_interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(s.pop() + "rotate(" + rb + ")");
    }
    if (wa != wb) {
      q.push({
        i: s.push(s.pop() + "skewX(", null, ")") - 2,
        x: d3_interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(s.pop() + "skewX(" + wb + ")");
    }
    if (ka[0] != kb[0] || ka[1] != kb[1]) {
      n = s.push(s.pop() + "scale(", null, ",", null, ")");
      q.push({
        i: n - 4,
        x: d3_interpolateNumber(ka[0], kb[0])
      }, {
        i: n - 2,
        x: d3_interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] != 1 || kb[1] != 1) {
      s.push(s.pop() + "scale(" + kb + ")");
    }
    n = q.length;
    return function(t) {
      var i = -1, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  function d3_uninterpolateNumber(a, b) {
    b = b - (a = +a) ? 1 / (b - a) : 0;
    return function(x) {
      return (x - a) * b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = b - (a = +a) ? 1 / (b - a) : 0;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) * b));
    };
  }
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (Ï„ - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, chargeDistance2 = d3_layout_forceChargeDistance2, gravity = .1, theta2 = .64, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dw = x2 - x1, dn = dx * dx + dy * dy;
          if (dw * dw / theta2 < dn) {
            if (dn < chargeDistance2) {
              var k = quad.charge / dn;
              node.px -= dx * k;
              node.py -= dy * k;
            }
            return true;
          }
          if (quad.point && dn && dn < chargeDistance2) {
            var k = quad.pointCharge / dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight / (t.weight + s.weight));
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.chargeDistance = function(x) {
      if (!arguments.length) return Math.sqrt(chargeDistance2);
      chargeDistance2 = x * x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return Math.sqrt(theta2);
      theta2 = x * x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) alpha = x; else alpha = 0;
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        d3.timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        if (!neighbors) {
          neighbors = new Array(n);
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        var candidates = neighbors[i], j = -1, m = candidates.length, x;
        while (++j < m) if (!isNaN(x = candidates[j][dimension])) return x;
        return Math.random() * size;
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1, d3_layout_forceChargeDistance2 = Infinity;
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function recurse(node, depth, nodes) {
      var childs = children.call(hierarchy, node, depth);
      node.depth = depth;
      nodes.push(node);
      if (childs && (n = childs.length)) {
        var i = -1, n, c = node.children = new Array(n), v = 0, j = depth + 1, d;
        while (++i < n) {
          d = c[i] = recurse(childs[i], j, nodes);
          d.parent = node;
          v += d.value;
        }
        if (sort) c.sort(sort);
        if (value) node.value = v;
      } else {
        delete node.children;
        if (value) {
          node.value = +value.call(hierarchy, node, depth) || 0;
        }
      }
      return node;
    }
    function revalue(node, depth) {
      var children = node.children, v = 0;
      if (children && (n = children.length)) {
        var i = -1, n, j = depth + 1;
        while (++i < n) v += revalue(children[i], j);
      } else if (value) {
        v = +value.call(hierarchy, node, depth) || 0;
      }
      if (value) node.value = v;
      return v;
    }
    function hierarchy(d) {
      var nodes = [];
      recurse(d, 0, nodes);
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      revalue(root, 0);
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = Ï„;
    function pie(data) {
      var values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      });
      var a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle);
      var k = ((typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a) / d3.sum(values);
      var index = d3.range(data.length);
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      var arcs = [];
      index.forEach(function(i) {
        var d;
        arcs[i] = {
          data: data[i],
          value: d = values[i],
          startAngle: a,
          endAngle: a += d * k
        };
      });
      return arcs;
    }
    pie.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return pie;
    };
    pie.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return pie;
    };
    pie.startAngle = function(x) {
      if (!arguments.length) return startAngle;
      startAngle = x;
      return pie;
    };
    pie.endAngle = function(x) {
      if (!arguments.length) return endAngle;
      endAngle = x;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var n = series.length, m = series[0].length, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0];
      function firstWalk(node, previousSibling) {
        var children = node.children, layout = node._tree;
        if (children && (n = children.length)) {
          var n, firstChild = children[0], previousChild, ancestor = firstChild, child, i = -1;
          while (++i < n) {
            child = children[i];
            firstWalk(child, previousChild);
            ancestor = apportion(child, previousChild, ancestor);
            previousChild = child;
          }
          d3_layout_treeShift(node);
          var midpoint = .5 * (firstChild._tree.prelim + child._tree.prelim);
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
            layout.mod = layout.prelim - midpoint;
          } else {
            layout.prelim = midpoint;
          }
        } else {
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
          }
        }
      }
      function secondWalk(node, x) {
        node.x = node._tree.prelim + x;
        var children = node.children;
        if (children && (n = children.length)) {
          var i = -1, n;
          x += node._tree.mod;
          while (++i < n) {
            secondWalk(children[i], x);
          }
        }
      }
      function apportion(node, previousSibling, ancestor) {
        if (previousSibling) {
          var vip = node, vop = node, vim = previousSibling, vom = node.parent.children[0], sip = vip._tree.mod, sop = vop._tree.mod, sim = vim._tree.mod, som = vom._tree.mod, shift;
          while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
            vom = d3_layout_treeLeft(vom);
            vop = d3_layout_treeRight(vop);
            vop._tree.ancestor = node;
            shift = vim._tree.prelim + sim - vip._tree.prelim - sip + separation(vim, vip);
            if (shift > 0) {
              d3_layout_treeMove(d3_layout_treeAncestor(vim, node, ancestor), node, shift);
              sip += shift;
              sop += shift;
            }
            sim += vim._tree.mod;
            sip += vip._tree.mod;
            som += vom._tree.mod;
            sop += vop._tree.mod;
          }
          if (vim && !d3_layout_treeRight(vop)) {
            vop._tree.thread = vim;
            vop._tree.mod += sim - sop;
          }
          if (vip && !d3_layout_treeLeft(vom)) {
            vom._tree.thread = vip;
            vom._tree.mod += sip - som;
            ancestor = node;
          }
        }
        return ancestor;
      }
      d3_layout_treeVisitAfter(root, function(node, previousSibling) {
        node._tree = {
          ancestor: node,
          prelim: 0,
          mod: 0,
          change: 0,
          shift: 0,
          number: previousSibling ? previousSibling._tree.number + 1 : 0
        };
      });
      firstWalk(root);
      secondWalk(root, -root._tree.prelim);
      var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost), right = d3_layout_treeSearch(root, d3_layout_treeRightmost), deep = d3_layout_treeSearch(root, d3_layout_treeDeepest), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2, y1 = deep.depth || 1;
      d3_layout_treeVisitAfter(root, nodeSize ? function(node) {
        node.x *= size[0];
        node.y = node.depth * size[1];
        delete node._tree;
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = node.depth / y1 * size[1];
        delete node._tree;
      });
      return nodes;
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return tree;
    };
    tree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(node) {
    var children = node.children;
    return children && children.length ? children[0] : node._tree.thread;
  }
  function d3_layout_treeRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? children[n - 1] : node._tree.thread;
  }
  function d3_layout_treeSearch(node, compare) {
    var children = node.children;
    if (children && (n = children.length)) {
      var child, n, i = -1;
      while (++i < n) {
        if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {
          node = child;
        }
      }
    }
    return node;
  }
  function d3_layout_treeRightmost(a, b) {
    return a.x - b.x;
  }
  function d3_layout_treeLeftmost(a, b) {
    return b.x - a.x;
  }
  function d3_layout_treeDeepest(a, b) {
    return a.depth - b.depth;
  }
  function d3_layout_treeVisitAfter(node, callback) {
    function visit(node, previousSibling) {
      var children = node.children;
      if (children && (n = children.length)) {
        var child, previousChild = null, i = -1, n;
        while (++i < n) {
          child = children[i];
          visit(child, previousChild);
          previousChild = child;
        }
      }
      callback(node, previousSibling);
    }
    visit(node, null);
  }
  function d3_layout_treeShift(node) {
    var shift = 0, change = 0, children = node.children, i = children.length, child;
    while (--i >= 0) {
      child = children[i]._tree;
      child.prelim += shift;
      child.mod += shift;
      shift += child.shift + (change += child.change);
    }
  }
  function d3_layout_treeMove(ancestor, node, shift) {
    ancestor = ancestor._tree;
    node = node._tree;
    var change = shift / (node.number - ancestor.number);
    ancestor.change += change;
    node.change -= change;
    node.shift += shift;
    node.prelim += shift;
    node.mod += shift;
  }
  function d3_layout_treeAncestor(vim, node, ancestor) {
    return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() {
        return radius;
      };
      root.x = root.y = 0;
      d3_layout_treeVisitAfter(root, function(d) {
        d.r = +r(d.value);
      });
      d3_layout_treeVisitAfter(root, d3_layout_packSiblings);
      if (padding) {
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
        d3_layout_treeVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_treeVisitAfter(root, d3_layout_packSiblings);
        d3_layout_treeVisitAfter(root, function(d) {
          d.r -= dr;
        });
      }
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      return nodes;
    }
    pack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return pack;
    };
    pack.radius = function(_) {
      if (!arguments.length) return radius;
      radius = _ == null || typeof _ === "function" ? _ : +_;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_treeVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_treeVisitAfter(root, nodeSize ? function(node) {
        node.x = (node.x - root.x) * size[0];
        node.y = (root.y - node.y) * size[1];
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return cluster;
    };
    cluster.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = 0;
      root.y = 0;
      root.dx = size[0];
      root.dy = size[1];
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  d3.random = {
    normal: function(Âµ, Ïƒ) {
      var n = arguments.length;
      if (n < 2) Ïƒ = 1;
      if (n < 1) Âµ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return Âµ + Ïƒ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    bates: function(m) {
      var random = d3.random.irwinHall(m);
      return function() {
        return random() / m;
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s;
      };
    }
  };
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
    return domain;
  }
  function d3_scale_niceStep(step) {
    return step ? {
      floor: function(x) {
        return Math.floor(x / step) * step;
      },
      ceil: function(x) {
        return Math.ceil(x / step) * step;
      }
    } : d3_scale_niceIdentity;
  }
  var d3_scale_niceIdentity = {
    floor: d3_identity,
    ceil: d3_identity
  };
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3_interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3_interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      d3_scale_linearNice(domain, m);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(domain, m) {
    return d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
  }
  function d3_scale_linearTickRange(domain, m) {
    if (m == null) m = 10;
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m, format) {
    var range = d3_scale_linearTickRange(domain, m);
    if (format) {
      var match = d3_format_re.exec(format);
      match.shift();
      if (match[8] === "s") {
        var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
        if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
        match[8] = "f";
        format = d3.format(match.join(""));
        return function(d) {
          return format(prefix.scale(d)) + prefix.symbol;
        };
      }
      if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
      format = match.join("");
    } else {
      format = ",." + d3_scale_linearPrecision(range[2]) + "f";
    }
    return d3.format(format);
  }
  var d3_scale_linearFormatSignificant = {
    s: 1,
    g: 1,
    p: 1,
    r: 1,
    e: 1
  };
  function d3_scale_linearPrecision(value) {
    return -Math.floor(Math.log(value) / Math.LN10 + .01);
  }
  function d3_scale_linearFormatPrecision(type, range) {
    var p = d3_scale_linearPrecision(range[2]);
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e") : p - (type === "%") * 2;
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);
  };
  function d3_scale_log(linear, base, positive, domain) {
    function log(x) {
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
    }
    function pow(x) {
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);
    }
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      positive = x[0] >= 0;
      linear.domain((domain = x.map(Number)).map(log));
      return scale;
    };
    scale.base = function(_) {
      if (!arguments.length) return base;
      base = +_;
      linear.domain(domain.map(log));
      return scale;
    };
    scale.nice = function() {
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
      linear.domain(niced);
      domain = niced.map(pow);
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;
      if (isFinite(j - i)) {
        if (positive) {
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        } else {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (!arguments.length) return d3_scale_logFormat;
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== "function") format = d3.format(format);
      var k = Math.max(.1, n / scale.ticks().length), f = positive ? (e = 1e-12, Math.ceil) : (e = -1e-12, 
      Math.floor), e;
      return function(d) {
        return d / pow(f(log(d) + e)) <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), base, positive, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e"), d3_scale_logNiceNegative = {
    floor: function(x) {
      return -Math.ceil(-x);
    },
    ceil: function(x) {
      return -Math.floor(-x);
    }
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);
  };
  function d3_scale_pow(linear, exponent, domain) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      linear.domain((domain = x.map(Number)).map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_linearNice(domain, m));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      linear.domain(domain.map(powp));
      return scale;
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || (ranger.t === "range" ? index.set(x, domain.push(x)) : NaN)) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = (stop - start) / (Math.max(1, domain.length - 1) + padding);
      range = steps(domain.length < 2 ? (start + stop) / 2 : start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding)), error = stop - start - (domain.length - padding) * step;
      range = steps(start + Math.round(error / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.filter(d3_number).sort(d3_ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [ y, y + 1 / kx ];
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      if (x <= x) return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return [ domain[y - 1], domain[y] ];
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function arc() {
      var r0 = innerRadius.apply(this, arguments), r1 = outerRadius.apply(this, arguments), a0 = startAngle.apply(this, arguments) + d3_svg_arcOffset, a1 = endAngle.apply(this, arguments) + d3_svg_arcOffset, da = (a1 < a0 && (da = a0, 
      a0 = a1, a1 = da), a1 - a0), df = da < Ï€ ? "0" : "1", c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      return da >= d3_svg_arcMax ? r0 ? "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "M0," + r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + -r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + r0 + "Z" : "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "Z" : r0 ? "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L" + r0 * c1 + "," + r0 * s1 + "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0 + "Z" : "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L0,0" + "Z";
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (innerRadius.apply(this, arguments) + outerRadius.apply(this, arguments)) / 2, a = (startAngle.apply(this, arguments) + endAngle.apply(this, arguments)) / 2 + d3_svg_arcOffset;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcOffset = -halfÏ€, d3_svg_arcMax = Ï„ - Îµ;
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_line(projection) {
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    step: d3_svg_lineStep,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.join("L");
  }
  function d3_svg_lineLinearClosed(points) {
    return d3_svg_lineLinear(points) + "Z";
  }
  function d3_svg_lineStep(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
    if (n > 1) path.push("H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, points.length - 1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    points.push(points[n - 1]);
    while (++i <= n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    points.pop();
    path.push("L", pi);
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (abs(d) < Îµ) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] + d3_svg_arcOffset;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) + d3_svg_arcOffset, a1 = endAngle.call(self, subgroup, i) + d3_svg_arcOffset;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > Ï€) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] + d3_svg_arcOffset;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / Ï€);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  function d3_transition(groups, id) {
    d3_subclass(groups, d3_transitionPrototype);
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3_transitionPrototype.size = d3_selectionPrototype.size;
  d3.transition = function(selection) {
    return arguments.length ? d3_transitionInheritId ? selection.transition() : selection : d3_selectionRoot.transition();
  };
  d3.transition.prototype = d3_transitionPrototype;
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnode, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, id, node.__transition__[id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnodes, node, subnode, transition;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node.__transition__[id];
          subnodes = selector.call(node, node.__data__, i, j);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.id);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id;
    if (arguments.length < 2) return this.node().__transition__[id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node.__transition__[id].tween.remove(name);
    } : function(node) {
      node.__transition__[id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node.__transition__[id].tween.set(name, value);
    }));
  }
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrTween(b) {
      return b == null ? attrNull : (b += "", function() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      });
    }
    function attrTweenNS(b) {
      return b == null ? attrNullNS : (b += "", function() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      });
    }
    return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleString(b) {
      return b == null ? styleNull : (b += "", function() {
        var a = d3_window.getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = d3_interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      });
    }
    return d3_transition_tween(this, "style." + name, value, styleString);
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    function styleTween(d, i) {
      var f = tween.call(this, d, i, d3_window.getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    }
    return this.tween("style." + name, styleTween);
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    return this.each("end.transition", function() {
      var p;
      if (this.__transition__.count < 2 && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node.__transition__[id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].delay;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].delay = +value.call(node, node.__data__, i, j);
    } : (value = +value, function(node) {
      node.__transition__[id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].duration;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].duration = Math.max(1, value.call(node, node.__data__, i, j));
    } : (value = Math.max(1, value), function(node) {
      node.__transition__[id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      d3_transitionInheritId = id;
      d3_selection_each(this, function(node, i, j) {
        d3_transitionInherit = node.__transition__[id];
        type.call(node, node.__data__, i, j);
      });
      d3_transitionInherit = inherit;
      d3_transitionInheritId = inheritId;
    } else {
      d3_selection_each(this, function(node) {
        var transition = node.__transition__[id];
        (transition.event || (transition.event = d3.dispatch("start", "end"))).on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = Object.create(node.__transition__[id0]);
          transition.delay += transition.duration;
          d3_transitionNode(node, i, id1, transition);
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id1);
  };
  function d3_transitionNode(node, i, id, inherit) {
    var lock = node.__transition__ || (node.__transition__ = {
      active: 0,
      count: 0
    }), transition = lock[id];
    if (!transition) {
      var time = inherit.time;
      transition = lock[id] = {
        tween: new d3_Map(),
        time: time,
        ease: inherit.ease,
        delay: inherit.delay,
        duration: inherit.duration
      };
      ++lock.count;
      d3.timer(function(elapsed) {
        var d = node.__data__, ease = transition.ease, delay = transition.delay, duration = transition.duration, timer = d3_timer_active, tweened = [];
        timer.t = delay + time;
        if (delay <= elapsed) return start(elapsed - delay);
        timer.c = start;
        function start(elapsed) {
          if (lock.active > id) return stop();
          lock.active = id;
          transition.event && transition.event.start.call(node, d, i);
          transition.tween.forEach(function(key, value) {
            if (value = value.call(node, d, i)) {
              tweened.push(value);
            }
          });
          d3.timer(function() {
            timer.c = tick(elapsed || 1) ? d3_true : tick;
            return 1;
          }, 0, time);
        }
        function tick(elapsed) {
          if (lock.active !== id) return stop();
          var t = elapsed / duration, e = ease(t), n = tweened.length;
          while (n > 0) {
            tweened[--n].call(node, e);
          }
          if (t >= 1) {
            transition.event && transition.event.end.call(node, d, i);
            return stop();
          }
        }
        function stop() {
          if (--lock.count) delete lock[id]; else delete node.__transition__;
          return 1;
        }
      }, 0, time);
    }
  }
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(".tick").data(ticks, scale1), tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", Îµ), tickExit = d3.transition(tick.exit()).style("opacity", Îµ).remove(), tickUpdate = d3.transition(tick.order()).style("opacity", 1), tickTransform;
        var range = d3_scaleRange(scale1), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text");
        switch (orient) {
         case "bottom":
          {
            tickTransform = d3_svg_axisX;
            lineEnter.attr("y2", innerTickSize);
            textEnter.attr("y", Math.max(innerTickSize, 0) + tickPadding);
            lineUpdate.attr("x2", 0).attr("y2", innerTickSize);
            textUpdate.attr("x", 0).attr("y", Math.max(innerTickSize, 0) + tickPadding);
            text.attr("dy", ".71em").style("text-anchor", "middle");
            pathUpdate.attr("d", "M" + range[0] + "," + outerTickSize + "V0H" + range[1] + "V" + outerTickSize);
            break;
          }

         case "top":
          {
            tickTransform = d3_svg_axisX;
            lineEnter.attr("y2", -innerTickSize);
            textEnter.attr("y", -(Math.max(innerTickSize, 0) + tickPadding));
            lineUpdate.attr("x2", 0).attr("y2", -innerTickSize);
            textUpdate.attr("x", 0).attr("y", -(Math.max(innerTickSize, 0) + tickPadding));
            text.attr("dy", "0em").style("text-anchor", "middle");
            pathUpdate.attr("d", "M" + range[0] + "," + -outerTickSize + "V0H" + range[1] + "V" + -outerTickSize);
            break;
          }

         case "left":
          {
            tickTransform = d3_svg_axisY;
            lineEnter.attr("x2", -innerTickSize);
            textEnter.attr("x", -(Math.max(innerTickSize, 0) + tickPadding));
            lineUpdate.attr("x2", -innerTickSize).attr("y2", 0);
            textUpdate.attr("x", -(Math.max(innerTickSize, 0) + tickPadding)).attr("y", 0);
            text.attr("dy", ".32em").style("text-anchor", "end");
            pathUpdate.attr("d", "M" + -outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + -outerTickSize);
            break;
          }

         case "right":
          {
            tickTransform = d3_svg_axisY;
            lineEnter.attr("x2", innerTickSize);
            textEnter.attr("x", Math.max(innerTickSize, 0) + tickPadding);
            lineUpdate.attr("x2", innerTickSize).attr("y2", 0);
            textUpdate.attr("x", Math.max(innerTickSize, 0) + tickPadding).attr("y", 0);
            text.attr("dy", ".32em").style("text-anchor", "start");
            pathUpdate.attr("d", "M" + outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + outerTickSize);
            break;
          }
        }
        if (scale1.rangeBand) {
          var x = scale1, dx = x.rangeBand() / 2;
          scale0 = scale1 = function(d) {
            return x(d) + dx;
          };
        } else if (scale0.rangeBand) {
          scale0 = scale1;
        } else {
          tickExit.call(tickTransform, scale1);
        }
        tickEnter.call(tickTransform, scale0);
        tickUpdate.call(tickTransform, scale1);
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = arguments;
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x) {
      var n = arguments.length;
      if (!n) return innerTickSize;
      innerTickSize = +x;
      outerTickSize = +arguments[n - 1];
      return axis;
    };
    axis.innerTickSize = function(x) {
      if (!arguments.length) return innerTickSize;
      innerTickSize = +x;
      return axis;
    };
    axis.outerTickSize = function(x) {
      if (!arguments.length) return outerTickSize;
      outerTickSize = +x;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function() {
      return arguments.length && axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x) {
    selection.attr("transform", function(d) {
      return "translate(" + x(d) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y) {
    selection.attr("transform", function(d) {
      return "translate(0," + y(d) + ")";
    });
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];
    function brush(g) {
      g.each(function() {
        var g = d3.select(this).style("pointer-events", "all").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        var background = g.selectAll(".background").data([ 0 ]);
        background.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        g.selectAll(".extent").data([ 0 ]).enter().append("rect").attr("class", "extent").style("cursor", "move");
        var resize = g.selectAll(".resize").data(resizes, d3_identity);
        resize.exit().remove();
        resize.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        resize.style("display", brush.empty() ? "none" : null);
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;
        if (x) {
          range = d3_scaleRange(x);
          backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
          redrawX(gUpdate);
        }
        if (y) {
          range = d3_scaleRange(y);
          backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
          redrawY(gUpdate);
        }
        redraw(gUpdate);
      });
    }
    brush.event = function(g) {
      g.each(function() {
        var event_ = event.of(this, arguments), extent1 = {
          x: xExtent,
          y: yExtent,
          i: xExtentDomain,
          j: yExtentDomain
        }, extent0 = this.__chart__ || extent1;
        this.__chart__ = extent1;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.brush", function() {
            xExtentDomain = extent0.i;
            yExtentDomain = extent0.j;
            xExtent = extent0.x;
            yExtent = extent0.y;
            event_({
              type: "brushstart"
            });
          }).tween("brush:brush", function() {
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);
            xExtentDomain = yExtentDomain = null;
            return function(t) {
              xExtent = extent1.x = xi(t);
              yExtent = extent1.y = yi(t);
              event_({
                type: "brush",
                mode: "resize"
              });
            };
          }).each("end.brush", function() {
            xExtentDomain = extent1.i;
            yExtentDomain = extent1.j;
            event_({
              type: "brush",
              mode: "resize"
            });
            event_({
              type: "brushend"
            });
          });
        } else {
          event_({
            type: "brushstart"
          });
          event_({
            type: "brush",
            mode: "resize"
          });
          event_({
            type: "brushend"
          });
        }
      });
    };
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", xExtent[0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", yExtent[0]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", yExtent[1] - yExtent[0]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), dragRestore = d3_event_dragSuppress(), center, origin = d3.mouse(target), offset;
      var w = d3.select(d3_window).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (d3.event.changedTouches) {
        w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
      } else {
        w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
      }
      g.interrupt().selectAll("*").interrupt();
      if (dragging) {
        origin[0] = xExtent[0] - origin[0];
        origin[1] = yExtent[0] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= xExtent[1];
            origin[1] -= yExtent[1];
            dragging = 2;
          }
          d3_eventPreventDefault();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += xExtent[1];
          origin[1] += yExtent[1];
          dragging = 0;
          d3_eventPreventDefault();
        }
      }
      function brushmove() {
        var point = d3.mouse(target), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];
            origin[0] = xExtent[+(point[0] < center[0])];
            origin[1] = yExtent[+(point[1] < center[1])];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0] != min || extent[1] != max) {
          if (i) yExtentDomain = null; else xExtentDomain = null;
          extent[0] = min;
          extent[1] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        dragRestore();
        event_({
          type: "brushend"
        });
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.clamp = function(z) {
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        if (x) {
          if (xExtentDomain) {
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];
          } else {
            x0 = xExtent[0], x1 = xExtent[1];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          if (yExtentDomain) {
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];
          } else {
            y0 = yExtent[0], y1 = yExtent[1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        xExtentDomain = [ x0, x1 ];
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        yExtentDomain = [ y0, y1 ];
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];
      }
      return brush;
    };
    brush.clear = function() {
      if (!brush.empty()) {
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];
        xExtentDomain = yExtentDomain = null;
      }
      return brush;
    };
    brush.empty = function() {
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
  var d3_time_formatUtc = d3_time_format.utc;
  var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  d3_time.second = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3_time.seconds = d3_time.second.range;
  d3_time.seconds.utc = d3_time.second.utc.range;
  d3_time.minute = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3_time.minutes = d3_time.minute.range;
  d3_time.minutes.utc = d3_time.minute.utc.range;
  d3_time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3_time.hours = d3_time.hour.range;
  d3_time.hours.utc = d3_time.hour.utc.range;
  d3_time.month = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3_time.months = d3_time.month.range;
  d3_time.months.utc = d3_time.month.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    function tickMethod(extent, count) {
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {
        return d / 31536e6;
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
    }
    scale.nice = function(interval, skip) {
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" && tickMethod(extent, interval);
      if (method) interval = method[0], skip = method[1];
      function skipped(date) {
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
      }
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {
        floor: function(date) {
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
          return date;
        },
        ceil: function(date) {
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
          return date;
        }
      } : interval));
    };
    scale.ticks = function(interval, skip) {
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" ? tickMethod(extent, interval) : !interval.range && [ {
        range: interval
      }, skip ];
      if (method) interval = method[0], skip = method[1];
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];
  var d3_time_scaleLocalFormat = d3_time_format.multi([ [ ".%L", function(d) {
    return d.getMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getMinutes();
  } ], [ "%I %p", function(d) {
    return d.getHours();
  } ], [ "%a %d", function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getDate() != 1;
  } ], [ "%B", function(d) {
    return d.getMonth();
  } ], [ "%Y", d3_true ] ]);
  var d3_time_scaleMilliseconds = {
    range: function(start, stop, step) {
      return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate);
    },
    floor: d3_identity,
    ceil: d3_identity
  };
  d3_time_scaleLocalMethods.year = d3_time.year;
  d3_time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([ [ ".%L", function(d) {
    return d.getUTCMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getUTCSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getUTCMinutes();
  } ], [ "%I %p", function(d) {
    return d.getUTCHours();
  } ], [ "%a %d", function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getUTCDate() != 1;
  } ], [ "%B", function(d) {
    return d.getUTCMonth();
  } ], [ "%Y", d3_true ] ]);
  d3_time_scaleUtcMethods.year = d3_time.year.utc;
  d3_time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
  };
  d3.text = d3_xhrType(function(request) {
    return request.responseText;
  });
  d3.json = function(url, callback) {
    return d3_xhr(url, "application/json", d3_json, callback);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3_xhr(url, "text/html", d3_html, callback);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = d3_xhrType(function(request) {
    return request.responseXML;
  });
  if (typeof define === "function" && define.amd) {
    define(d3);
  } else if (typeof module === "object" && module.exports) {
    module.exports = d3;
  } else {
    this.d3 = d3;
  }
}();
},{}],7:[function(require,module,exports){
(function() {
  var slice = [].slice;

  function queue(parallelism) {
    var q,
        tasks = [],
        started = 0, // number of tasks that have been started (and perhaps finished)
        active = 0, // number of tasks currently being executed (started but not finished)
        remaining = 0, // number of tasks not yet finished
        popping, // inside a synchronous task callback?
        error = null,
        await = noop,
        all;

    if (!parallelism) parallelism = Infinity;

    function pop() {
      while (popping = started < tasks.length && active < parallelism) {
        var i = started++,
            t = tasks[i],
            a = slice.call(t, 1);
        a.push(callback(i));
        ++active;
        t[0].apply(null, a);
      }
    }

    function callback(i) {
      return function(e, r) {
        --active;
        if (error != null) return;
        if (e != null) {
          error = e; // ignore new tasks and squelch active callbacks
          started = remaining = NaN; // stop queued tasks from starting
          notify();
        } else {
          tasks[i] = r;
          if (--remaining) popping || pop();
          else notify();
        }
      };
    }

    function notify() {
      if (error != null) await(error);
      else if (all) await(error, tasks);
      else await.apply(null, [error].concat(tasks));
    }

    return q = {
      defer: function() {
        if (!error) {
          tasks.push(arguments);
          ++remaining;
          pop();
        }
        return q;
      },
      await: function(f) {
        await = f;
        all = false;
        if (!remaining) notify();
        return q;
      },
      awaitAll: function(f) {
        await = f;
        all = true;
        if (!remaining) notify();
        return q;
      }
    };
  }

  function noop() {}

  queue.version = "1.0.7";
  if (typeof define === "function" && define.amd) define(function() { return queue; });
  else if (typeof module === "object" && module.exports) module.exports = queue;
  else this.queue = queue;
})();

},{}],8:[function(require,module,exports){
module.exports = flatten;

function flatten(gj, up) {
    switch ((gj && gj.type) || null) {
        case 'FeatureCollection':
            gj.features = gj.features.reduce(function(mem, feature) {
                return mem.concat(flatten(feature));
            }, []);
            return gj;
        case 'Feature':
            return flatten(gj.geometry).map(function(geom) {
                return {
                    type: 'Feature',
                    properties: JSON.parse(JSON.stringify(gj.properties)),
                    geometry: geom
                };
            });
        case 'MultiPoint':
            return gj.coordinates.map(function(_) {
                return { type: 'Point', coordinates: _ };
            });
        case 'MultiPolygon':
            return gj.coordinates.map(function(_) {
                return { type: 'Polygon', coordinates: _ };
            });
        case 'MultiLineString':
            return gj.coordinates.map(function(_) {
                return { type: 'LineString', coordinates: _ };
            });
        case 'GeometryCollection':
            return gj.geometries;
        case 'Point':
        case 'Polygon':
        case 'LineString':
            return [gj];
        default:
            return gj;
    }
}

},{}],9:[function(require,module,exports){
module.exports = normalize;

var types = {
    Point: 'geometry',
    MultiPoint: 'geometry',
    LineString: 'geometry',
    MultiLineString: 'geometry',
    Polygon: 'geometry',
    MultiPolygon: 'geometry',
    GeometryCollection: 'geometry',
    Feature: 'feature',
    FeatureCollection: 'featurecollection'
};

/**
 * Normalize a GeoJSON feature into a FeatureCollection.
 *
 * @param {object} gj geojson data
 * @returns {object} normalized geojson data
 */
function normalize(gj) {
    if (!gj || !gj.type) return null;
    var type = types[gj.type];
    if (!type) return null;

    if (type === 'geometry') {
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {},
                geometry: gj
            }]
        };
    } else if (type === 'feature') {
        return {
            type: 'FeatureCollection',
            features: [gj]
        };
    } else if (type === 'featurecollection') {
        return gj;
    }
}

},{}],10:[function(require,module,exports){
var jsonlint = require('jsonlint-lines');

function hint(str) {

    var errors = [], gj;

    function root(_) {
        if (!_.type) {
            errors.push({
                message: 'The type property is required and was not found',
                line: _.__line__
            });
        } else if (!types[_.type]) {
            errors.push({
                message: 'The type ' + _.type + ' is unknown',
                line: _.__line__
            });
        } else if (_) {
            types[_.type](_);
        }
    }

    function everyIs(_, type) {
        // make a single exception because typeof null === 'object'
        return _.every(function(x) { return (x !== null) && (typeof x === type); });
    }

    function requiredProperty(_, name, type) {
        if (typeof _[name] == 'undefined') {
            return errors.push({
                message: '"' + name + '" property required',
                line: _.__line__
            });
        } else if (type === 'array') {
            if (!Array.isArray(_[name])) {
                return errors.push({
                    message: '"' + name +
                        '" property should be an array, but is an ' +
                        (typeof _[name]) + ' instead',
                    line: _.__line__
                });
            }
        } else if (type && typeof _[name] !== type) {
            return errors.push({
                message: '"' + name +
                    '" property should be ' + (type) +
                    ', but is an ' + (typeof _[name]) + ' instead',
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#feature-collection-objects
    function FeatureCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'features', 'array')) {
            if (!everyIs(_.features, 'object')) {
                return errors.push({
                    message: 'Every feature must be an object',
                    line: _.__line__
                });
            }
            _.features.forEach(Feature);
        }
    }

    // http://geojson.org/geojson-spec.html#positions
    function position(_, line) {
        if (!Array.isArray(_)) {
            return errors.push({
                message: 'position should be an array, is a ' + (typeof _) +
                    ' instead',
                line: _.__line__ || line
            });
        } else {
            if (_.length < 2) {
                return errors.push({
                    message: 'position must have 2 or more elements',
                    line: _.__line__ || line
                });
            }
            if (!everyIs(_, 'number')) {
                return errors.push({
                    message: 'each element in a position must be a number',
                    line: _.__line__ || line
                });
            }
        }
    }

    function positionArray(coords, type, depth, line) {
        if (line === undefined && coords.__line__ !== undefined) {
            line = coords.__line__;
        }
        if (depth === 0) {
            return position(coords, line);
        } else {
            if (depth === 1 && type) {
                if (type === 'LinearRing') {
                    if (coords.length < 4) {
                        errors.push({
                            message: 'a LinearRing of coordinates needs to have four or more positions',
                            line: line
                        });
                    }
                    if (coords.length &&
                        (coords[coords.length - 1].length !== coords[0].length ||
                        !coords[coords.length - 1].every(function(position, index) {
                        return coords[0][index] === position;
                    }))) {
                        errors.push({
                            message: 'the first and last positions in a LinearRing of coordinates must be the same',
                            line: line
                        });
                    }
                } else if (type === 'Line' && coords.length < 2) {
                    errors.push({
                        message: 'a line needs to have two or more coordinates to be valid',
                        line: line
                    });
                }
            }
            if (!Array.isArray(coords)) {
                return errors.push({
                    message: 'coordinates must be list of positions',
                    line: line
                });
            }
            coords.forEach(function(c) {
                positionArray(c, type, depth - 1, c.__line__ || line);
            });
        }
    }

    function crs(_) {
        if (!_.crs) return;
        if (typeof _.crs === 'object') {
            var strErr = requiredProperty(_.crs, 'type', 'string'),
                propErr = requiredProperty(_.crs, 'properties', 'object');
            if (!strErr && !propErr) {
                // http://geojson.org/geojson-spec.html#named-crs
                if (_.crs.type == 'name') {
                    requiredProperty(_.crs.properties, 'name', 'string');
                } else if (_.crs.type == 'link') {
                    requiredProperty(_.crs.properties, 'href', 'string');
                }
            }
        } else {
            errors.push({
                message: 'the value of the crs property must be an object, not a ' + (typeof _.crs),
                line: _.__line__
            });
        }
    }

    function bbox(_) {
        if (!_.bbox) return;
        if (Array.isArray(_.bbox)) {
            if (!everyIs(_.bbox, 'number')) {
                return errors.push({
                    message: 'each element in a bbox property must be a number',
                    line: _.bbox.__line__
                });
            }
        } else {
            errors.push({
                message: 'bbox property must be an array of numbers, but is a ' + (typeof _.bbox),
                line: _.__line__
            });
        }
    }

    // http://geojson.org/geojson-spec.html#point
    function Point(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            position(_.coordinates);
        }
    }

    // http://geojson.org/geojson-spec.html#polygon
    function Polygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'LinearRing', 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipolygon
    function MultiPolygon(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'LinearRing', 3);
        }
    }

    // http://geojson.org/geojson-spec.html#linestring
    function LineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'Line', 1);
        }
    }

    // http://geojson.org/geojson-spec.html#multilinestring
    function MultiLineString(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, 'Line', 2);
        }
    }

    // http://geojson.org/geojson-spec.html#multipoint
    function MultiPoint(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'coordinates', 'array')) {
            positionArray(_.coordinates, '', 1);
        }
    }

    function GeometryCollection(_) {
        crs(_);
        bbox(_);
        if (!requiredProperty(_, 'geometries', 'array')) {
            _.geometries.forEach(function(geometry) {
                if (geometry) root(geometry);
            });
        }
    }

    function Feature(_) {
        crs(_);
        bbox(_);
        if (_.type !== 'Feature') {
            errors.push({
                message: 'GeoJSON features must have a type=feature property',
                line: _.__line__
            });
        }
        requiredProperty(_, 'properties', 'object');
        if (!requiredProperty(_, 'geometry', 'object')) {
            // http://geojson.org/geojson-spec.html#feature-objects
            // tolerate null geometry
            if (_.geometry) root(_.geometry);
        }
    }

    var types = {
        Point: Point,
        Feature: Feature,
        MultiPoint: MultiPoint,
        LineString: LineString,
        MultiLineString: MultiLineString,
        FeatureCollection: FeatureCollection,
        GeometryCollection: GeometryCollection,
        Polygon: Polygon,
        MultiPolygon: MultiPolygon
    };

    if (typeof str !== 'string') {
        return [{
            message: 'Expected string input',
            line: 0
        }];
    }

    try {
        gj = jsonlint.parse(str);
    } catch(e) {
        var match = e.message.match(/line (\d+)/),
            lineNumber = 0;
        if (match) lineNumber = parseInt(match[1], 10);
        return [{
            line: lineNumber - 1,
            message: e.message,
            error: e
        }];
    }

    if (typeof gj !== 'object' ||
        gj === null ||
        gj === undefined) {
        errors.push({
            message: 'The root of a GeoJSON object must be an object.',
            line: 0
        });
        return errors;
    }

    root(gj);

    return errors;
}

module.exports.hint = hint;

},{"jsonlint-lines":11}],11:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.6 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var jsonlint = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"JSONString":3,"STRING":4,"JSONNumber":5,"NUMBER":6,"JSONNullLiteral":7,"NULL":8,"JSONBooleanLiteral":9,"TRUE":10,"FALSE":11,"JSONText":12,"JSONValue":13,"EOF":14,"JSONObject":15,"JSONArray":16,"{":17,"}":18,"JSONMemberList":19,"JSONMember":20,":":21,",":22,"[":23,"]":24,"JSONElementList":25,"$accept":0,"$end":1},
terminals_: {2:"error",4:"STRING",6:"NUMBER",8:"NULL",10:"TRUE",11:"FALSE",14:"EOF",17:"{",18:"}",21:":",22:",",23:"[",24:"]"},
productions_: [0,[3,1],[5,1],[7,1],[9,1],[9,1],[12,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[15,2],[15,3],[20,3],[19,1],[19,3],[16,2],[16,3],[25,1],[25,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1: // replace escaped characters with actual character
          this.$ = yytext.replace(/\\(\\|")/g, "$"+"1")
                     .replace(/\\n/g,'\n')
                     .replace(/\\r/g,'\r')
                     .replace(/\\t/g,'\t')
                     .replace(/\\v/g,'\v')
                     .replace(/\\f/g,'\f')
                     .replace(/\\b/g,'\b');
        
break;
case 2:this.$ = Number(yytext);
break;
case 3:this.$ = null;
break;
case 4:this.$ = true;
break;
case 5:this.$ = false;
break;
case 6:return this.$ = $$[$0-1];
break;
case 13:this.$ = {}; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 14:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 15:this.$ = [$$[$0-2], $$[$0]];
break;
case 16:this.$ = {}; this.$[$$[$0][0]] = $$[$0][1];
break;
case 17:this.$ = $$[$0-2]; $$[$0-2][$$[$0][0]] = $$[$0][1];
break;
case 18:this.$ = []; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 19:this.$ = $$[$0-1]; Object.defineProperty(this.$, '__line__', {
            value: this._$.first_line,
            enumerable: false
        })
break;
case 20:this.$ = [$$[$0]];
break;
case 21:this.$ = $$[$0-2]; $$[$0-2].push($$[$0]);
break;
}
},
table: [{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],12:1,13:2,15:7,16:8,17:[1,14],23:[1,15]},{1:[3]},{14:[1,16]},{14:[2,7],18:[2,7],22:[2,7],24:[2,7]},{14:[2,8],18:[2,8],22:[2,8],24:[2,8]},{14:[2,9],18:[2,9],22:[2,9],24:[2,9]},{14:[2,10],18:[2,10],22:[2,10],24:[2,10]},{14:[2,11],18:[2,11],22:[2,11],24:[2,11]},{14:[2,12],18:[2,12],22:[2,12],24:[2,12]},{14:[2,3],18:[2,3],22:[2,3],24:[2,3]},{14:[2,4],18:[2,4],22:[2,4],24:[2,4]},{14:[2,5],18:[2,5],22:[2,5],24:[2,5]},{14:[2,1],18:[2,1],21:[2,1],22:[2,1],24:[2,1]},{14:[2,2],18:[2,2],22:[2,2],24:[2,2]},{3:20,4:[1,12],18:[1,17],19:18,20:19},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:23,15:7,16:8,17:[1,14],23:[1,15],24:[1,21],25:22},{1:[2,6]},{14:[2,13],18:[2,13],22:[2,13],24:[2,13]},{18:[1,24],22:[1,25]},{18:[2,16],22:[2,16]},{21:[1,26]},{14:[2,18],18:[2,18],22:[2,18],24:[2,18]},{22:[1,28],24:[1,27]},{22:[2,20],24:[2,20]},{14:[2,14],18:[2,14],22:[2,14],24:[2,14]},{3:20,4:[1,12],20:29},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:30,15:7,16:8,17:[1,14],23:[1,15]},{14:[2,19],18:[2,19],22:[2,19],24:[2,19]},{3:5,4:[1,12],5:6,6:[1,13],7:3,8:[1,9],9:4,10:[1,10],11:[1,11],13:31,15:7,16:8,17:[1,14],23:[1,15]},{18:[2,17],22:[2,17]},{18:[2,15],22:[2,15]},{22:[2,21],24:[2,21]}],
defaultActions: {16:[2,6]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.2.1 */
var lexer = (function(){
var lexer = {

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input) {
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:return 6
break;
case 2:yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2); return 4
break;
case 3:return 17
break;
case 4:return 18
break;
case 5:return 23
break;
case 6:return 24
break;
case 7:return 22
break;
case 8:return 21
break;
case 9:return 10
break;
case 10:return 11
break;
case 11:return 8
break;
case 12:return 14
break;
case 13:return 'INVALID'
break;
}
},
rules: [/^(?:\s+)/,/^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,/^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,/^(?:\{)/,/^(?:\})/,/^(?:\[)/,/^(?:\])/,/^(?:,)/,/^(?::)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:null\b)/,/^(?:$)/,/^(?:.)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13],"inclusive":true}}
};
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = jsonlint;
exports.Parser = jsonlint.Parser;
exports.parse = function () { return jsonlint.parse.apply(jsonlint, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require("q+64fw"))
},{"fs":33,"path":35,"q+64fw":36}],12:[function(require,module,exports){
module.exports = element;
module.exports.pair = pair;
module.exports.format = format;
module.exports.formatPair = formatPair;

function element(x, dims) {
    return search(x, dims).val;
}

function formatPair(x) {
    return format(x.lat, 'lat') + ' ' + format(x.lon, 'lon');
}

// Is 0 North or South?
function format(x, dim) {
    var dirs = {
            lat: ['N', 'S'],
            lon: ['E', 'W']
        }[dim] || '',
        dir = dirs[x >= 0 ? 0 : 1],
        abs = Math.abs(x),
        whole = Math.floor(abs),
        fraction = abs - whole,
        fractionMinutes = fraction * 60,
        minutes = Math.floor(fractionMinutes),
        seconds = Math.floor((fractionMinutes - minutes) * 60);

    return whole + 'Â° ' +
        (minutes ? minutes + "' " : '') +
        (seconds ? seconds + '" ' : '') + dir;
}

function search(x, dims, r) {
    if (!dims) dims = 'NSEW';
    if (typeof x !== 'string') return { val: null, regex: r };
    r = r || /[\s\,]*([\-|\â€”|\â€•]?[0-9.]+)Â°? *(?:([0-9.]+)['â€™â€²â€˜] *)?(?:([0-9.]+)(?:''|"|â€|â€³) *)?([NSEW])?/gi;
    var m = r.exec(x);
    if (!m) return { val: null, regex: r };
    else if (m[4] && dims.indexOf(m[4]) === -1) return { val: null, regex: r };
    else return {
        val: (((m[1]) ? parseFloat(m[1]) : 0) +
            ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
            ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
            ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1),
        regex: r,
        raw: m[0],
        dim: m[4]
    };
}

function pair(x, dims) {
    x = x.trim();
    var one = search(x, dims);
    if (one.val === null) return null;
    var two = search(x, dims, one.regex);
    if (two.val === null) return null;
    // null if one/two are not contiguous.
    if (one.raw + two.raw !== x) return null;
    if (one.dim) return swapdim(one.val, two.val, one.dim);
    else return [one.val, two.val];
}

function swapdim(a, b, dim) {
    if (dim == 'N' || dim == 'S') return [a, b];
    if (dim == 'W' || dim == 'E') return [b, a];
}

},{}],13:[function(require,module,exports){
(function (process){
toGeoJSON = (function() {
    'use strict';

    var removeSpace = (/\s*/g),
        trimSpace = (/^\s*|\s*$/g),
        splitSpace = (/\s+/);
    // generate a short, numeric hash of a string
    function okhash(x) {
        if (!x || !x.length) return 0;
        for (var i = 0, h = 0; i < x.length; i++) {
            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
        } return h;
    }
    // all Y children of X
    function get(x, y) { return x.getElementsByTagName(y); }
    function attr(x, y) { return x.getAttribute(y); }
    function attrf(x, y) { return parseFloat(attr(x, y)); }
    // one Y child of X, if any, otherwise null
    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
    // cast array x into numbers
    function numarray(x) {
        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
        return o;
    }
    function clean(x) {
        var o = {};
        for (var i in x) if (x[i]) o[i] = x[i];
        return o;
    }
    // get the content of a text node, if any
    function nodeVal(x) { if (x) {norm(x);} return x && x.firstChild && x.firstChild.nodeValue; }
    // get one coordinate from a coordinate array, if any
    function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
    // get all coordinates from a coordinate array as [[],[]]
    function coord(v) {
        var coords = v.replace(trimSpace, '').split(splitSpace),
            o = [];
        for (var i = 0; i < coords.length; i++) {
            o.push(coord1(coords[i]));
        }
        return o;
    }
    function coordPair(x) { return [attrf(x, 'lon'), attrf(x, 'lat')]; }

    // create a new feature collection parent object
    function fc() {
        return {
            type: 'FeatureCollection',
            features: []
        };
    }

    var serializer;
    if (typeof XMLSerializer !== 'undefined') {
        serializer = new XMLSerializer();
    // only require xmldom in a node environment
    } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
        serializer = new (require('xmldom').XMLSerializer)();
    }
    function xml2str(str) { return serializer.serializeToString(str); }

    var t = {
        kml: function(doc, o) {
            o = o || {};

            var gj = fc(),
                // styleindex keeps track of hashed styles in order to match features
                styleIndex = {},
                // atomic geospatial types supported by KML - MultiGeometry is
                // handled separately
                geotypes = ['Polygon', 'LineString', 'Point', 'Track'],
                // all root placemarks in the file
                placemarks = get(doc, 'Placemark'),
                styles = get(doc, 'Style');

            for (var k = 0; k < styles.length; k++) {
                styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
            }
            for (var j = 0; j < placemarks.length; j++) {
                gj.features = gj.features.concat(getPlacemark(placemarks[j]));
            }
            function gxCoord(v) { return numarray(v.split(' ')); }
            function gxCoords(root) {
                var elems = get(root, 'coord', 'gx'), coords = [];
                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                return coords;
            }
            function getGeometry(root) {
                var geomNode, geomNodes, i, j, k, geoms = [];
                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                for (i = 0; i < geotypes.length; i++) {
                    geomNodes = get(root, geotypes[i]);
                    if (geomNodes) {
                        for (j = 0; j < geomNodes.length; j++) {
                            geomNode = geomNodes[j];
                            if (geotypes[i] == 'Point') {
                                geoms.push({
                                    type: 'Point',
                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'LineString') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                });
                            } else if (geotypes[i] == 'Polygon') {
                                var rings = get(geomNode, 'LinearRing'),
                                    coords = [];
                                for (k = 0; k < rings.length; k++) {
                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                }
                                geoms.push({
                                    type: 'Polygon',
                                    coordinates: coords
                                });
                            } else if (geotypes[i] == 'Track') {
                                geoms.push({
                                    type: 'LineString',
                                    coordinates: gxCoords(geomNode)
                                });
                            }
                        }
                    }
                }
                return geoms;
            }
            function getPlacemark(root) {
                var geoms = getGeometry(root), i, properties = {},
                    name = nodeVal(get1(root, 'name')),
                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                    description = nodeVal(get1(root, 'description')),
                    extendedData = get1(root, 'ExtendedData');

                if (!geoms.length) return [];
                if (name) properties.name = name;
                if (styleUrl && styleIndex[styleUrl]) {
                    properties.styleUrl = styleUrl;
                    properties.styleHash = styleIndex[styleUrl];
                }
                if (description) properties.description = description;
                if (extendedData) {
                    var datas = get(extendedData, 'Data'),
                        simpleDatas = get(extendedData, 'SimpleData');

                    for (i = 0; i < datas.length; i++) {
                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                    }
                    for (i = 0; i < simpleDatas.length; i++) {
                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                    }
                }
                return [{
                    type: 'Feature',
                    geometry: (geoms.length === 1) ? geoms[0] : {
                        type: 'GeometryCollection',
                        geometries: geoms
                    },
                    properties: properties
                }];
            }
            return gj;
        },
        gpx: function(doc, o) {
            var i,
                tracks = get(doc, 'trk'),
                routes = get(doc, 'rte'),
                waypoints = get(doc, 'wpt'),
                // a feature collection
                gj = fc();
            for (i = 0; i < tracks.length; i++) {
                gj.features.push(getLinestring(tracks[i], 'trkpt'));
            }
            for (i = 0; i < routes.length; i++) {
                gj.features.push(getLinestring(routes[i], 'rtept'));
            }
            for (i = 0; i < waypoints.length; i++) {
                gj.features.push(getPoint(waypoints[i]));
            }
            function getLinestring(node, pointname) {
                var j, pts = get(node, pointname), line = [];
                for (j = 0; j < pts.length; j++) {
                    line.push(coordPair(pts[j]));
                }
                return {
                    type: 'Feature',
                    properties: getProperties(node),
                    geometry: {
                        type: 'LineString',
                        coordinates: line
                    }
                };
            }
            function getPoint(node) {
                var prop = getProperties(node);
                prop.ele = nodeVal(get1(node, 'ele'));
                prop.sym = nodeVal(get1(node, 'sym'));
                return {
                    type: 'Feature',
                    properties: prop,
                    geometry: {
                        type: 'Point',
                        coordinates: coordPair(node)
                    }
                };
            }
            function getProperties(node) {
                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                            'time', 'keywords'],
                    prop = {},
                    k;
                for (k = 0; k < meta.length; k++) {
                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                }
                return clean(prop);
            }
            return gj;
        }
    };
    return t;
})();

if (typeof module !== 'undefined') module.exports = toGeoJSON;

}).call(this,require("q+64fw"))
},{"q+64fw":36,"xmldom":34}],14:[function(require,module,exports){
var Place = require('./lib/draw.place.js'),
    Point = require('./lib/draw.point.js'),
    fs = require('fs');

var templates = {
    map_tip_message: _("<div class='small pad1x clearfix truncate'>\n  <span class='inline icon info pad1y'><%=obj.message%></span>\n  <% if (!obj.noclose) { %>\n  <a id='cancel-tip' href='#browse' class='pin-right unround button quiet icon close pad1 inline'>Cancel</a>\n  <% } %>\n</div>\n").template()
};

module.exports = function(App, markers, editor) {

    var exports = {};

    exports.mode = null;

    exports.handlers = {
        place: Place(App, editor.map),
        point: Point(editor.map),
        polygon: new L.Draw.Polygon(editor.map),
        linestring: new L.Draw.Polyline(editor.map, {
            showLength: false
        })
    };

    editor.map.on('place:created', addAndEdit)
        .on('point:created', addAndEdit)
        .on('draw:created', addAndEdit)
        .on('draw:edited', update)
        .on('draw:deleted', update);

    exports.onhashchange = function() {
        if (window.location.hash === '#app') exports.clear();
    };

    exports.activate = function(type, editing) {
        exports.handlers.point.disable();
        exports.handlers.polygon.disable();
        exports.handlers.linestring.disable();
        exports.handlers.place.disable();
        hideHint();

        type = type || 'browse';
        $('.draw-controls a.active').removeClass('active');
        $('a#draw-' + type).addClass('active');

        if (type === 'menu') {
            $('#data').addClass('mode-menu');
        } else {
            $('#data').removeClass('mode-menu');
        }

        if (editing) {
            $('#data').addClass('mode-edit');
        } else {
            $('#data').removeClass('mode-edit');
            markers.clear();
            if (type === 'polygon') {
                showHint('Click first point to close this polygon.');
                exports.handlers.polygon.enable();
            } else if (type === 'linestring') {
                showHint('Click last point to finish the line.');
                exports.handlers.linestring.enable();
            } else if (type === 'point') {
                showHint('Click anywhere on the map to place a point.');
                exports.handlers.point.enable();
            } else if (type === 'browse') {
                showHint("Draw or <a href='#' class='marker-import-manual'>import</a> .geojson, .csv, .kml, or .gpx files.", true);
                exports.handlers.place.disable();
            }
        }
        exports.mode = type;
    };

    // Wrapper around exports.activate that resets to default draw state.
    exports.clear = function() {
        exports.activate('browse');
    };

    markers.on('del', onDel);
    markers.on('edit', exports.activate);

    // Explicitly trigger a place being created.
    exports.place = function(ev) {
        exports.activate('browse');
        exports.handlers.place.popup(ev);
    };

    function update(e) {
        editor.changed();
    }

    function addAndEdit(e) {
        var feature = markers.addFeature(
            markers.initializeFeature(e.layer.toGeoJSON()));
        markers.highlightFeature(feature);
        markers.syncUI();
        analytics.track('Drew a ' + feature.geometry.type);
        markers.edit(feature.properties.id, false);
        // Disable redraw for now which is conceptually wonky in sequence
        // with edit form being non-persistent.
        // hideHint();
        // setTimeout(function() {
        //     exports.activate(mode);
        // }, 10);
    }

    function showHint(msg, noclose) {
        $('#marker-help').addClass('active');
        $('#marker-help').html(templates.map_tip_message({
            message: msg,
            noclose: noclose
        }));
    }

    function hideHint() {
        $('#marker-help').removeClass('active');
    }

    // on marker deletion
    function onDel() {
        exports.activate(exports.mode);
    }


    // Initialize.
    exports.clear();

    return exports;
};

},{"./lib/draw.place.js":21,"./lib/draw.point.js":22,"fs":33}],15:[function(require,module,exports){
var toGeoJSON = require('togeojson'),
    geojsonFlatten = require('geojson-flatten'),
    csv2geojson = require('csv2geojson'),
    geojsonNormalize = require('geojson-normalize'),
    geocode = require('geocode-many'),
    fs = require('fs');

var templates = {
    propertyassign: _("<div id='import' class='modal-popup limiter'>\n  <div class='col8 modal-body fill-white contain'>\n    <a href='#close' class='quiet pad1 icon fr close'></a>\n    <div class='pad2y pad4x center'>\n      <h2>Import features</h2>\n    </div>\n    <div class='space-bottom2 clearfix'>\n      <div class='col10 margin1'>\n        <% var popupProperties = [{\n            name: 'title',\n            help: 'Choose an imported property to give each feature a popup title.'\n          }, {\n            name: 'description',\n            help: 'Choose an imported property to give each feature a popup description.'\n        }]; %>\n        <div class='tabs col12 space-bottom clearfix'>\n          <% if (allpoints) { %>\n            <% if (!geojson) { %>\n              <a href='#active1' class='active col6'>Style</a>\n              <a href='#active2' class='col6'>Symbol</a>\n            <% } else { %>\n              <a href='#active1' class='active col3'>Title</a>\n              <a href='#active2' class='col3'>Description</a>\n              <a href='#active3' class='col3'>Style</a>\n              <a href='#active4' class='col3'>Symbol</a>\n            <% } %>\n          <% } else { %>\n            <a href='#active1' class='active col6'>Title</a>\n            <a href='#active2' class='col6'>Description</a>\n          <% } %>\n        </div>\n\n        <div class='property-panes sliding h active1 col12 row5 clip contain'>\n          <% if (geojson) { %>\n            <% _(popupProperties).each(function(field) { %>\n            <div class='col12 animate'>\n              <div class='col12 scroll-v round keyline-all row4'>\n                <% _(_(obj.geojson).pairs()).each(function(f, i) { %>\n                <input id='<%= field.name %>-<%= f[0] %>' class='label-select' data-geojson='<%= field.name %>.<%= f[0] %>' type='radio' name='<%= field.name %>' value='<%= f[0] %>' <% if (f[0].toLowerCase().replace(/\\s/g, '') === field.name) { %>checked=true<% } %> />\n                <label class='col12 truncate <% if (i !== 0) { %>keyline-top<% } %> pad1y pad2x row1' for='<%= field.name %>-<%= f[0] %>'>\n                  <%= f[0].replace(/<[^<]+>/g, '').trim() %>\n                  <% if (f[1]) { %>\n                    <% var example = (typeof f[1] === 'string') ? f[1].replace(/<[^<]+>/g, '').trim() : f[1]; %>\n                    <em class='small quiet'>(<%= example %>)</em>\n                  <% } %>\n                </label>\n                <% }); %>\n              </div>\n              <div class='center pad1y'>\n                <p><%= field.help %></p>\n              </div>\n            </div>\n            <% }); %>\n          <% } %>\n\n          <% if (allpoints) { %>\n            <div class='col12 animate'>\n              <div class='fill-darken0 pad1'>\n                <% print(obj.style_template(_({\n                    context: 'import'\n                  }).defaults({ properties: obj.markerDefaults })));\n                %>\n              </div>\n              <div class='center pad1y'>\n                <p>Style each imported marker with a size &amp; color.</p>\n              </div>\n            </div>\n            <div class='col12 animate'>\n              <% print(obj.symbol_template(_({\n                  context: 'import'\n                }).defaults({ properties: obj.markerDefaults }))); %>\n              <div class='center pad1y'>\n                <p>Provide each imported marker with a symbol icon.</p>\n              </div>\n            </div>\n          <% } %>\n        </div>\n      </div>\n    </div>\n    <div class='clearfix fill-gray pad2y'>\n      <a href='#' id='import-assign' class='col6 margin3 button icon up'>Finish importing</a>\n    </div>\n  </div>\n</div>\n").template(),
    autogeocode: _("<div id='geocode' class='modal-popup limiter'>\n  <div class='col8 modal-body fill-white contain'>\n    <a href='#close' class='quiet pad1 icon fr close'></a>\n\n    <div class='processing hidden'>\n      <div class='pad2y pad4x center'>\n        <h2>Geocoding</h2>\n      </div>\n      <div class='pad2y clearfix fill-light'>\n        <div class='col10 margin1'>\n          <div class='progress round-top fill-white pad0 contain round'>\n            <div class='fill fill-blue pin-left round'></div>\n          </div>\n          <div class='center pad0y'>\n            <span class='percent quiet'>0</span>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <div class='setup'>\n      <div class='pad2y pad4x center'>\n        <h2>Choose fields to geocode</h2>\n      </div>\n      <div class='space-bottom2 clearfix'>\n        <div class='col10 margin1'>\n          <div class='col12 row4 clip contain'>\n            <div class='col12 scroll-v round keyline-all row4'>\n            <% _(_(obj.csv).pairs()).each(function(f, i) { %>\n              <input id='name-<%= f[0] %>' class='label-select' data-query='<%= f[0] %>' type='checkbox' name='column-name' value='<%= f[0] %>' <% if (f[0].toLowerCase().replace(/\\s/g, '') === 'address') { %>checked=true<% } %> />\n              <label class='col12 truncate <% if (i !== 0) { %>keyline-top<% } %> pad1y pad2x row1' for='name-<%= f[0] %>'>\n                <%= f[0].replace(/<[^<]+>/g, '').trim() %>\n                <% if (f[1]) { %>\n                  <% var example = (typeof f[1] === 'string') ? f[1].replace(/<[^<]+>/g, '').trim() : f[1]; %>\n                  <em class='small quiet'>(<%= example %>)</em>\n                <% } %>\n              </label> \n            <% }); %>\n            </div>\n          </div>\n          <div class='center pad1y'>\n            <p>Select one or more fields with address data in your csv to help geocode.</p>\n          </div>\n        </div>\n      </div>\n      <div class='clearfix fill-gray pad2y'>\n        <a href='#' id='geocode-submit' class='col6 margin3 button rcon next'>Geocode data</a>\n      </div>\n    </div>\n  </div>\n</div>\n").template(),
    symbol: _("<div class='pager js-tabs pad1 pill pin-right'>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big up round-top quiet'></a>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big down round-bottom quiet'></a>\n</div>\n<div id='marker-edit-symbol-pages' class='marker-edit-symbol sliding v active1 clip row4'>\n  <%\n  if (!window.MakiFull) {\n    var icons = window.Maki.slice(0);\n    icons.unshift({ alpha:true, icon:'' });\n    icons = icons.concat(_(10).chain().range().map(function(v) { return { alpha:true, icon:v } }).value());\n    icons = icons.concat(_(26).chain().range().map(function(v) { return { alpha:true, icon:String.fromCharCode(97 + v) } }).value());\n    window.MakiFull = icons;\n  }\n  _(window.MakiFull).chain()\n  .filter(function(icon) { return !icon.tags || icon.tags.indexOf('deprecated') === -1 })\n  .groupBy(function(icon, i) {\n    return Math.floor(i/60);\n  })\n  .each(function(group, i) { %>\n    <div class='animate col12 clearfix row5'>\n    <% _(group).each(function(icon) { %>\n        <input id='<%= context %>-marker-symbol-<%=icon.icon%>' class='label-select' data-geojson='marker-symbol.<%= icon.icon %>' type='radio' name='marker-symbol' value='<%=icon.icon%>' <%= obj['marker-symbol'] === icon.icon ? 'checked' : '' %> />\n      <% if (icon.alpha) { %>\n      <label for='<%= context %>-marker-symbol-<%=icon.icon%>' class='col1 symbol center round'><span class='maki-icon strong alpha'><%=icon.icon%></span></label>\n      <% } else { %>\n      <label for='<%= context %>-marker-symbol-<%=icon.icon%>' class='col1 symbol center round' title='<%=icon.name%>'><span class='maki-icon <%=icon.icon%>'></span></label>\n      <% } %>\n    <% }); %>\n  </div>\n  <% }); %>\n</div>\n").template(),
    style: _("<div class='clearfix space-bottom js-tabs pill'><!--\n--><input id='<%= context %>-marker-size-small' class='label-select' data-geojson='marker-size.small' type='radio' name='marker-size' value='small' <%= obj.properties['marker-size'] === 'small' ? 'checked' : '' %> /><!--\n--><label for='<%= context %>-marker-size-small' class='col3 button'>Small</label><!--\n--><input id='<%= context %>-marker-size-medium' class='label-select' data-geojson='marker-size.medium' type='radio' name='marker-size' value='medium' <%= obj.properties['marker-size'] === 'medium' ? 'checked' : '' %> /><!--\n--><label for='<%= context %>-marker-size-medium' class='col3 button'>Medium</label><!--\n--><input id='<%= context %>-marker-size-large' class='label-select' data-geojson='marker-size.large' type='radio' name='marker-size' value='large' <%= obj.properties['marker-size'] === 'large' ? 'checked' : '' %> /><!--\n--><label for='<%= context %>-marker-size-large' class='col3 button'>Large</label>\n  <div class='col3 row1 style-input-wrapper'>\n    <input id='marker-color' name='marker-color' type='text' class='small center code col12 row1 js-noTabExit color-hex' maxlength='7' style=\"padding: 10px 5px;\" <%= obj.properties['marker-color'] ? ' placeholder=\"' + obj.properties['marker-color'] + '\"' : 'placeholder=\"#7d7d7d\"' %> />\n  </div>\n</div>\n<div class='clearfix clip round'>\n  <% _(App.colors).each(function(color) { %>\n  <input id='<%= context %>-marker-color-<%=color%>' class='label-select' type='radio' data-geojson='marker-color.<%= color %>' name='marker-color' value='#<%=color%>' <%= obj.properties['marker-color'] === '#' + color ? 'checked' : '' %> />\n  <label for='<%= context %>-marker-color-<%=color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%=color%>'></label>\n  <% }); %>\n</div>\n").template()
};

exports.mapDragEnter = function(ev) {
    ev.originalEvent.dataTransfer.dropEffect = 'copy';
    ev.preventDefault();
    ev.stopPropagation();
    this.dropzone.toggleClass('active', true);
};

exports.mapDragLeave = function(ev) {
    ev.originalEvent.dataTransfer.dropEffect = 'copy';
    ev.preventDefault();
    ev.stopPropagation();
    this.dropzone.toggleClass('active', false);
};

exports.mapDrop = function(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    var event = ev.originalEvent;
    var view = this;
    var manual = $(ev.currentTarget).val();

    if (manual || event.dataTransfer &&
        event.dataTransfer.files && event.dataTransfer.files.length) {
        var file = (event.dataTransfer) ?
        event.dataTransfer.files[0] :
        ev.currentTarget.files[0];
        this.dropzone.toggleClass('active loading', true);
        handleFile(file, done);
    } else {
        done('No files were dropped');
    }

    function done(err, geojson) {
        view.dropzone.toggleClass('active loading', false);
        if (err && err.code != 'closed') return Views.modal.show('err', { message: err });
        if (geojson) return view.markers.concat(geojson);
    }
};

exports.handleFile = handleFile;

function handleFile(file, cb) {
    switch (detectType(file)) {
        case 'geojson':
            readGeoJSON(file, cb);
            analytics.track('supported drop', {
                type: 'geojson'
            });
            break;
        case 'kml':
            readKML(file, cb);
            analytics.track('supported drop', {
                type: 'kml'
            });
            break;
        case 'dsv':
            readDSV(file, cb);
            analytics.track('supported drop', {
                type: 'csv'
            });
            break;
        case 'gpx':
            readGPX(file, cb);
            analytics.track('supported drop', {
                type: 'gpx'
            });
            break;
        case 'shp':
        case 'zip':
        case 'shx':
        case 'dbf':
        case 'qpj':
        case 'prj':
            analytics.track('unsupported drop', {
                type: otherType(file)
            });
            return cb('File type ' + otherType(file) +
                ' is unsupported.<div class="pad2y">Uploading a shapefile?' +
                'Try using <a href="http://www.shpescape.com/" target="_blank">Shape Escape</a> to convert your data to another format before uploading.</div><small class="quiet">Supported formats: .geojson, .csv, .kml, or .gpx</small>');
        default:
            analytics.track('unsupported drop', {
                type: otherType(file)
            });
            return cb('File type ' + otherType(file) + ' is unsupported.');
    }
}

function detectType(f) {
    var filename = f.name ? f.name.toLowerCase() : '';
    function ext(_) {
        return filename.indexOf(_) !== -1;
    }
    if (f.type === 'application/vnd.google-earth.kml+xml' || ext('.kml')) {
        return 'kml';
    }
    if (ext('.gpx')) return 'gpx';
    if (ext('.geojson') || ext('.json') || ext('.topojson')) return 'geojson';
    if (f.type === 'text/csv' || ext('.csv') || ext('.tsv') || ext('.dsv')) {
        return 'dsv';
    }
    if (ext('.xml') || ext('.osm')) return 'xml';
}

function otherType(f) {
    var filename = f.name ? f.name.toLowerCase() : '',
        pts = filename.split('.');
    if (pts.length > 1) return pts[pts.length - 1];
    else return 'unknown';
}

function readAsText(f, callback) {
    try {
        var reader = new FileReader();
        reader.readAsText(f);
        reader.onload = function(e) {
            if (e.target && e.target.result) callback(null, e.target.result);
            else callback({
                message: 'Dropped file could not be loaded'
            });
        };
        reader.onerror = function(e) {
            callback({
                message: 'Dropped file was unreadable'
            });
        };
    } catch (e) {
        callback({
            message: 'Dropped file was unreadable'
        });
    }
}

function showModal(geojson, callback) {
    if (geojson.features &&
        geojson.features.length &&
        'properties' in geojson.features[0]) {

        var noprops = _(geojson.features[0].properties).isEmpty();
        var allpoints = geojson.features.every(function(f) {
            return f && f.geometry && f.geometry.type === 'Point';
        });

        if (noprops && !allpoints) {
            callback(null, geojson);
        } else {
            Views.modal.show('propertyassign', {
                template: templates.propertyassign,
                symbol_template: templates.symbol,
                style_template: templates.style,
                geojson: (noprops) ? undefined : geojson.features[0].properties,
                allpoints: allpoints,
                markerDefaults: {
                    title: '',
                    description: ''
                }
            }, function(err, res) {
                if (err) return callback(err, res);
                if (res) {
                    Views.modal.done('propertyassign');
                    callback(null, assignProps(geojson, res));
                }
            });
        }
    } else {
        return callback('Could not parse file to build a .geojson document.');
    }
}

function assignProps(geojson, props) {
    geojson.features.forEach(function(f) {
        f.properties.title = (props.title) ?
            f.properties[props.title] : '';
        f.properties.description = (props.description) ?
            f.properties[props.description] : '';
        f.properties['marker-color'] = (props['marker-color']) ?
            props['marker-color'] : '';
        f.properties['marker-size'] = (props['marker-size']) ?
            props['marker-size'] : '';
        f.properties['marker-symbol'] = (props['marker-symbol']) ?
            props['marker-symbol'] : '';
    });
    return geojson;
}

function readKML(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        var kmldom = toDom(res),
            geojson = toGeoJSON.kml(kmldom);
        if (geojson) {
            geojson = geojsonFlatten(geojson);
            geojson.features.forEach(renameTitle);
            showModal(geojson, cb);
        } else {
            return cb('Could not read dropped KML');
        }
    });
}

function readDSV(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        csv2geojson.csv2geojson(res, function(err, geojson) {
            if (geojson) {
                showModal(geojson, cb);
            } else {
                if (err.message === 'Latitude and longitude fields not present') {
                    if (!App.param('id')) return cb ('Save your map first to upload data that requires geocoding.');
                    if (err.data.length > App.user.plan.geometries) return cb('The maximum number of features you can upload to your account is ' + App.user.plan.geometries);
                    // Attempt to geocode.
                    var data = err.data;
                    geocodeDSV(data, function(err, res) {
                        if (err) return cb('There was an error geocoding the data.');
                        if (res) {
                            showModal(res, cb);
                        }
                    });
                } else {
                    return cb('Could not read dropped CSV');
                }
            }
        });
    });
}

function geocodeDSV(data, cb) {
    Views.modal.show('autogeocode', {
        template: templates.autogeocode,
        csv: data[0]
    }, function(err, res) {
        if (err) return cb('No fields were selected to geocode.');
        if (res) {
            var queries = [];
            _(data).each(function(d) {
                var query = [];
                for (var k in d) if (res.indexOf(k) > -1) query.push(d[k]);
                queries.push({
                    name: query.join(', ')
                });
            });

            var geocoder = geocode(App.param('id'), 0);
            geocoder(queries, transform, progress, complete);
            Views.modal.modals.autogeocode.el.find('.processing')
                .removeClass('hidden')
                .addClass('active');
        }
    });

    function transform(obj) { return obj.name; }
    function progress(e) {
        var $this = Views.modal.modals.autogeocode.el;
        var ratio = 100 / e.todo;
        var percent = parseInt((e.done * ratio), 10);
        $this.find('.fill').css('width', percent + '%');
        $this.find('.percent').text(percent);
    }

    function complete(err, res) {
        if (res) {
            var geojson = {
                type: 'FeatureCollection',
                features: []
            };

            _(data).each(function(d, i) {
                // Handle err here:
                var lng = (res[i].longitude) ? res[i].longitude : 0;
                var lat = (res[i].latitude) ? res[i].latitude : 0;

                geojson.features.push({
                    geometry: {
                        coordinates: [lng, lat],
                        type: 'Point'
                    },
                    properties: d,
                    type: 'Feature'
                });
            });

            Views.modal.done('autogeocode');
            return cb(null, geojson);
        }
    }
}

function readGPX(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        var gpxdom = toDom(res),
            geojson = toGeoJSON.gpx(gpxdom);

        if (geojson) {
            geojson = geojsonFlatten(geojson);
            geojson.features.forEach(renameTitle);
            showModal(geojson, cb);
        } else {
            return cb('Could not read dropped GPX');
        }
    });
}

function readGeoJSON(file, cb) {
    readAsText(file, function(err, res) {
        if (err) return cb(err.message);
        try {
            var geojson = geojsonNormalize(JSON.parse(res));
            geojson = geojsonFlatten(geojson);
            if (geojson) {
                showModal(geojson, cb);
            } else {
                return cb('Could not read dropped GeoJSON');
            }
        } catch(e) {
            // invalid GeoJSON
            return cb('Could not read dropped GeoJSON: invalid JSON');
        }
    });
}

function renameTitle(f) {
    if (f.properties.name) f.properties.title = f.properties.name;
}

function toDom(x) {
    return (new DOMParser()).parseFromString(x, 'text/xml');
}

},{"csv2geojson":2,"fs":33,"geocode-many":5,"geojson-flatten":8,"geojson-normalize":9,"togeojson":13}],16:[function(require,module,exports){
var sexagesimal = require('sexagesimal'),
    fs = require('fs');

var templates = {
    results: _("<% if (obj.length) _(obj.slice(0,5)).each(function(r, idx) { %>\n<% var name = r.place_name.split(',')[0] || [\n    Math.abs(r.center[1]).toFixed(4) + '&deg;' + (r.center[1] >= 0 ? 'N' : 'S'),\n    Math.abs(r.center[0]).toFixed(4) + '&deg;' + (r.center[0] >= 0 ? 'E' : 'W')\n].join(', '); %>\n<% var place = _(r.context).chain().filter(function(v) { return v.id.indexOf('postcode') !== 0; }).pluck('text').value().join(', '); %>\n<input id='search-result-<%=idx%>' class='label-select' type='radio' name='search-result' value='<%=idx%>' <%= !idx ? 'checked' : '' %>/>\n<label for='search-result-<%=idx%>' class='keyline-left keyline-right block truncate pad1y pad4x fill-light keyline-bottom contain row1'>\n  <span class='pin-left pad1y pad1x'><span class='maki-icon <%=r.properties.maki || 'marker'%>'></span></span>\n  <strong><%=name%></strong>\n  <span class='small pad1x'><%=place%></span>\n</label>\n<% }); %>\n<% if (!obj.length) { %>\n<label class='block pad1y pad2x fill-light keyline-bottom keyline-left keyline-right row1'>No results</label>\n<% } %>\n").template()
};

module.exports = function(editor, map, draw) {
    var exports = {};
    exports.results = [];
    exports.wait = 0;
    exports.last = 0;
    exports.query = '';

    exports.carmen = L.mapbox.geocoder('mapbox.places-v1');
    exports.field = $('#search input');
    exports.input = $('#search input').get(0);

    // Set the map view to the currently highlighted result.
    exports.setview = function(el) {
        var idx = $(el || '#search-results input:checked').val();

        // No results, bail.
        if (idx === undefined) return;

        var feature = exports.results.features[idx];
        if (feature.bbox) {
            map.fitBounds([[feature.bbox[1],feature.bbox[0]], [feature.bbox[3],feature.bbox[2]]]);
        } else if (feature.id.indexOf('address') === 0) {
            map.setView(L.latLng(feature.center[1], feature.center[0]), Math.max(16, map.getZoom()));
        } else if (feature.id.indexOf('street') === 0) {
            map.setView(L.latLng(feature.center[1], feature.center[0]), Math.max(15, map.getZoom()));
        } else {
            map.setView(L.latLng(feature.center[1], feature.center[0]), map.getZoom());
        }
        draw.place({ latlng: {
            lat: feature.center[1],
            lng: feature.center[0],
            title: feature.place_name.split(',')[0]
        }});
        exports.highlight(idx);
    };

    // Update the current selected result.
    exports.select = function(dir) {
        var $results = $('#search-results input');
        var $result = $('#search-results input:checked');
        var index = $results.index($result);
        var size = $results.size();
        if (dir !== 1 && dir !== -1) throw new Error('dir must be either -1 or 1');
        if (size <= 0) return;

        index = index < 0 ? size : index;
        index = (index + dir) % size;
        index = index < 0 ? index + size : index;

        exports.highlight(index);
    };

    // Highlight a search result by index.
    exports.highlight = function(idx) {
        $('#search-results input:checked').removeAttr('checked');
        $('#search-results input').eq(idx).prop('checked', true);
    };

    // Focus search field.
    exports.focus = function(e) {
        if (exports.field.is(':focus')) return;
        exports.input.focus();
    };

    // Retrieve a search result.
    exports.search = function(query) {
        var $results = $('#search-results');

        // This query is empty or only whitespace.
        if (/^\s*$/.test(query)) {
            $results.empty();
            exports.query = '';
            return null;
        }

        // This query is too short. Wait for more input chars.
        if (query.length < 3) return;

        // The query matches what is currently displayed.
        if (exports.query === query) return;

        var latlon = (function(q) {
            var parts = sexagesimal.pair(q);
            if (parts) return { lat: parts[0], lon: parts[1] };
        })(query);

        // carmen expects lon/lat but we want to accept lat/lon
        if (latlon) query = latlon.lon + ', ' + latlon.lat;

        var count = ++exports.wait;
        $('#search fieldset').addClass('spinner');
        exports.carmen.query(query, function(err, data) {
            // A more recent query finished before this one. Bail.
            if (count < exports.last) return;
            $('#search fieldset').removeClass('spinner');
            exports.last = count;
            exports.query = query;
            exports.results = (data && data.results) ? data.results : [];
            if (latlon) {
                exports.results[0] = exports.results[0] || [];
                exports.results[0].unshift(latlon);
            }
            $results.html(templates.results(exports.results.features));
        });
    };

    exports.debounced = _(exports.search).debounce(100);

    return exports;
};

},{"fs":33,"sexagesimal":12}],17:[function(require,module,exports){
var fs = require('fs');

var templates = {
    project_info: _("<div class='keyline-bottom contain fill-white pad2 small clearfix'>\n  <h3 class='truncate strong project-name'><%- obj.name %></h3>\n  <a href=\"/help\" class=\"pin-right block pad2\">Need help?</a>\n</div>\n\n<div class='pad2'>\n\n<div id='downloads' class='<% if (!obj.markers) { %> hidden <% } %> space-bottom2 clearfix small'>\n  <label class='block col2 pad0y strong small'>Data</label>\n  <div class='pill col10 clearfix'>\n    <a href='https://a.tiles.mapbox.com/v4/<%=obj.id%>/features.json?access_token=<%= App.user ? App.user.accessToken : App.accessToken %>' class='col6 button short icon down track-geojson-download'>GeoJSON</a>\n    <a href='https://a.tiles.mapbox.com/v4/<%=obj.id%>/features.kml?access_token=<%= App.user ? App.user.accessToken : App.accessToken %>' class='col6 button short icon down track-kml-download'>KML</a>\n  </div>\n</div>\n\n<div class='space-bottom2 small clearfix'>\n  <label for='mapid' class='block col2 pad0y strong small'>Map ID</label>\n  <div class='col10'>\n    <div class='space-bottom0 col12 contain clipboard-container'>\n      <input id='mapid' class='short small readonly code truncate mapid stretch' type='text' value='<%= obj.id %>' readonly />\n      <a title='Copy Map ID to clipboard' data-clipboard-text='<%= obj.id %>' class='pad0 icon quiet pin-bottomright js-clipboard clipboard'></a>\n    </div>\n    <label class=\"truncate block\"><em>\n      For <a class=\"inline track-js-docs\" href=\"/mapbox.js/\">Javascript</a>,\n      <a class=\"inline track-ios-docs\" href=\"/mapbox-ios-sdk/\">iOS</a>, and\n      <a class=\"inline track-api-docs\" href=\"/developers/api/\">Web services</a>.\n    </em></label>\n  </div>\n</div>\n\n<div class='space-bottom2 small contain clearfix'>\n  <label for='map-link' class='col2 block pad0y strong small'>Share</label>\n  <div class='link-container contain col10 clipboard-container'>\n    <input id='map-link' class='short small readonly truncate code stretch' type='text' value='<%= obj.share %>' />\n    <a title='Copy link to clipboard' data-clipboard-text='<%= obj.share %>' class='pad0 icon quiet pin-bottomright js-clipboard clipboard'></a>\n  </div>\n</div>\n\n<div class='contain clearfix'>\n  <label for='map-embed' class='strong pad0y col2 block small'>Embed</label>\n  <textarea id='map-embed' spellcheck='false' class='short col10 micro readonly code' type='text' value='' />\n  <a title='Copy link to clipboard' data-clipboard-text='' id='js-clipboard-embed' class='pad0 icon clipboard quiet js-clipboard pin-topright'></a>\n  <ul class='margin2 col10 info-details clearfix contain' id='embed-options'>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='zoompan' />\n      <label for='zoompan' class='pad0 truncate block micro icon check'>Zoom &amp; Pan</label>\n    </li>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='zoomwheel' />\n      <label for='zoomwheel' class='pad0 truncate block micro icon check'>Zoom Wheel</label>\n    </li>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='geocoder' />\n      <label for='geocoder' class='pad0 truncate block micro icon check'>Geocoder</label>\n    </li>\n    <li class='col3 checkbox'>\n      <input class='embed-option' type='checkbox' checked='true' id='share' />\n      <label for='share' class='pad0 truncate block micro icon check'>Link</label>\n    </li>\n  </ul>\n</div>\n\n<% if (!obj._rev) { %>\n<div class='pin-top pin-bottom fill-white pad4'>\n  <h3 class='title'>Save your project in order to:</h3>\n  <ul class='project-actions'>\n    <li class='clearfix contain space-bottom1'>\n      <p>Develop web and mobile apps with the project's Map ID.</p>\n    </li>\n    <li class='clearfix contain space-bottom1'>\n      <p>Share or embed your project.</p>\n    </li>\n    <li class='clearfix contain'>\n      <p>Download your data as GeoJSON or KML.</p>\n    </li>\n  </ul>\n</div>\n<% } %>\n\n</div>\n").template()
};

module.exports = function(editor, map, markers) {
    var exports = {};
    var $info = $('#project-info');

    function hashFormat(obj) {
        // trust the Bostock
        var precision = Math.max(0, Math.ceil(Math.log(obj.center[2]) / Math.LN2));
        return obj.center[2] + '/' +
            obj.center[1].toFixed(precision) + '/' +
            obj.center[0].toFixed(precision);
    }

    exports.render = function() {
        var project = _(editor.model.attributes).clone();
        project.share = 'https://a.tiles.mapbox.com/v4/' + project.id +
            '/page.html?access_token=' + (App.user ? App.user.accessToken : App.accessToken) + '#' + hashFormat(project);
        project.markers = editor.markers.model ? editor.markers.model.get('features').length : null;

        $info.html(templates.project_info(project));
    };

    return exports;
};

},{"fs":33}],18:[function(require,module,exports){
var fs = require('fs');

var templates = {
    layers_browse: _("<div id='layers-browse' class='modal-popup limiter'><div class='col6 modal-body fill-white contain'>\n  <a href='#close' class='quiet pad1 icon fr close'></a>\n  <div class='pad1y pad4x center'>\n    <h3>Add layers</h3>\n  </div>\n  <div id='project-data-browse' class='row6 contain scroll-v fill-grey'></div>\n  <div class='searchbar'><fieldset class='with-icon block'>\n    <span class='icon search'></span>\n    <input id='project-data-search' type='text' class='stretch'/>\n  </fieldset></div>\n</div></div>\n").template(),
    project_layer: _("<a href='#project' class='quiet contain keyline-bottom data-layer clip clearfix <%= obj.active ? 'active': '' %>' data-id='<%=item.id%>'>\n  <span class='col9 truncate small icon document'>\n    <%- item.name || item.id %>\n  </span>\n  <% if (item.id.indexOf('base.') === -1) { %>\n  <span class='col3 truncate text-right'><!--\n    --><span class='icon quiet close inline'></span>\n  </span>\n  <% } else { %>\n  <span class='col3 truncate text-right'><!--\n    --><small class='quiet inline'>Baselayer</small><!--\n    --><span class='icon quiet lock inline'></span>\n  </span>\n  <% } %>\n</a>\n").template()
};

module.exports = function(App, map, editor) {
    var exports = {};
    var $layers = $('#project-layers');
    exports.rendered = false;
    exports.infos = null;
    exports.layers = null;

    exports.toggle = function(id) {
        var b = _(exports.layers).find(function(m) { return m.id === id; });
        return b ? exports.remove(id) : exports.add(id);
    };

    exports.add = function(id) {
        if (!exports.infos || !exports.layers) return;
        var a = _(exports.infos).find(function(m) { return m.id === id; });
        var b = _(exports.layers).find(function(m) { return m.id === id; });
        if (!a || b) return;
        exports.layers.push(a);
        exports.refresh();
    };

    exports.remove = function(id) {
        if (!exports.layers) return;
        exports.layers = _(exports.layers).filter(function(m) { return m.id !== id; });
        exports.refresh();
    };

    exports.setview = function(id) {
        if (!exports.infos || !exports.layers) return;
        var l = _(exports.layers).find(function(m) { return m.id === id; });
        if (!l || !l.center) return;
        var center = l.center;
        map.setView([center[1], center[0]], center[2]);
    };

    exports.refresh = function() {
        if (!exports.layers) return;
        var active = _(exports.layers).pluck('id');
        // Remove unused layers.
        _($('a.data-layer', $layers)).each(function(el) {
            if (active.indexOf($(el).data('id')) === -1) $(el).remove();
        });
        // Add active layers.
        _(exports.layers).each(function(l) {
            if ($('a:not(.removed)[data-id="' + l.id + '"]',$layers).size()) return;
            var el = $(templates.project_layer({
                item:l,
                active:active.indexOf(l.id) !== -1
            }));
            if (/^base\./.test(l.id)) {
                $('div.base', $layers).prepend(el);
            } else {
                $('div.plus', $layers).prepend(el);
            }
        });
        // Update state of browser if present.
        var $browse = $('#project-data-browse');
        _($('a.data-layer', $browse)).each(function(el) {
            if (active.indexOf($(el).data('id')) === -1) {
                $(el).removeClass('active');
            } else {
                $(el).addClass('active');
            }
        });
        $('div.plus', $layers).sortable('destroy').sortable();
        // Redraw map.
        exports.redraw();
        $('#layers-tab').text((active.length > 1 ? active.length: '' )+ ' layers');
    };

    exports.redraw = _(function() {
        // Set model layers preserving any base.* layers which
        // is the domain of the style editor (for now).
        var base = _(editor.model.get('layers'))
            .filter(function(id) { return id.indexOf('base.') === 0; });
        var plus = _(exports.layers).chain()
            .pluck('id')
            .filter(function(id) { return id.indexOf('base.') === -1; })
            .value();
        var layers = base.concat(plus);
        if (_(editor.model.get('layers')).isEqual(layers)) return;
        editor.model.set({layers:layers});
    }).throttle(500);

    exports.search = function(query) {
        if (!App.user) return;

        var $browse = $('#project-data-browse');
        var account = editor.model.id.split('.')[0];
        if (account === 'api') account = App.user.id;

        if (!exports.infos) {
            $browse.addClass('loading');
            return App.fetch('/api/Map?account=' + account + '&_type=tileset&private=1', function(err, loaded) {
                $browse.removeClass('loading');
                if (err) return Views.modal.show('err', err);
                exports.infos = _(loaded.models).pluck('attributes');
                return exports.search(query);
            });
        } else {
            $browse.html(project_data({
                browse: exports.infos,
                search: query,
                active: _(exports.layers).pluck('id')
            }));
        }
    };

    function project_data(options) {
        var search = (options.search || '').toLowerCase();
        var items = _(options.browse).chain()
            .sortBy(function(item) {
                return (item.name||'').toLowerCase();
            })
            .filter(function(item) {
                return (item.name||'').toLowerCase().indexOf(options.search.toLowerCase()) !== -1;
            })
            .filter(function(item) {
                return item.format !== 'pbf' && (item.metadata && item.metadata.format) !== 'pbf';
            })
            .filter(function(item) {
                return item.status === 'available';
            }).value();

        return items.map(function(item, i) {
            return templates.project_layer({
                item: item,
                active: options.active.indexOf(item.id) !== -1
            });
        }).join('\n');
    }

    exports.browse = function() {
        if (!App.user) return;

        // Attempt a render in case it has not run to date.
        // Will no-op if previously rendered.
        exports.render();

        Views.modal.show('layers-browse', {
            template: templates.layers_browse
        });
        exports.search('');
    };

    exports.render = function() {
        if (exports.rendered) return;
        if (!App.user) return;

        exports.rendered = true;
        $layers.addClass('loading');
        var queue = _(editor.model.get('layers')).map(function(id) {
            return id.split('+')[0];
        });
        function get(queue, loaded) {
            if (queue.length) {
                App.tilejson(queue.shift(), function(err, tilejson) {
                    if (err && err.status !== 404) return Views.modal.show('err', err);
                    if (tilejson) loaded.push(tilejson);
                    get(queue, loaded);
                });
            } else {
                exports.layers = loaded;
                $layers.removeClass('loading');
                $('div.plus', $layers).sortable();
                $('div.plus', $layers).bind('sortupdate', function(ev, ui) {
                    var order = _($('a',$layers)).map(function(el) { return $(el).data('id'); });
                    exports.layers.sort(function(a, b) {
                        var ai = order.indexOf(a.id);
                        var bi = order.indexOf(b.id);
                        return ai < bi ? 1 : ai > bi ? -1 : 0;
                    });
                    exports.redraw();
                });
                exports.refresh();
            }
        }
        get(queue, []);
    };

    return exports;
};

},{"fs":33}],19:[function(require,module,exports){
var Streets = require('./streets');

module.exports.colorHSL = _(function(ev) {
    if (!ev.which) return;
    var target, id, x, y, w, h;
    if (this.colorSelectMode === 'sl') {
        target = this.colorSelectTarget;
        id = this.style.id({currentTarget:target});
        x = (ev.clientX - $(target).offset().left + window.pageXOffset);
        y = (ev.clientY - $(target).offset().top + window.pageYOffset);
        w = $(target).width();
        h = $(target).height();
        this.style.styles[id].s = Math.min(1,Math.max(0,x/w));
        this.style.styles[id].l = Math.min(1,Math.max(0,(1-(this.style.styles[id].s*0.5)) * (1-y/h)));
        this.style.render(id);
        ev.preventDefault();
    } else if (this.colorSelectMode === 'h') {
        target = this.colorSelectTarget;
        id = this.style.id({currentTarget:target});
        x = (ev.clientX - $(target).offset().left + window.pageXOffset);
        w = $(target).width();
        this.style.styles[id].h = Math.min(1,Math.max(0,x/w));
        this.style.render(id);
        ev.preventDefault();
    }
}).throttle(20);

module.exports.colorHex = _(function(ev) {
    var id = this.style.id(ev);
    var hex = $(ev.currentTarget).val();
    if (hex[0] !== '#') $(ev.currentTarget).val('#' + hex);

    hex = formatHex(hex);
    if ((/^#?([0-9a-f]{6})$/i).test(hex)) {
        var hsl = Streets.parseTintString(hex);
        this.style.styles[id].h = Streets.avg(hsl.h);
        this.style.styles[id].s = Streets.avg(hsl.s);
        this.style.styles[id].l = Streets.avg(hsl.l);
        this.style.render(id, true);
    }
}).throttle(20);

module.exports.colorClamp = _(function(ev) {
    var id = this.style.id(ev);
    var v = +$(ev.currentTarget).val();
    if ($(ev.currentTarget).attr('name') === 'a') {
        this.style.styles[id].a = +v;
    } else {
        this.style.styles[id][$(ev.currentTarget).attr('name')] = 0.5 - v;
    }
    this.style.render(id, true);
}).throttle(20);

module.exports.formatHex = formatHex;

function formatHex(hex) {
    if ((/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i).test(hex)) {
        hex = hex.replace(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
    }
    return hex;
}

},{"./streets":28}],20:[function(require,module,exports){
module.exports.reset = function() {
    module.exports.Point = {
        title: '',
        description: '',
        'marker-size': 'medium',
        'marker-color': '#1087bf',
        'marker-symbol': ''
    };

    module.exports.LineString = {
        title: '',
        description: '',
        'stroke': '#1087bf',
        'stroke-width': 4,
        'stroke-opacity': 1
    };

    module.exports.Polygon = {
        title: '',
        description: '',
        'stroke': '#1087bf',
        'stroke-width': 4,
        'stroke-opacity': 1,
        'fill': '#1087bf',
        'fill-opacity': 0.2
    };
};

module.exports.reset();

},{}],21:[function(require,module,exports){
var latlngToFeature = require('./latlngtofeature'),
    fs = require('fs');

var templates = {
    popup: _("<div class='place-popup round'>\n  <a href='#data' class='place-marker small contain strong center round fill-white quiet pad1 block'>\n    <span class='maki-icon <%= obj.maki || 'marker' %>'></span>\n    <%= obj.title || 'New marker' %>\n  </a>\n</div>\n").template()
};

// Draw-like handler for place => marker interactions.
// Emits a map 'place:created' event when a marker is added.
module.exports = function(App, map) {
    var exports = {};
    exports.layer = null;

    // Use a flag + 200ms timeout to determine if a click is "really" a
    // single click before placing the marker UI.
    var single = false;

    exports.clear = function() {
        if (!exports.layer) return;
        var layer = exports.layer;
        exports.layer = null;
        map.removeLayer(layer);
    };

    exports.popup = function(ev) {
        exports.clear();
        exports.layer = L.marker(ev.latlng, {
            icon: L.divIcon({
                className: 'place-tmp'
            }),
            id: 'place-tmp'
        }).addTo(map);
        exports.layer.bindPopup(templates.popup(ev.latlng), {
            closeButton: false,
            className: 'place-popup-wrapper',
            maxWidth: 150
        });
        exports.layer.openPopup();
        $('.place-popup-wrapper .place-marker').click(clickPlace);
        exports.layer.on('popupclose', exports.clear);

        function clickPlace() {
            var feature = latlngToFeature(ev.latlng);
            var event = { layer: { toGeoJSON: function() { return feature; } } };
            map.fire('place:created', event);
            exports.clear();
            analytics.track('Placed a Marker');
        }
    };

    exports.disable = function() {
        exports.clear();
        map.on('mousedown', function() {
            exports.clear();
        });
    };

    return exports;
};

},{"./latlngtofeature":25,"fs":33}],22:[function(require,module,exports){
var latlngToFeature = require('./latlngtofeature');

// Draw-like handler for direct point addition.
// Emits a map 'point:created' event when a point is added.
module.exports = function(map) {
    var exports = {};

    exports.enable = function() {
        map.on('click', onclick);
        $('#map-app').addClass('crosshair-mode');
    };

    exports.disable = function() {
        map.off('click', onclick);
        $('#map-app').removeClass('crosshair-mode');
    };

    function onclick(ev) {
        var feature = latlngToFeature(ev.latlng);
        var event = { layer: { toGeoJSON: function() { return feature; } } };
        map.fire('point:created', event);
    }

    return exports;
};

},{"./latlngtofeature":25}],23:[function(require,module,exports){
module.exports = function(l) {
    if (l instanceof L.Marker) return l.getLatLng();

    var latlngs = l._latlngs,
    len = latlngs.length,
    i, j, p1, p2, f, center;

    for (i = 0, j = len - 1, area = 0, lat = 0, lng = 0; i < len; j = i++) {
        p1 = latlngs[i];
        p2 = latlngs[j];
        f = p1.lat * p2.lng - p2.lat * p1.lng;
        lat += (p1.lat + p2.lat) * f;
        lng += (p1.lng + p2.lng) * f;
        area += f / 2;
    }

    center = area ? new L.LatLng(lat / (6 * area), lng / (6 * area)) : latlngs[0];
    center.area = area;

    return center;
};

},{}],24:[function(require,module,exports){
module.exports = function(ev) {
    var $target = $(ev.currentTarget),
        $input = $target.siblings('input'),
        changed = false;

    $input.val(function(index, value) {
        var max = parseFloat($input.attr('max'));
        var min = parseFloat($input.attr('min'));
        var step = parseFloat($input.attr('step')) || 1;
        var increment = ($target.hasClass('increase')) ? step : 0 - step;
        newVal = parseFloat(value) + increment;

        if (newVal >= min && newVal <= max) {
            changed = true;
            return Math.round(newVal * 100) / 100;
        } else return value;
    });

    if (changed) { $input.trigger('change'); }
};

},{}],25:[function(require,module,exports){
var util = require('./util'),
    defaults = require('./defaults');

module.exports = function latlngToFeature(data) {
    return {
        type: 'Feature',
        properties: _({
            id: util.makeId(),
            title: data.title,
            description: data.description
        }).defaults(defaults.point),
        geometry: {
            type: 'Point',
            coordinates: [data.lng, data.lat]
        }
    };
};

},{"./defaults":20,"./util":29}],26:[function(require,module,exports){
module.exports = function(ev) {
    var el = $(ev.currentTarget);
    var dir = el.is('.up') ? -1 : 1;
    var parent = $('#' + el.attr('href').split('#').pop());

    // Pager requires the target to be a sliding container.
    if (!parent.is('.sliding')) return;

    // Bail on empty containers.
    var size = parent.children().size();
    if (size <= 0) return;

    // Search for a .activeN class and nuke it.
    var current = parent.attr('class').match(/active[0-9]+/);
    // Add the new appropriate active class.
    if (current) {
        var index = parseInt(current[0].split('active')[1],10) - 1;
        index = index + dir;
        if (index >= 0 && index < size) {
            parent.removeClass(current[0]);
            parent.addClass('active' + (index+1));
        }
    } else {
        parent.addClass('active1');
    }
    return false;
};

},{}],27:[function(require,module,exports){
// this is from simplestyle.js in mapbox.js
var defaults = {
    stroke: '#940000',
    'stroke-width': 2,
    'stroke-opacity': 1,
    fill: '#C78383',
    'fill-opacity': 0.1
};

var mapping = [
    ['stroke', 'color'],
    ['stroke-width', 'weight'],
    ['stroke-opacity', 'opacity'],
    ['fill', 'fillColor'],
    ['fill-opacity', 'fillOpacity']
];

function fallback(a, b) {
    var c = {};
    for (var k in b) {
        if (a[k] === undefined) c[k] = b[k];
        else c[k] = a[k];
    }
    return c;
}

function remap(a) {
    var d = {};
    for (var i = 0; i < mapping.length; i++) {
        d[mapping[i][1]] = a[mapping[i][0]];
    }
    return d;
}

module.exports = function style(feature) {
    return remap(fallback(feature.properties || {}, defaults));
};

},{}],28:[function(require,module,exports){
var Streets = Streets || {};

Streets.decode = function(id) {
    return _((id.split('+')[1]||'').split('_')).reduce(function(memo, part) {
        var key = part;
        var val = '0x1;0x1;0x1;0x1';
        if (part.indexOf('-') !== -1) {
            key = part.substr(0,part.indexOf('-'));
            val = part.substr(part.indexOf('-')+1);
        }
        switch(key) {
        case 'bg':
            if (!(/^[0-f]{6}$/.test(val))) break;
            memo[key] = val;
            break;
        case 'scale':
            val = parseInt(val,10);
            if (val !== 1 && val !== 2) break;
            memo[key] = val;
            break;
        case 'l10n':
            if (!/^(en|fr|de|es)$/.test(val)) break;
            memo[key] = val;
            break;
        case 'water':
        case 'streets':
        case 'landuse':
        case 'buildings':
            var tintstring = Streets.parseTintString(val);
            if (!tintstring.h) break;
            memo[key] = _(tintstring).defaults({ h:[0,1],s:[0,1],l:[0,1],a:[0,1] });
            break;
        }
        return memo;
    }, {
        bg:'',
        l10n:'',
        scale:1,
        landuse:   {h:[0,1],s:[0,1],l:[0,1],a:[0,0]},
        water:     {h:[0,1],s:[0,1],l:[0,1],a:[0,0]},
        buildings: {h:[0,1],s:[0,1],l:[0,1],a:[0,0]},
        streets:   {h:[0,1],s:[0,1],l:[0,1],a:[0,0]}
    });
};

Streets.encode = function(params) {
    var spec = _(['bg','l10n','scale','water','streets','landuse','buildings']).reduce(function(memo, key) {
        if (!params[key]) return memo;
        var val = params[key];
        switch (key) {
        case 'bg':
            if (!(/^[0-f]{6}$/.test(val))) break;
            memo.push(key + '-' + val);
            break;
        case 'l10n':
            if (!/^(en|fr|de|es)$/.test(val)) break;
            memo.push(key + '-' + val);
            break;
        case 'scale':
            val = parseInt(val,10);
            if (val !== 1 && val !== 2) break;
            memo.push(key + '-' + val);
            break;
        default:
            if (!val.h) break;
            memo.push(key + '-' + Streets.hsl2tint(val));
            break;
        }
        return memo;
    }, []).join('_');
    return spec;
};

// Convert an HSL object to a hex string.
Streets.hsl2rgba = function(hsl) {
    var rgb = (function hsl2rgb(h, s, l) {
        if (!s) return [l * 255, l * 255, l * 255];

        var m1, m2;
        var hueToRGB = function (m1, m2, h) {
            h = (h + 1) % 1;
            if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            if (h * 2 < 1) return m2;
            if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
            return m1;
        };

        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [
          hueToRGB(m1, m2, h + 0.33333) * 255,
          hueToRGB(m1, m2, h) * 255,
          hueToRGB(m1, m2, h - 0.33333) * 255
        ];
    })(Streets.avg(hsl.h), Streets.avg(hsl.s), Streets.avg(hsl.l));

    var a = (hsl.a && hsl.a.length === 2) ? hsl.a[1] : ('a' in hsl) ? hsl.a : 1;
    return 'rgba(' + _(rgb).map(Math.floor).join(',') + ',' + a + ')';
};

// Convert an HSL object to a hex string.
Streets.hsl2hex = function(hsl) {
    var rgb = (function hsl2rgb(h, s, l) {
        if (!s) return [l * 255, l * 255, l * 255];

        var m1, m2;
        var hueToRGB = function (m1, m2, h) {
            h = (h + 1) % 1;
            if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            if (h * 2 < 1) return m2;
            if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
            return m1;
        };

        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [
          hueToRGB(m1, m2, h + 0.33333) * 255,
          hueToRGB(m1, m2, h) * 255,
          hueToRGB(m1, m2, h - 0.33333) * 255
        ];
    })(Streets.avg(hsl.h), Streets.avg(hsl.s), Streets.avg(hsl.l));

    var z = (rgb[0] << 16 | rgb[1] << 8 | rgb[2]).toString(16);
    while (z.length < 6) z = '0' + z;
    return z;
};

// Convert an HSL object to a node-blend tintspec string.
Streets.hsl2tint = function(hsl) {
    return _('<%=h[0].toFixed(2)%>x<%=h[1].toFixed(2)%>;' +
        '<%=s[0].toFixed(2)%>x<%=s[1].toFixed(2)%>;' +
        '<%=l[0].toFixed(2)%>x<%=l[1].toFixed(2)%>;' +
        '<%=a[0].toFixed(2)%>x<%=a[1].toFixed(2)%>')
    .template(_(hsl).chain().reduce(function(memo, v, k) {
        if (v && k === 'a') {
            memo[k] = v.length === 1 ? [0,v[0]] : v;
        } else if (v) {
            memo[k] = v.length === 1 ? [v[0],v[0]] : v;
        }
        return memo;
    }, {}).defaults({h:[0,1],s:[0,1],l:[0,1],a:[0,1]}).value());
};

// Directly copied from node-blend.
Streets.rgb2hsl = function(r, g, b){
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    var gamma = max + min;
    var h = 0, s = 0, l = gamma / 2;

    if (delta) {
        s = l > 0.5 ? delta / (2 - gamma) : delta / gamma;
        if (max == r && max != g) h = (g - b) / delta + (g < b ? 6 : 0);
        if (max == g && max != b) h = (b - r) / delta + 2;
        if (max == b && max != r) h = (r - g) / delta + 4;
        h /= 6;
    }

    h = h > 1 ? 1 : h < 0 ? 0 : h;
    s = s > 1 ? 1 : s < 0 ? 0 : s;
    l = l > 1 ? 1 : l < 0 ? 0 : l;
    return [h, s, l];
};

Streets.parseTintString = function(str) {
    if (!str || !str.length) return {};

    var options = {};
    var hex = str.match(/^#?([0-9a-f]{6})$/i);
    if (hex) {
        var hsl = Streets.rgb2hsl(
            parseInt(hex[1].substring(0, 2), 16),
            parseInt(hex[1].substring(2, 4), 16),
            parseInt(hex[1].substring(4, 6), 16)
        );
        options.h = [hsl[0],hsl[0]];
        options.s = [hsl[1],hsl[1]];
        // Map midpoint grey to the color value, stretching values to
        // preserve white/black range. Will preserve good contrast and
        // midtone color at the cost of clipping extreme light/dark values.
        var l = hsl[2];
        var y0,y1;
        if (l > 0.5) {
            y0 = 0;
            y1 = l * 2;
        } else {
            y0 = l - (1-l);
            y1 = 1;
        }
        options.l = [y0,y1];
    } else {
        var parts = str.split(';');
        var split_opt = function(opt) {
            if (opt.indexOf('x') > -1) {
                var pair = opt.split('x');
                return [parseFloat(pair[0]),parseFloat(pair[1])];
            } else {
                var value = parseFloat(opt);
                return [value,value];
            }
        };
        if (parts.length > 0) options.h = split_opt(parts[0]);
        if (parts.length > 1) options.s = split_opt(parts[1]);
        if (parts.length > 2) options.l = split_opt(parts[2]);
        if (parts.length > 3) options.a = split_opt(parts[3]);
    }

    return options;
};

// Wrapper around Streets.parseTintString.
Streets.tint2hsl = function(str) {
    if (!str) return false;

    // Convert a hex string into hsv.
    if (/^[0-9a-f]{6}$/i.test(str)) {
        var hsl = Streets.parseTintString(str);
        // The hex range stretch in parseTintString needs to be
        // undone for the purposes of setting a hex value.
        hsl.l = [Streets.avg(hsl.l),Streets.avg(hsl.l)];
        return hsl;
    }

    // No tint string.
    if (str.indexOf('+') < 0) return false;

    // Tint string.
    return Streets.parseTintString(str.split('+').pop());
};

Streets.avg = function(arr) { return typeof arr === 'number' ? arr : _(arr).reduce(function(sum, v) {
    sum += v;
    return sum;
}, 0) / arr.length; };

Streets.delta = function(arr) { return Math.abs(arr[1] - arr[0]) * 0.5 };

Streets.enabled = function(arr) { return !arr || (arr && arr[1] > 0) ? 1 : 0 };

Streets.inverted = function(arr) { return (arr[1] < arr[0]) ? 1 : 0 };

// Determine whether this configuration is a no-op
// (ie. all layers and background are transparent).
Streets.empty = function(id) {
    return _(Streets.decode(id)).all(function(v,k) {
        if (k === 'bg') return v === '';
        if (!v.h) return true;
        if (v.a[0] <= 0 && v.a[1] <= 0) return true;
        return false;
    });
};

Streets.styles = function(layers, skipalike) {
    function convert(layers) {
        return _(['base.mapbox-streets'].concat(layers)).reduce(function(memo, l) {
            if (!l) return memo;
            var p = l.split('+');
            if (p[0] === 'base.mapbox-streets') {
                var config = Streets.decode(l);
                memo.l10n = config.l10n;
                memo.scale = config.scale;
                memo.bg = Streets.style(config.bg && Streets.parseTintString(config.bg), 'bg');
                memo.streets = Streets.style(config.streets, 'streets');
                memo.landuse = Streets.style(config.landuse, 'landuse');
                memo.buildings = Streets.style(config.buildings, 'buildings');
                memo.water = Streets.style(config.water, 'water');
            } else {
                memo[p[0]] = Streets.style(p[1] && Streets.parseTintString(p[1]), p[0]);
            }
            return memo;
        }, {});
    }
    var styles = convert(layers);

    if (skipalike) return styles;

    _(Streets.recipes).each(function(op, id) {
        var hsl = op.control(styles);
        var type = Streets.type(styles);
        var palette = convert(Streets.styles2layers(op.hsl(hsl, type)));
        var alike = _(styles).chain().omit('l10n','scale').all(function(astyle, l) {
            if (!palette[l]) return false;
            var bstyle = palette[l];
            return _(astyle).all(function(a, key) {
                if (!(key in bstyle)) return false;
                var b = bstyle[key];
                return typeof a === 'number' ? Math.abs(a - b) <= 0.05 : a === b;
            });
        }).value();
        if (alike) {
            styles.whiz = _(hsl).clone();
            styles.whiz.palette = id;
        }
    });
    styles.whiz = styles.whiz || Streets.style(Streets.parseTintString('#73b6e6'));

    return styles;
};

Streets._swatchCache = {};

// Returns a swatch object with the following properties:
// - data: true/false for should display data layers
// - icon: a base.css icon to display for the swatch
// - rgba: the rgba background color to display
Streets.swatch = function(layers) {
    var key = JSON.stringify(layers);
    if (Streets._swatchCache[key]) return Streets._swatchCache[key];
    var data = _(layers).any(function(l) { return l.indexOf('base.') === -1 });
    var styles = Streets.styles(layers);
    var type = Streets.type(styles);
    var icon = ({streets:'street',terrain:'mt', satellite:'satellite'})[type];
    var b = ({streets:'water',terrain:'water',satellite:'streets'})[type];
    var a = ({streets:'bg',terrain:'base.live-land-tr',satellite:'base.live-satellite'})[type];
    a = Streets.style2swatch(styles[a], a);
    b = Streets.style2swatch(styles[b], b);
    var classes = (a.l > 0.5 && a.s < 0.5) || a.a < 0.5 ? 'quiet' : 'dark';
    a = a.a > 0.1 ? Streets.hsl2rgba(a) : '#ddd';
    b = b.a > 0.1 ? Streets.hsl2rgba(b) : '#eee';
    Streets._swatchCache[key] = { type:type, icon:icon, a:a, b:b, data:data, classes:classes };
    return Streets._swatchCache[key];
};

Streets.styles2layers = function(styles) {
    var c = function(v) { return Math.max(0,Math.min(1,v)) };

    // Flag for determining whether all streets layers are turned off.
    var streets = _(styles).chain()
        .pick(['bg','streets','water','buildings','landuse'])
        .any(function(s) { return s.on; })
        .value();

    var hsla = _(styles).reduce(function(memo, s, id) {
        if (id === 'bg') {
            memo[id] = s.on ? Streets.style2hex(s) : '';
        } else if (typeof s === 'object' && 'h' in s) {
            memo[id] = {
                h:[c(s.h-s.hd),c(s.h+s.hd)],
                s:[c(s.s-s.sd),c(s.s+s.sd)],
                l:s.inv ? [c(s.l+s.ld),c(s.l-s.ld)] : [c(s.l-s.ld),c(s.l+s.ld)],
                a:[0,c(s.on?s.a:0)]
            };
        } else {
            memo[id] = s;
        }
        return memo;
    }, {});
    return _(hsla).chain().keys()
        .filter(function(id) { return id.indexOf('base.') !== -1 })
        .sortBy(function(id) {
            if (id === 'base.live-satellite') return -3;
            if (id === 'base.live-land-tr') return -2;
            if (id === 'base.live-landuse-tr') return -1;
            return 0;
        })
        .map(function(id) { return hsla[id] ? id + '+' + Streets.hsl2tint(hsla[id]) : id })
        .value()
        .concat(streets ? ['base.mapbox-streets+' + Streets.encode(hsla)] : []);
};

Streets.style = function make(style, id) {
    style = (id === 'bg') ?
        (style || { h:[0,1], s:[0,1], l:[0,1], a:[0,0] }) :
        (style || { h:[0,1], s:[0,1], l:[0,1], a:[0,1] });
    style.on = style.on || (!style.a || (style.a && style.a[1] > 0));
    style.inv = style.inv || (style.l[0] > style.l[1]);
    style.hd = style.hd || Streets.delta(style.h);
    style.sd = style.sd || Streets.delta(style.s);
    style.ld = style.ld || (id === 'bg' ? 0 : Streets.delta(style.l));

    style.h = Streets.avg(style.h);
    style.s = Streets.avg(style.s);
    style.l = Streets.avg(style.l);
    style.a = !style.a ? 1 : style.a[1];
    return style;
};

Streets.type = function(styles) {
    return styles['base.live-satellite'] ? 'satellite'
        : styles['base.live-land-tr'] ? 'terrain'
        : 'streets';
};

// Swatch is a visualization of what a given layer/style will look like
// post-hsla adjustment. It is based on a hardcoded mapping of the perceived
// "main color" of a given layer as the origin color prior to adjustment.
Streets.style2swatch = function(s, id) {
    var origins = {
        bg:'#e8e0d8',
        streets:'#ffffff',
        landuse:'#c8df9f',
        buildings:'#d5ccc1',
        water:'#73b6e6',
        whiz:'#777777',
        'base.live-land-tr':'#c8df9f',
        'base.live-landuse-tr':'#e8e0d8',
        'base.live-satellite':'#626940',
    };

    if (!origins[id]) return {h:0,s:0,l:0,a:0};

    var orig = Streets.parseTintString(origins[id]);
    orig.h = Streets.avg(orig.h);
    orig.s = Streets.avg(orig.s);
    orig.l = Streets.avg(orig.l);
    orig.a = 1;
    var tinted = {};

    // Convert style to tintspec and ramp each hsla value.
    var c = function(v) { return Math.max(0,Math.min(1,v)) };
    var tintspec = {
        h:[c(s.h-s.hd),c(s.h+s.hd)],
        s:[c(s.s-s.sd),c(s.s+s.sd)],
        l:s.inv ? [c(s.l+s.ld),c(s.l-s.ld)] : [c(s.l-s.ld),c(s.l+s.ld)],
        a:[0,c(s.on?s.a:0)]
    };
    var tinted = _(orig).reduce(function(memo, val, key) {
        memo[key] = tintspec[key][0] + (val*(tintspec[key][1]-tintspec[key][0]));
        return memo;
    }, {});
    return tinted;
};

Streets.style2rgba = function(style) {
    return Streets.hsl2rgba(style);
};

Streets.style2hex = function(style) {
    return Streets.hsl2hex(style);
};

Streets.style2hue = function(style) {
    return Streets.hsl2hex({ h:style.h, s:1, l:0.5 });
};

// Each recipe is an object with
// - name, UI name of the recipe
// - hsl, function that takes an hsl and generates a full styles hash (palette)
// - styles, function that takes a full styles hash and generates a full styles hash (palette)
Streets.recipes = {};
Streets.recipes.streets = (function() {
    var exports = {};
    exports.name = 'Streets';
    exports.swatches = [
        'f5c272',
        'd27591',
        '9c89cc',
        '548cba',
        '63b6e5',
        'b7ddf3'
    ];
    exports.hsl = function(hsl, type) {
        var presets = _({
            'f5c272': 'base.mapbox-streets+bg-c6916b_water-0.10x0.10;0.86x0.86;0.70x0.70;0.00x1.00_streets-0.11x0.11;0.68x0.84;0.01x0.83;0.00x1.00_landuse-0.15x0.35;0.10x0.52;0.28x0.60;0.00x1.00_buildings-0.05x0.05;0.28x0.78;0.07x0.69;0.00x1.00',
            'd27591': 'base.mapbox-streets+bg-975d6e_water-0.94x0.94;0.50x0.50;0.64x0.64;0.00x1.00_streets-0.91x0.91;0.12x0.46;0.78x0.34;0.00x1.00_landuse-0.43x0.63;0.90x0.98;0.04x0.36;0.00x0.44_buildings-0.08x0.08;0.74x1.00;0.38x0.64;0.00x0.37',
            '9c89cc': 'base.mapbox-streets+bg-574152_water-0.71x0.71;0.40x0.40;0.67x0.67;0.00x1.00_streets-0.03x0.03;0.17x0.83;0.86x0.14;0.00x1.00_landuse-0.62x0.82;0.03x0.41;0.05x0.31;0.00x1.00_buildings-0.09x0.09;0.13x1.00;0.41x0.41;0.00x1.00',
            '548cba': 'base.mapbox-streets+bg-bfd8d3_water-0.57x0.57;0.42x0.42;0.53x0.53;0.00x1.00_streets-0.51x0.51;0.18x0.32;0.40x0.92;0.00x1.00_landuse-0.36x0.56;0.05x0.63;0.22x0.92;0.00x1.00_buildings-0.27x0.27;0.00x0.56;0.29x1.00;0.00x1.00',
            '63b6e5': 'base.mapbox-streets+bg-e8e0d8_water-0.57x0.57;0.69x0.69;0.67x0.67;0.00x1.00_streets-0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00_landuse-0.15x0.35;0.00x1.00;0.00x1.00;0.00x1.00_buildings-0.09x0.09;0.00x0.76;0.00x1.00;0.00x1.00',
            'b7ddf3': 'base.mapbox-streets+bg-ffefd1_water-0.56x0.56;0.71x0.71;0.83x0.83;0.00x1.00_streets-0.00x0.91;0.00x1.00;0.25x1.00;0.00x1.00_landuse-0.12x0.32;0.25x0.93;0.31x0.97;0.00x1.00_buildings-0.11x0.11;0.42x0.92;0.33x0.99;0.00x1.00'
        }).reduce(function(memo, layer, key) {
            memo[key] = Streets.styles(layer.split(','), true);
            return memo;
        }, {});
        var satellite = _({
            'f5c272': 'base.live-satellite+0.00x0.68;0.00x0.44;0.44x1.00;0.00x1.00,base.mapbox-streets+water-0.10x0.10;0.86x0.86;0.70x0.70;0.00x1.00_streets-0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00',
            'd27591': 'base.live-satellite+0.00x0.46;0.00x0.66;0.09x0.88;0.00x1.00,base.mapbox-streets+water-0.94x0.94;0.50x0.50;0.64x0.64;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            '9c89cc': 'base.live-satellite+0.35x1.00;0.00x0.37;0.00x0.79;0.00x1.00,base.mapbox-streets+water-0.71x0.71;0.40x0.40;0.67x0.67;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            '548cba': 'base.live-satellite+0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00,base.mapbox-streets+water-0.57x0.57;0.42x0.42;0.53x0.53;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            '63b6e5': 'base.live-satellite+0.00x0.97;0.00x0.72;0.24x1.00;0.00x1.00,base.mapbox-streets+water-0.57x0.57;0.69x0.69;0.67x0.67;0.00x1.00_streets-0.00x1.00;0.00x1.00;1.00x0.00;0.00x1.00',
            'b7ddf3': 'base.live-satellite+0.00x0.94;0.00x0.47;0.44x1.00;0.00x1.00,base.mapbox-streets+water-0.56x0.56;0.71x0.71;0.83x0.83;0.00x1.00_streets-0.00x1.00;0.00x1.00;0.00x1.00;0.00x1.00'
        }).reduce(function(memo, layer, key) {
            memo[key] = Streets.styles(layer.split(','), true);
            return memo;
        }, {});
        function hash(hsl) {
            if (typeof hsl === 'string') hsl = Streets.style(Streets.parseTintString(hsl));
            return (Math.floor(hsl.h * 10) * 1000) +
                (Math.floor(hsl.l * 10) * 100) +
                ((Math.floor(hsl.h * 100) % 10) * 10) +
                ((Math.floor(hsl.l * 100) % 10) * 1);
        }
        var input = hash(hsl);
        var preset = _(_(presets).keys()).reduce(function(memo, key) {
            if (!memo) return key;
            var a = Math.abs(hash(memo) - input);
            var b = Math.abs(hash(key)  - input);
            return b < a ? key : memo;
        }, false);
        if (type === 'satellite') {
            var palette = satellite[preset];
            palette.swatch = preset;
            return palette;
        }
        // No-op.
        var palette;
        if (_(hsl).chain().omit('palette').isEqual(Streets.style()).value()) {
            palette = Streets.styles(['base.mapbox-streets+bg-e8e0d8_water_streets_landuse_buildings'], true);
            preset = '63b6e5';
        } else {
            palette = presets[preset];
        }
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = _({ld:0.2}).defaults(palette.landuse);
        palette.swatch = preset;
        return palette;
    };
    exports.control = function(styles) { return styles.water };
    return exports;
})();
Streets.recipes.basic = (function() {
    var exports = {};
    exports.name = 'Basic';
    exports.hsl = function(hsl, type) {
        var palette = {
            water:     {h:0.23,s:0.50,l:0.75,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            landuse:   {h:0.57,s:0.26,l:0.68,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            buildings: {h:0.08,s:0.26,l:0.80,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            streets:   {h:0.23,s:0.00,l:0.75,a:1,ld:0.5,sd:0.0,hd:0,on:true,inv:false},
            bg:        {h:0.08,s:0.26,l:0.88,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false}
        };
        _(['landuse','buildings','bg']).each(function(k) {
            var hp = (palette[k].h - palette.water.h) * hsl.s;
            var lm = Math.min(0.75 + hsl.l, 1.10);
            var sm = Math.pow(1.00 - hsl.s, 2.00);
            palette[k].h = (hsl.h + hp) % 1;
            palette[k].l = Math.min(1, palette[k].l * lm);
            palette[k].s = Math.min(1, palette[k].s * sm);
        });
        if (type === 'satellite') {
            palette['base.live-satellite'] = {h:hsl.h,s:hsl.s,l:hsl.l,a:1,hd:0.1,sd:0.2,ld:0.2,on:true,inv:false};
            palette.streets.a = 0.8;
            palette.streets.inv = palette['base.live-satellite'].l < 0.75;
            return palette;
        }
        palette.streets.inv = palette.bg.l < 0.75;
        palette.water.h = hsl.h;
        palette.water.s = hsl.s;
        palette.water.l = hsl.l;
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = _({ld:0.2}).defaults(palette.landuse);
        return palette;
    };
    exports.control = function(styles) { return styles.water };
    return exports;
})();
Streets.recipes.accent = (function() {
    var exports = {};
    exports.name = 'Accent';
    exports.hsl = function(hsl, type) {
        var palette = {
            water:     {h:0.57,s:0.26,l:0.68,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            landuse:   {h:0.23,s:0.50,l:0.75,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            buildings: {h:0.08,s:0.26,l:0.80,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            streets:   {h:0.23,s:0.00,l:0.75,a:1,ld:0.5,sd:0.0,hd:0,on:true,inv:false},
            bg:        {h:0.08,s:0.26,l:0.88,a:1,ld:0.0,sd:0.0,hd:0,on:true,inv:false}
        };
        _(['water','buildings','bg']).each(function(k) {
            var hp = (palette[k].h - palette.landuse.h) * hsl.s;
            var lm = Math.min(0.75 + hsl.l, 1.10);
            var sm = Math.pow(1.00 - hsl.s, 2.00);
            palette[k].h = (hsl.h + hp) % 1;
            palette[k].l = Math.min(1, palette[k].l * lm);
            palette[k].s = Math.min(1, palette[k].s * sm);
        });
        if (type === 'satellite') {
            palette['base.live-satellite'] = _({hd:0.1,sd:0.2,ld:0.2}).defaults(palette.water);
            palette.streets = {h:hsl.h,s:hsl.s,l:hsl.l,a:0.8,ld:0.3,sd:0,hd:0,on:true,inv:palette['base.live-satellite'].l < 0.75};
            return palette;
        }
        palette.streets.inv = palette.bg.l < 0.75;
        palette.landuse.h = hsl.h;
        palette.landuse.s = hsl.s;
        palette.landuse.l = hsl.l;
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = _({ld:0.2}).defaults(palette.landuse);
        return palette;
    };
    exports.control = function(styles) { return styles.landuse };
    return exports;
})();

Streets.recipes.monochrome = (function() {
    var exports = {};
    exports.name = 'Bold';
    exports.hsl = function(hsl, type) {
        var keys = ['water', 'landuse', 'buildings', 'bg', 'streets'];
        var palette = {
            water:     {h:-0.03, s:-0.10, l:-0.25, a:1.0,ld:0.0,sd:0.0,hd:0,on:true,inv:false},
            landuse:   {h:-0.02, s: 0.00, l:-0.10, a:1.0,ld:0.2,sd:0.0,hd:0,on:true,inv:false},
            buildings: {h:-0.01, s: 0.00, l:-0.05, a:1.0,ld:0.2,sd:0.0,hd:0,on:true,inv:false},
            streets:   {h: 0.00, s:-0.50, l: 0.10, a:1.0,ld:0.5,sd:0.2,hd:0,on:true,inv:false},
            bg:        {h: 0.00, s: 0.00, l: 0.00, a:1.0,ld:0.0,sd:0.0,hd:0,on:true,inv:false}
        };
        _(keys).each(function(k, i) {
            _(['h','s','l']).each(function(a) {
                palette[k][a] = palette[k][a] + hsl[a];
                palette[k][a] = Math.max(0, palette[k][a]);
                palette[k][a] = Math.min(1, palette[k][a]);
            });
        });
        palette.streets.inv = palette.bg.l < 0.75;
        palette['base.live-land-tr'] = _({ld:0.2}).defaults(palette.bg);
        palette['base.live-landuse-tr'] = palette.landuse;
        palette['base.live-satellite'] = palette.landuse;
        return palette;
    };
    exports.control = function(styles) { return styles.bg };
    return exports;
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Streets;
} else {
    window.Tablesort = Streets;
}

},{}],29:[function(require,module,exports){
var counter = 0;
module.exports.makeId = function() {
    return 'marker-' + (+new Date()).toString(36) + (counter++).toString(36);
};

},{}],30:[function(require,module,exports){
exports.zoomToggle = function() {
    var view = this; // `this` is the map object
    var zoomIn = $('#zoom-in');
    var zoomOut = $('#zoom-out');
    var max = view.getMaxZoom();
    var min = view.getMinZoom();

    if (view.getZoom() >= max) {
        zoomIn.addClass('disabled');
    } else {
        zoomIn.removeClass('disabled');
    }

    if (view.getZoom() <= min) {
        zoomOut.addClass('disabled');
    } else {
        zoomOut.removeClass('disabled');
    }
};

exports.zoomIn = function(ev) {
    var zoom = this.map.getZoom(),
        max = this.map.getMaxZoom();

    if (zoom <= max) this.map.zoomIn(1);
    return false;
};

exports.zoomOut = function(ev) {
    var zoom = this.map.getZoom(),
        min = this.map.getMinZoom();

    if (zoom >= min) this.map.zoomOut(1);
    return false;
};

},{}],31:[function(require,module,exports){
var simplestylePath = require('./lib/simplestyle'),
    getCenter = require('./lib/getcenter'),
    geojsonHint = require('geojsonhint'),
    util = require('./lib/util'),
    defaults = require('./lib/defaults'),
    fs = require('fs');

var templates = {
    polygon_edit: _("<div class='pin-bottom row1 fill-gray keyline-top'>\n  <div class='pin-bottom row1 js-tabs tabs'><!--\n    --><a href='#poly-edit-text' class='col4 active'>Text</a><!--\n    --><a href='#edit-poly-stroke' class='col4'><!--\n        --><span id='color-stroke' class='color' style='background-color:<%=feature.properties.stroke%>'></span>Stroke</a><!--\n    --><a href='#edit-poly-fill' class='col4'><!--\n        --><span id='color-fill' class='color' style='background-color:<%=feature.properties.fill%>'></span>Fill</a>\n  </div>\n  <div class='pin-right'>\n    <a href='#<%=feature.properties.id%>' class='pad1 quiet icon trash inline round'></a>\n  </div>\n</div>\n\n<div class='clip sliding h active1 col12 row5'>\n  <div id='poly-edit-text' class='animate col12 clearfix row5 pad2'>\n    <div class='space-bottom1'>\n      <input type='text' placeholder='Untitled' class='big stretch' value='<%=_(feature.properties.title).escape()%>' name='title' />\n      <label>Name this polygon</label>\n    </div>\n    <div>\n      <textarea placeholder='Description' class='big stretch js-noTabExit' name='description'><%=feature.properties.description%></textarea>\n      <label>Add a description</label>\n    </div>\n  </div>\n  <div id='edit-poly-stroke' class='animate col12 row5 pad2'>\n    <% print(stroke_template(_({\n        context: 'marker'\n      }).defaults(obj.feature))); %>\n  </div>\n  <div id='edit-poly-fill' class='animate col12 row5 pad2'>\n    <% print(fill_template(_({\n        context: 'marker'\n      }).defaults(obj.feature))); %>\n  </div>\n</div>\n").template(),
    line_edit: _("<div class='pin-bottom row1 fill-gray keyline-top'>\n  <div class='pin-bottom row1 js-tabs tabs'><!--\n    --><a href='#poly-edit-text' class='col6 active'>Text</a><!--\n    --><a href='#edit-poly-stroke' class='col6'><span id='color-stroke' class='color' style='background-color:<%=feature.properties.stroke%>'></span>Stroke</a>\n  </div>\n  <div class='pin-right'>\n    <a href='#<%=feature.properties.id%>' class='pad1 quiet icon trash inline round'></a>\n  </div>\n</div>\n\n<div class='clip sliding h active1 col12 row5'>\n  <div id='poly-edit-text' class='animate col12 clearfix row5 pad2'>\n    <div class='space-bottom1'>\n      <input type='text' placeholder='Untitled' class='big stretch' value='<%=_(feature.properties.title).escape()%>' name='title' />\n      <label>Name this line</label>\n    </div>\n    <div>\n      <textarea placeholder='Description' class='big stretch js-noTabExit' name='description'><%=feature.properties.description%></textarea>\n      <label>Add a description</label>\n    </div>\n  </div>\n  <div id='edit-poly-stroke' class='animate col12 row5 pad2'>\n    <% print(stroke_template(_({\n        context: 'marker'\n      }).defaults(obj.feature))); %>\n  </div>\n</div>\n").template(),
    marker_tray: _("<a class='truncate strong quiet keyline-bottom block contain small tray-item' id='<%=properties.id%>' href='#edit-<%=properties.id%>'>\n  <%\n    var icon;\n    switch (geometry.type) {\n      case 'Point':\n        icon = 'marker';\n      break;\n      case 'LineString':\n        icon = 'polyline';\n      break;\n      case 'Polygon':\n        icon = 'polygon';\n      break;\n    }\n  %>\n  <span title='<%= icon %>' class='icon <%= icon %> inline quiet'></span>\n  <span class='title pad1y'><%= $('<div>' + properties.title + '</div>').text() %></span>\n  <span class='icon trash quiet button unround'></span>\n</a>\n").template(),
    marker_edit: _("<div class='pin-bottom fill-gray keyline-top row1'>\n  <div class='pin-bottom row1 js-tabs tabs'><!--\n    --><a href='#marker-edit-text' class='col3 active'>Text</a><!--\n    --><a href='#marker-edit-style' class='col3'>Style</a><!--\n    --><a href='#marker-edit-symbol' class='col3'>Symbol</a><!--\n    --><a href='#marker-edit-coordinates' class='col3'>Lat/Lon</a>\n  </div>\n  <div class='pin-right'>\n    <a href='#<%=feature.properties.id%>' class='pad1 quiet icon trash inline round'></a>\n  </div>\n</div>\n\n<div class='clip sliding h active1 col12 row5'>\n  <div id='marker-edit-text' class='animate col12 clearfix row5 pad2'>\n    <div class='space-bottom1'>\n      <input type='text' placeholder='Untitled' class='small short stretch' value='<%=_(feature.properties.title).escape()%>' name='title' />\n      <label>Name this feature</label>\n    </div>\n    <div>\n      <textarea placeholder='Description' class='small stretch js-noTabExit' name='description'><%=feature.properties.description%></textarea>\n      <label>Add a description</label>\n    </div>\n  </div>\n  <div id='marker-edit-style' class='animate col12 row5 pad2'>\n    <% print(style_template(_({\n        context: 'marker'\n      }).defaults(feature))); %>\n  </div>\n  <div id='marker-edit-symbol' class='animate col12 row5 pad2'>\n    <% print(symbol_template(_({\n        context: 'marker'\n      }).defaults(feature))); %>\n  </div>\n  <div id='marker-edit-coordinates' class='animate col12 row5 pad2'>\n    <div class='col6'>\n      <fieldset class='with-icon'>\n        <span class='icon u-d-arrow quiet'></span>\n        <input id='latitude' name='latitude' type='number' min='-90' max='90' class='code col12 js-noTabExit'\n            step='any'\n            value=\"<%= feature.geometry.coordinates[1] !== undefined ? feature.geometry.coordinates[1] : 0 %>\" />\n        <label>Latitude</label>\n      </fieldset>\n    </div>\n    <div class='col6'>\n      <fieldset class='with-icon'>\n        <span class='icon l-r-arrow quiet'></span>\n        <input id='longitude' name='longitude' type='number' min='-180' max='180' class='code col12'\n            step='any'\n            value=\"<%= feature.geometry.coordinates[0] !== undefined ? feature.geometry.coordinates[0] : 0 %>\" />\n        <label>Longitude</label>\n      </fieldset>\n    </div>\n  </div>\n</div>\n</div>\n\n").template(),
    stroke: _("<div id='poly-edit-stroke' class='clearfix col12 animate row4'>\n  <div class='small clearfix pad1y space-bottom1'>\n    <div class='style-input-wrapper col4'>\n      <fieldset class='with-icon'>\n        <span class='icon quiet opacity'></span>\n        <input id='stroke-opacity' name='stroke-opacity' type='number' min='0' max='1' step='.1' class='col12 code js-noTabExit' <%= obj.properties['stroke-opacity'] ? ' value=\"' + obj.properties['stroke-opacity'] + '\"' : '' %> />\n\n        <div class='increment increase icon plus keyline-left'></div>\n        <div class='increment decrease icon minus keyline-left keyline-top'></div>\n      </fieldset>\n    </div>\n    <div class='style-input-wrapper col4'>\n      <fieldset class='with-icon'>\n        <span class='icon quiet adjust-stroke'></span>\n        <input id='stroke-width' name='stroke-width' type='number' min='0' max='20' class='code col12' <%= obj.properties['stroke-width'] ? ' value=\"' + obj.properties['stroke-width'] + '\"' : '' %> />\n\n        <div class='increment increase icon plus keyline-left'></div>\n        <div class='increment decrease icon minus keyline-left keyline-top'></div>\n      </fieldset>\n    </div>\n    <div class='style-input-wrapper col4'>\n      <input id='stroke' name='stroke' type='text' class='code center col12 color-hex' maxlength='7' <%= obj.properties['stroke'] ? ' placeholder=\"' + obj.properties['stroke'] + '\"' : '' %> />\n    </div>\n\n  </div>\n  <div class='clearfix clip round'>\n    <% _(App.pigment_colors).each(function(color) { %>\n      <input id='<%= context %>-stroke-<%=color%>' class='label-select' type='radio' data-geojson='stroke.<%= color %>' name='stroke' value='#<%=color%>' <%= obj.properties['stroke'] === '#' + color ? 'checked' : '' %> />\n      <label for='<%= context %>-stroke-<%=color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%=color%>'></label>\n    <% }); %>\n  </div>\n</div>\n").template(),
    fill: _("<div id='poly-edit-fill' class='clearfix col12 animate row4'>\n  <div class='small clearfix pad1y space-bottom1'>\n\n    <div class='style-input-wrapper col4'>\n      <fieldset class='clearfix with-icon'>\n        <span class='icon quiet opacity'></span>\n        <input id='fill-opacity' name='fill-opacity' type='number' min='0' max='1' step='.1' class='col12 code js-noTabExit'<%= obj.properties['stroke-opacity'] ? ' value=\"' + obj.properties['fill-opacity'] + '\"' : '' %> />\n\n        <div class='increment increase icon plus keyline-left'></div>\n        <div class='increment decrease icon minus keyline-left keyline-top'></div>\n      </fieldset>\n    </div>\n    <div class='style-input-wrapper margin4 col4'>\n      <input id='fill' name='fill' type='text' class='code center col12' maxlength='7' <%= obj.properties['fill'] ? ' placeholder=\"' + obj.properties['fill'] + '\"' : '' %> />\n    </div>\n\n  </div>\n  <div class='clearfix clip round'>\n    <% _(App.pigment_colors).each(function(color) { %>\n      <input id='<%= context %>-fill-<%=color%>' class='label-select' type='radio' data-geojson='fill.<%= color %>' name='fill' value='#<%=color%>' <%= obj.properties['fill'] === '#' + color ? 'checked' : '' %> />\n      <label for='<%= context %>-fill-<%=color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%=color%>'></label>\n    <% }); %>\n  </div>\n</div>\n").template(),
    symbol: _("<div class='pager js-tabs pad1 pill pin-right'>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big up round-top quiet'></a>\n  <a href='#marker-edit-symbol-pages' class='col12 quiet full button icon big down round-bottom quiet'></a>\n</div>\n<div id='marker-edit-symbol-pages' class='marker-edit-symbol sliding v active1 clip row4'>\n  <%\n  if (!window.MakiFull) {\n    var icons = window.Maki.slice(0);\n    icons.unshift({ alpha:true, icon:'' });\n    icons = icons.concat(_(10).chain().range().map(function(v) { return { alpha:true, icon:v } }).value());\n    icons = icons.concat(_(26).chain().range().map(function(v) { return { alpha:true, icon:String.fromCharCode(97 + v) } }).value());\n    window.MakiFull = icons;\n  }\n  _(window.MakiFull).chain()\n  .filter(function(icon) { return !icon.tags || icon.tags.indexOf('deprecated') === -1 })\n  .groupBy(function(icon, i) {\n    return Math.floor(i/60);\n  })\n  .each(function(group, i) { %>\n    <div class='animate col12 clearfix row5'>\n    <% _(group).each(function(icon) { %>\n        <input id='<%= context %>-marker-symbol-<%=icon.icon%>' class='label-select' data-geojson='marker-symbol.<%= icon.icon %>' type='radio' name='marker-symbol' value='<%=icon.icon%>' <%= obj['marker-symbol'] === icon.icon ? 'checked' : '' %> />\n      <% if (icon.alpha) { %>\n      <label for='<%= context %>-marker-symbol-<%=icon.icon%>' class='col1 symbol center round'><span class='maki-icon strong alpha'><%=icon.icon%></span></label>\n      <% } else { %>\n      <label for='<%= context %>-marker-symbol-<%=icon.icon%>' class='col1 symbol center round' title='<%=icon.name%>'><span class='maki-icon <%=icon.icon%>'></span></label>\n      <% } %>\n    <% }); %>\n  </div>\n  <% }); %>\n</div>\n").template(),
    style: _("<div class='clearfix space-bottom js-tabs pill'><!--\n--><input id='<%= context %>-marker-size-small' class='label-select' data-geojson='marker-size.small' type='radio' name='marker-size' value='small' <%= obj.properties['marker-size'] === 'small' ? 'checked' : '' %> /><!--\n--><label for='<%= context %>-marker-size-small' class='col3 button'>Small</label><!--\n--><input id='<%= context %>-marker-size-medium' class='label-select' data-geojson='marker-size.medium' type='radio' name='marker-size' value='medium' <%= obj.properties['marker-size'] === 'medium' ? 'checked' : '' %> /><!--\n--><label for='<%= context %>-marker-size-medium' class='col3 button'>Medium</label><!--\n--><input id='<%= context %>-marker-size-large' class='label-select' data-geojson='marker-size.large' type='radio' name='marker-size' value='large' <%= obj.properties['marker-size'] === 'large' ? 'checked' : '' %> /><!--\n--><label for='<%= context %>-marker-size-large' class='col3 button'>Large</label>\n  <div class='col3 row1 style-input-wrapper'>\n    <input id='marker-color' name='marker-color' type='text' class='small center code col12 row1 js-noTabExit color-hex' maxlength='7' style=\"padding: 10px 5px;\" <%= obj.properties['marker-color'] ? ' placeholder=\"' + obj.properties['marker-color'] + '\"' : 'placeholder=\"#7d7d7d\"' %> />\n  </div>\n</div>\n<div class='clearfix clip round'>\n  <% _(App.colors).each(function(color) { %>\n  <input id='<%= context %>-marker-color-<%=color%>' class='label-select' type='radio' data-geojson='marker-color.<%= color %>' name='marker-color' value='#<%=color%>' <%= obj.properties['marker-color'] === '#' + color ? 'checked' : '' %> />\n  <label for='<%= context %>-marker-color-<%=color%>' class='dark swatch center clip icon check row1 col1' style='background-color:#<%=color%>'></label>\n  <% }); %>\n</div>\n").template()
};

/*
 * API
 *
 * .addFeature: add a GeoJSON feature to the layer
 * .syncUI: make the markers try match features in the layer
 * .enforceDefaults: ensure that a layer has properties, an id, and order
 */
module.exports = function(App, editor) {
    var exports = _({}).extend(Backbone.Events);
    var halo;

    exports.layer = null;
    exports.model = null;
    exports.editing = null;

    exports.onhashchange = function() {
        if (window.location.hash === '#app') exports.clear();
    };

    exports.addFeature = function(feature) {
        exports.layer.addData(feature);
        return feature;
    };

    function removeHighlight() {
        if (editor.map.hasLayer(halo)) editor.map.removeLayer(halo);
    }

    exports.highlightFeature = function(feature) {
        removeHighlight();
        if (feature.geometry.type == 'Point') {
            var coords = feature.geometry.coordinates;
            halo = L.circleMarker([coords[1], coords[0]], {
                radius: 30,
                className: 'marker-highlight'
            });
            editor.map.addLayer(halo);
        }
    };

    exports.enforceDefaults = function(feature) {
        feature.properties = feature.properties || {};
        feature.properties.title = feature.properties.title || '';
        feature.properties.description = feature.properties.description || '';
        feature.properties.id = feature.properties.id || util.makeId();

        var nextOrder = exports.geojson().features.length + 1;
        feature.properties.__order__ = nextOrder;
        return feature;
    };

    // Initialize a fully-new feature, including properties and default styles.
    exports.initializeFeature = function(feature) {
        feature = exports.enforceDefaults(feature);
        feature.properties = _.defaults(feature.properties, defaults[feature.geometry.type]);
        return feature;
    };

    // `silent` can be set to redraw the UI without signaling a change of
    // the Save UI, as used when the page initially loads.
    exports.syncUI = function(silent) {
        var $tray = $('#marker-tray'),
            $items = $tray.find('.tray-item'),
            map = idMap(),
            ids = _.keys(map),
            dirty = false;
        $('#features-tab').text((ids.length > 1 ? ids.length : '') + ' features');
        $items.map(function(idx) {
            var id = $(this).attr('id');
            if (!map[id]) {
                $(this).remove();
                dirty = true;
            } else {
                var title = map[id].toGeoJSON().properties.title;
                title = (typeof title === 'string') ?
                    title.replace(/<[^<]+>/g, '').trim() :
                    title.toString();

                $(this).find('.title').text(title);
                ids = _.without(ids, id);
            }
        });
        ids.forEach(function(id) {
            $tray.append(templates.marker_tray(map[id].toGeoJSON()));
            dirty = true;
        });
        $tray.sortable('destroy').sortable();
        if (dirty && !silent) editor.changed();
        // Enforce DOM emptiness for empty state selectors.
        if (!$('#marker-tray .tray-item').size()) $('#marker-tray').empty();
    };

    var _id = 0;

    exports.concat = function(data) {
        data.features
            .filter(isValid)
            .map(exports.initializeFeature)
            .map(exports.addFeature)
            .map(function(feature) {
                exports.refresh(feature.properties.id, true);
            });
        exports.syncUI();
        exports.fitFeatures();
        analytics.track('Concatenated Markers');

        function isValid(f) {
            var hints = geojsonHint.hint(JSON.stringify(f));
            if (hints.length) return false;
            return (f.geometry &&
                (f.geometry.type == 'Polygon' ||
                f.geometry.type == 'Point' ||
                f.geometry.type == 'LineString'));
        }
    };

    exports.setAll = function(data) {
        exports.layer.clearLayers();
        exports.concat(data);
    };

    exports.fitFeatures = function() {
        var bounds = exports.layer.getBounds();
        if (bounds.isValid()) editor.map.fitBounds(bounds, {
            paddingTopLeft: [0, 240],
            paddingBottomRight: [0, 40]
        });
    };

    // Clear active editing state.
    exports.clear = function() {
        if (exports.layer) exports.layer.eachLayer(disableLayer);
        $('#marker-edit').empty();
        removeHighlight();
        delete exports.editing;
    };

    // Open the editing UI for a marker given id
    exports.edit = function(id, noedit) {
        // Don't re-initialize edit interface when clicking on current marker.
        if (exports.editing && exports.editing.properties.id === id) return;

        // Enable dragging only on active marker
        exports.layer.eachLayer(disableLayer);

        var layer = layerById(id);
        exports.highlightFeature(layer.toGeoJSON());

        var feature = layer.toGeoJSON();
        var props = feature.properties;
        var popup = (props.title || props.description) &&
            L.mapbox.marker.createPopup(feature);

        // Bind popup
        if (popup) {
            layer.bindPopup(popup, { closeButton: false });
        } else {
            layer.closePopup();
        }

        // center if geometry is outside of view
        var geom = (layer.feature.geometry.type == "Point") ? layer._latlng : layer.getBounds();
        if (!editor.map.getBounds().contains(geom)) {
            if (layer.feature.geometry.type == "Point") {
                editor.map.panTo(geom);
            } else {
                editor.map.fitBounds(geom);
            }
        }

        if (!noedit) {
            if (layer instanceof L.Marker) {
                layer._icon.className += ' marker-editing';
                layer.dragging.enable();
            } else {
                layer.editing.enable();
            }
        }
        editor.map.closePopup();
        layer.openPopup(getCenter(layer));
        exports.editing = layer.toGeoJSON();

        var $selectedMarker = $('#' + id);

        var type = layer.toGeoJSON().geometry.type;
        if (type === 'Point') {
            var coords = exports.editing.geometry.coordinates;
            coords = L.latLng(coords[1], coords[0]).wrap();
            exports.editing.geometry.coordinates[0] = coords.lng;
            exports.editing.geometry.coordinates[1] = coords.lat;
            $('#marker-edit').html(templates.marker_edit({
                feature: exports.editing,
                symbol_template: templates.symbol,
                style_template: templates.style
            }));
        } else {
            var template = (type === 'Polygon') ?
                templates.polygon_edit:
                templates.line_edit;
            $('#marker-edit').html(template({
                feature: exports.editing,
                fill_template: templates.fill,
                stroke_template: templates.stroke
            }));
            window.location.hash = '#data';
        }

        exports.trigger('edit', type.toLowerCase(), true);
    };

    // Delete the given marker.
    exports.del = function(id) {
        if (!exports.layer) throw new Error('No layer to edit');

        exports.clear();
        exports.layer.eachLayer(removeLayer);
        exports.model.set('features', exports.layer.toGeoJSON().features);
        exports.syncUI();

        function removeLayer(l) {
            if (l.toGeoJSON().properties.id === id) {
                exports.layer.removeLayer(l);
            }
        }

        exports.trigger('del');
    };

    // Save the markers.
    exports.save = function(callback) {
        if (!exports.model) return callback();
        var features = exports.layer.toGeoJSON().features;
        exports.model.set('features', serializeOrder(features));
        App.save(exports.model, callback);
    };


    exports.geojson = function() {
        return exports.layer.toGeoJSON();
    };

    // Refresh the icon, popup on a given feature to show a live preview
    // while editing
    //
    // `silent` means that this is part of a large group of features
    exports.refresh = function(id, silent) {
        var l = layerById(id),
            feature = l.toGeoJSON();

        // Set editing class + set the new default marker template.
        if (exports.editing && exports.editing.properties.id === id) {
            if (l instanceof L.Marker) {
                l._icon.className += ' marker-editing';
                defaults.Point = _(exports.editing.properties).reduce(function(memo, val, key) {
                    if ((/marker-(color|symbol|size)/).test(key)) memo[key] = val;
                    return memo;
                }, { title:'', description:'' });
                l.setIcon(L.mapbox.marker.icon(feature.properties));
            } else {
                defaults[feature.geometry.type] = _(exports.editing.properties).reduce(function(memo, val, key) {
                    if ((/stroke/).test(key)) memo[key] = val;
                    if ((/fill/).test(key)) memo[key] = val;
                    return memo;
                }, { title:'', description:'' });
                l.setStyle(simplestylePath(feature));
            }
        }

        // Refresh popup, disable fading for re-rendering.
        var fade = editor.map.options.fadeAnimation;
        if (l._popup) editor.map.options.fadeAnimation = false;

        var props = feature.properties;
        var popup = (props.title || props.description) &&
            L.mapbox.marker.createPopup(feature);

        if (popup) {
            l.unbindPopup();
            l.bindPopup(popup, { closeButton: false });
            if (!silent) l.openPopup(getCenter(l));
        } else {
            l.closePopup();
            l.unbindPopup();
        }

        // Update color swatches in vtabs
        $('#color-stroke').css('background',props.stroke);
        $('#color-fill').css('background',props.fill);

        editor.map.options.fadeAnimation = fade;
    };

    // Initialize.
    // Skip fetch if map is new -- there are no prior markers made.
    var fetch = !editor.model.get('new') ? App.fetch : function(url,cb) { return cb(); };

    fetch('/api/Markers/' + editor.model.id, markersLoaded);

    function markersLoaded(err, model) {
        if (err && err.status !== 404) return Views.modal.show('err', err);
        if (!model) {
            exports.model = new Backbone.Model({ id: editor.model.id, features: [] });
            exports.model.url = App.api + '/api/Markers/' + editor.model.id;
        } else {
            exports.model = model;
        }

        exports.layer = new L.geoJson(null, {
            pointToLayer: pointToLayer,
            style: simplestylePath
        }).addTo(editor.map)
            .on('layeradd', augmentLayer)
            .on('click', layerClick);

        function pointToLayer(feature, latlon) {
            if (!feature.properties) feature.properties = {};
            return L.mapbox.marker.style(feature, latlon);
        }

        exports.layer.addData(assignOrder(exports.model.toJSON()));

        $('#marker-tray')
            .sortable()
            .bind('sortupdate', onSortUpdate);

        exports.syncUI(true);

        // @TODO done currently to set dragging to disabled on init.
        exports.clear();

        // needed here because the project_info template is rendered before markers are initialized
        if (exports.layer.toGeoJSON().features.length) $('#downloads').show();

        function augmentLayer(e) {
            var l = e.layer;
            l.on('dragstart', removeHighlight)
                .on('dragend', onfeatureedit)
                .on('edit', onfeatureedit)
                .on('move', onfeatureedit);
            // if for multipolygon error, need to investigate
            if (l.options) l.options.draggable = true;
        }

        function onfeatureedit(e) {
            var feature = e.target.toGeoJSON();
            exports.highlightFeature(feature);
            exports.model.set('features', exports.layer.toGeoJSON());
            if (e.type == 'dragend') {
                $('#latitude').val(feature.geometry.coordinates[1]);
                $('#longitude').val(feature.geometry.coordinates[0]);
            }
            editor.changed();
        }
    }

    function assignOrder(f) {
        for (var i = 0; i < f.features.length; i++) {
            if (!f.features[i].properties) {
                f.features[i].properties = {};
                f.features[i].properties.id = 'marker-' + (+new Date()).toString(36);
            }
            f.features[i].properties.__order__ = i;
        }
        return f;
    }

    function panToLayer(map, feature) {
        var zoomLevel;
        if (feature instanceof L.Marker) {
            map.setView(feature.getLatLng());
        } else if ('getBounds' in feature && feature.getBounds().isValid()) {
            map.fitBounds(feature.getBounds(), {
                paddingTopLeft: [0, 240],
                paddingBottomRight: [0, 40]
            });
        }
    }

    function layerClick(e) {
        if (App.canedit) {
            exports.edit(e.layer.toGeoJSON().properties.id);
            window.location.hash = '#data';
        }
    }

    function onSortUpdate(ev, ui) {
        var map = idMap();
        $('#marker-tray a').each(function(idx) {
            map[$(this).attr('id')].toGeoJSON().properties.__order__ = idx;
        });
        editor.changed();
    }

    function disableLayer(l) {
        if (l instanceof L.Marker) {
            l._icon.className = l._icon.className.replace(/ marker-editing/g, '');
            l.dragging.disable();
            l.closePopup();
        } else {
            // multipolygons don't like this, need a way of handling them
            if (l.editing) l.editing.disable();
        }
    }

    function idMap() {
        var m = {};
        exports.layer.eachLayer(function(l) {
            m[l.toGeoJSON().properties.id] = l;
        });
        return m;
    }

    function layerById(id) {
        return idMap()[id];
    }

    exports.layerById = layerById;

    return exports;
};

function serializeOrder(features) {
    return features
        .sort(sortByOrder)
        .map(removeOrder);
}

function sortByOrder(a, b) {
    return a.properties.__order__ - b.properties.__order__;
}

function removeOrder(feat) {
    var cloned = _.clone(feat);
    cloned.properties = _.clone(cloned.properties);
    delete cloned.properties.__order__;
    return cloned;
}

},{"./lib/defaults":20,"./lib/getcenter":23,"./lib/simplestyle":27,"./lib/util":29,"fs":33,"geojsonhint":10}],32:[function(require,module,exports){
var fs = require('fs');
var Streets = require('./lib/streets');

var templates = {
    style_tint: _("<%\n  var keys = {};\n  keys['whiz'] = 'Recipe';\n  keys['streets'] = 'Streets';\n  if (type !== 'satellite') keys['buildings'] = 'Buildings';\n  if (type === 'streets') keys['landuse']   = 'Areas';\n  if (type === 'terrain') keys['base.live-landuse-tr'] = 'Areas';\n  if (type !== 'satellite') keys['water'] = 'Water';\n  if (type === 'streets') keys['bg'] = 'Land';\n  if (type === 'terrain') keys['base.live-land-tr'] = 'Terrain';\n  if (type === 'satellite') keys['base.live-satellite'] = 'Satellite';\n  %>\n<div class='animate col12 clip keyline-top style-container sliding h active3 row4'>\n  <% _(keys).each(function(label, id) { %>\n  <% if (id === 'whiz') { %>\n  <div id='style-swatches' class='animate col12 row4 pad1y pad2x'>\n    <div class='round clip col12 clearfix'>\n      <% _(recipes.streets.swatches).each(function(color) { %>\n      <input id='style-swatches-<%=color%>' class='label-select' type='radio' name='style-tint-whiz-swatches' value='#<%=color%>' />\n      <label for='style-swatches-<%=color%>' class='swatch center big clip icon dark check col4' style='background-color:#<%=color%>'></label>\n      <% }); %>\n    </div>\n    <div class='col12 pad1y'>\n      <span class='hint small icon info'>Select a preset style.</span>\n      <a href='#style' id='palette-custom' class='fr small palette icon levels'>Customize</a>\n    </div>\n  </div>\n  <% } %>\n  <div id='style-tint-<%=id.replace('.','-')%>' class='animate col12 color-picker row4 pad1y pad2x'>\n    <input type='hidden' name='id' value='<%=id%>' />\n    <% if (id !== 'whiz') { %>\n    <div class='clearfix'>\n      <div class='col8 animate contain picker'>\n        <div class='color-sl'><a></a></div>\n        <div class='color-h clip'><a></a></div>\n        <fieldset class='hex'>\n          <input type='text' placeholder='#000000' class='center code animate stretch color-hex js-noTabExit' maxlength='7'/>\n        </fieldset>\n      </div>\n      <div class='row3 col4 filter-sliders'>\n        <label class='block quiet truncate'>Filter intensity</label>\n        <small class='clearfix contain'>\n          <input class='clamp col8' name='hd' type='range' value='0' min='0' max='0.5' step='0.01' />\n          <span class='col2 micro center'>H</span>\n          <span class='col1 micro quiet value'></span>\n        </small>\n        <small class='clearfix contain'>\n          <input class='clamp col8' name='sd' type='range' value='0' min='0' max='0.5' step='0.01' />\n          <span class='col2 micro center'>S</span>\n          <span class='col1 micro quiet value'></span>\n        </small>\n        <small class='clearfix contain'>\n          <input class='clamp col8' name='ld' type='range' value='0' min='0' max='0.5' step='0.01' />\n          <span class='col2 micro center'>L</span>\n          <span class='col1 micro quiet value'></span>\n        </small>\n        <% if (['bg','base.live-satellite','base.live-land-tr'].indexOf(id) === -1) { %>\n        <small class='clearfix contain'>\n          <input class='clamp col8' name='a' type='range' value='0' min='0' max='1' step='0.01' />\n          <span class='col2 micro center'>A</span>\n          <span class='col1 micro quiet value'></span>\n        </small>\n        <% } %>\n      </div>\n    </div>\n    <div class='col12 pad1y clearfix'>\n      <% if (['base.live-satellite','base.live-land-tr'].indexOf(id) === -1) { %>\n      <a href='#style-tint-<%=id.replace('.','-')%>' class='small quiet disable icon eye'>Hide</a>\n      <a href='#style-tint-<%=id.replace('.','-')%>' class='small quiet enable icon noeye'>Show</a>\n      <% } %>\n      <% if (id !== 'bg') { %>\n        <a href='#' class='pad1x small quiet icon l-r-arrow inline invert'>Invert</a>\n      <% } %>\n      <a href='#style' id='palette-streets' class='fr small palette icon close'>Discard palette</a>\n    </div>\n    <% } else { %>\n    <div class='col12 animate contain picker'>\n      <div class='color-sl'><a></a></div>\n      <div class='color-h clip'><a></a></div>\n      <fieldset class='hex'>\n        <input type='text' placeholder='#000000' class='center code animate stretch color-hex js-noTabExit' maxlength='7'/>\n      </fieldset>\n    </div>\n    <div class='col12 pad1y clearfix'>\n      <span class='hint small inline icon info'>Generate a new style.</span>\n      <a href='#style' id='palette-custom' class='fr small palette icon levels'>Customize</a>\n    </div>\n    <% } %>\n  </div>\n<% }); %>\n</div>\n<div class='palette-tabs animate clip row1 pin-top'>\n  <div id='palette-tabs-recipes' class='js-tabs pill animate row1 pin-top pad2x'>\n    <% _(recipes).each(function(recipe, id) { %>\n    <a href='#style-tint' id='palette-<%=id%>' class='<%=id === \"streets\" ? \"active\" : \"\"%> button palette col3'><%= recipe.name.replace('Streets','Presets') %></a>\n    <% }); %>\n  </div>\n  <div class='color-tabs animate row1 clip contain animate pin-top pad2x'><!--\n    <% _(keys).each(function(label, id) { %>\n    <% if (id === 'whiz') { %>\n    --><a href='#style-tint-whiz-swatches' class='hidden'></a><!--\n    --><a href='#style-tint-whiz' class='hidden'></a><!--\n    <% } else { %>\n    --><a href='#style-tint-<%=id.replace('.','-')%>' class='center quiet row1 pad1 contain fl <%= id === 'streets' ? 'active' : '' %>'>\n      <span class='swatch animate pin-top pin-bottom' id='style-tab-<%=id.replace('.','-')%>'><span class='small'><%=label.replace(/Building*s?/i,'bdgs').replace('landuse','areas')%></span></span>\n    </a><!--\n    <% } %>\n    <% }); %>\n  --></div>\n</div>\n").template()
};

module.exports = function(App, editor) {
    var exports = {};

    // Work on styles get stashed here if the map `type` is switched so
    // that they can be restored later if the type is switched back.
    exports.stash = {};

    // The current set of styles being edited.
    exports.styles = null;

    // Return the parent color picker for a given event.
    exports.id = function(ev) {
        return $('input[name=id]', $(ev.currentTarget).parents('.color-picker')).val();
    };

    // Refresh the current map layer to reflect style changes.
    // @TODO should the _setTileJSON method be public upstream?
    exports.refresh = _(function() {
        var plus = _(editor.model.get('layers')).filter(function(id) { return id.indexOf('base.') === -1; });
        var layers = Streets.styles2layers(exports.styles).concat(plus);
        if (_(editor.model.get('layers')).isEqual(layers)) return;
        editor.model.set({layers:layers});
    }).debounce(500);

    // Set/get the abstract "type" represented by a combination of styles.
    exports.type = function(val) {
        if (val && !(/^(streets|satellite|terrain)$/).test(val))
            throw new Error('style: type must be one of streets, terrain, satellite');

        // A stash for this type exists. Switch to it.
        // @TODO handling other layers this way? Or do they exist in
        // some other hash/management config entirely?
        if (val && exports.stash[val]) {
            exports.styles = exports.stash[val];
        } else if (val) {
            exports.styles = exports.stash[val] = Streets.styles({
                streets: ['base.mapbox-streets+bg-e8e0d8_landuse_water_buildings_streets'],
                terrain: ['base.live-land-tr','base.live-landuse-tr','base.mapbox-streets+bg-e8e0d8_landuse_water_buildings_streets'],
                satellite: ['base.live-satellite','base.mapbox-streets+streets-0.00x0.00;0.00x0.00;1.00x0.00;0x1.00']
            }[val]);
        }
        return Streets.type(exports.styles);
    };

    // Set/get the l10n option of base.mapbox-streets.
    exports.l10n = function(val) {
        if (typeof val === 'string') {
            exports.styles.l10n = val;
        }
        return exports.styles.l10n || '';
    };

    // Set/get the scale option of base.mapbox-streets.
    exports.scale = function(val) {
        if (val) exports.styles.scale = val;
        return exports.styles.scale;
    };

    // Set/get the active whiz palette.
    exports.palette = function(id, skiprefresh) {
        if (!exports.styles.whiz) throw new Error('No whiz style found.');
        if (id) {
            $('#palette-' + id).addClass('active').siblings().removeClass('active');
            $('#style-tint .sliding.h')
                .removeClass('active1 active2 active3 active4 active5 active6 active7')
                .addClass(Streets.recipes[id].swatches ? 'active1' : 'active2');
            var palette = exports.palettes(exports.styles.whiz)[id];
            _(palette).each(function(hsl, i) {
                if (!exports.styles[i]) return;
                exports.styles[i].h = hsl.h;
                exports.styles[i].s = hsl.s;
                exports.styles[i].l = hsl.l;
                exports.styles[i].a = hsl.a;
                exports.styles[i].hd = hsl.hd;
                exports.styles[i].sd = hsl.sd;
                exports.styles[i].ld = hsl.ld;
                exports.styles[i].on = hsl.on;
                exports.styles[i].inv = !!hsl.inv;
                exports.render(i, null, skiprefresh);
            });
            if (palette.swatch) $('#style-swatches-' + palette.swatch).prop('checked', true);
            exports.styles.whiz.palette = id;
        }
        return exports.styles.whiz.palette;
    };

    // Generate palette data from an HSL.
    exports.palettes = function(hsl) {
        return _(Streets.recipes).reduce(function(memo, op, id) {
            memo[id] = op.hsl(hsl, exports.type());
            return memo;
        }, {});
    };

    // Render results of alterations to form and map display.
    exports.render = function(id, skipinput, skiprefresh) {
        // Bail if requested id has no style.
        if (typeof exports.styles[id] !== 'object') return;

        var s = exports.styles[id];
        var p = $(document.getElementById('style-tint-' + id.replace('.','-')));
        var tab = $(document.getElementById('style-tab-' + id.replace('.','-')));
        $('div.color-h > a',p).css({'left':s.h*100+'%'});
        $('div.color-sl',p).css({'background-color':'#'+Streets.style2hue(s)});
        $('div.color-sl > a',p).css({'left':s.s*100+'%', 'bottom':Math.min(1, s.l / (1-(s.s*0.5)))*100+'%'});
        $('input.color-hex',p).css({'background-color':Streets.style2rgba(s)});
        $('fieldset.hex',p)[s.l > 0.5 ? 'removeClass' : 'addClass']('dark');
        tab.css({'background-color':Streets.hsl2rgba(Streets.style2swatch(s, id))});
        if (s.inv) {
            $(tab)[s.l < 0.75 || s.ld > 0.4 ? 'addClass' : 'removeClass']('dark');
        } else {
            $(tab)[s.l > 0.5 || s.ld > 0.25 ? 'removeClass' : 'addClass']('dark');
        }
        p[s.inv?'addClass':'removeClass']('inverted');
        p[s.on?'removeClass':'addClass']('disabled');
        tab[s.on?'removeClass':'addClass']('disabled');
        if (!skipinput) {
            $('input[name="hd"]', p).val(0.5 - s.hd);
            $('input[name="sd"]', p).val(0.5 - s.sd);
            $('input[name="ld"]', p).val(0.5 - s.ld);
            $('input[name="a"]', p).val(s.a);
            $('input.color-hex',p).val('#' + Streets.style2hex(s));
        }
        var shorthd = Math.floor((1 - s.hd) * 100) + '%';
        var shortsd = Math.floor((1 - s.sd) * 100) + '%';
        var shortld = Math.floor((1 - s.ld) * 100) + '%';
        var shorta = Math.floor(s.a * 100) + '%';
        $('input[name="hd"]', p).siblings('.value').text(shorthd);
        $('input[name="sd"]', p).siblings('.value').text(shortsd);
        $('input[name="ld"]', p).siblings('.value').text(shortld);
        $('input[name="a"]', p).siblings('.value').text(shorta);

        if (id === 'whiz' && !skiprefresh && exports.palette()) {
            exports.palette(exports.palette());
        } else if (!skiprefresh) {
            exports.refresh();
        }
    };

    // Template and setup markup for coloring interface. Needs to be re-run
    // whenever the baselayer type is changed.
    exports.make = function() {
        $('#style-tint').html(templates.style_tint({
            recipes: Streets.recipes,
            type: exports.type()
        }));
        _(exports.styles).each(function(style, id) {
            exports.render(id, false, true);
        });
    };

    // Init sequence.
    exports.styles = Streets.styles(editor.model.get('layers'));
    exports.stash[exports.type()] = exports.styles;
    exports.make();
    $('#style-type-' + exports.type()).prop('checked', true);
    $('#style-l10n-' + exports.l10n()).prop('checked', true);
    return exports;
};

},{"./lib/streets":28,"fs":33}],33:[function(require,module,exports){

},{}],34:[function(require,module,exports){
module.exports=require(33)
},{}],35:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("q+64fw"))
},{"q+64fw":36}],36:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1])