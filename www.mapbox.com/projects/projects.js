(function() {
if (!App) throw new Error('Global App object required');
if (!Views) throw new Error('Global Views object required');

var Projects = Backbone.View.extend({});

Projects.prototype.events = {
    'keyup .project-search': 'filter',
    'click .js-del-project': 'projectdel',
    'click .js-stats': 'projectstats',
    'click input[name="projects-sort-toggle"]': 'filter',
    'click .js-nextpage': 'nextpage',
    'click .readonly': 'inputselect',
    'click .js-onboard-toggle': 'helptoggle',
    'click .js-submit-survey': 'submitsurvey'
};

function bindClipboard() {
    $('.js-clipboard').each(function() {
        var $clip = $(this);
        if (!$clip.data('zeroclipboard-bound')) {
            var clip = new ZeroClipboard(this);
            $clip.data('zeroclipboard-bound', true);
            clip.on('aftercopy', function() {
                if ($clip.is('.js-onboard-example')) {
                    var text = $clip.text();
                    $clip.text('Copied to clipboard ');
                    setTimeout(function() {
                        $clip.text(text);
                    }, 1000);
                    analytics.track('Copied onboarding example with clipboard');
                } else {
                    $clip.siblings('input').select();
                    $clip.addClass('clipped');
                    setTimeout(function() {
                        $clip.removeClass('clipped');
                    }, 1000);
                    analytics.track('Copied mapid with clipboard');
                }
            });
        }
    });
}

Projects.prototype.initialize = function(options) {
    this.empty = _(this.empty).bind(this);
    this.collection.on('remove', this.empty);
    this.templateProjects = App.template('template-projects');

    var first = this.collection.at(0);
    var id = first && first.get('id');
    var name = first && first.get('name');

    if (location.hash && location.hash === '#new') {
        $('.js-help-message').html('For example, <strong>' + name + '</strong> has the map id <code>' + id + '</code>.');
        $('body').addClass('showhelp');
        Views.modal.show('onboardsurvey', function() {
            window.location.hash = '';
        });
    }

    this.limit = 50;
    this.filter();
    this.sort();
    this.empty();
};

Projects.prototype.render = function(filter, sort, limit) {
    var view = this;

    this.$('#all-projects').html(this.templateProjects({
        filter: filter,
        sort: sort,
        limit: limit,
        projects: this.collection
    }));

    bindClipboard();

    // Adjust the Create project href if an admin is impersonating a user.
    if (App.param('id') && App.user.accountLevel === 'staff') {
        this.$('#new-project').attr('href', '/editor/?id=' + App.param('id') + '.map-' + App.tmpkey + '#app');
    }
};

Projects.prototype.submitsurvey = function(ev) {
    ev.preventDefault();
    if (!$(Views.modal.el)) return false;
    var account = App.param('id') || App.user.id;
    var segment = $(ev.currentTarget).hasClass('js-skip-survey') ? 'skipped' : $('.survey-personas input:checked').val();
    analytics.identify(account, {
        persona: segment
    });
    Views.modal.done('onboardsurvey');
    return false;
};

Projects.prototype.empty = function(ev) {
    if (!this.collection.filter(function(m) { return !m.active; }).length) {
        $(this.el).addClass('empty-state');
    } else {
        $(this.el).removeClass('empty-state');
    }
};

Projects.prototype.nextpage = function(ev) {
    if (this.limit >= this.collection.length) return false;
    this.limit += 50;
    this.filter();
    return false;
};

Projects.prototype.filter = function(ev) {
    $('#all-projects').addClass('loading');
    var $input = $('#list-filter');
    var sortValue;

    // Bail value on the ESC key
    if (ev && ev.which === 27) $input.val('');

    var filterValue = $input.val().toLowerCase();

    if (!ev) {
        sortValue = App.storage('projects.sort') ? App.storage('projects.sort') : 'date';
        this.render(filterValue, sortValue, this.limit);
        $('#all-projects').removeClass('loading');
    } else if ($(ev.currentTarget).is('input[name="projects-sort-toggle"]')) {
        sortValue = $(ev.currentTarget).val();
        App.storage('projects.sort', sortValue);
        this.render(filterValue, sortValue, this.limit);
         $('#all-projects').removeClass('loading');
    } else {
        sortValue = $('input[name="projects-sort-toggle"]:checked').val();
        this.render(filterValue, sortValue, this.limit);
         $('#all-projects').removeClass('loading');
    }
};

Projects.prototype.sort = function() {
    var sortValue = App.storage('projects.sort') ? App.storage('projects.sort') : 'date';
    $('#sort').html(App.template('sort-value')({ sort: sortValue }));
};

Projects.prototype.resendConfirmation = function(ev) {
    App.resendConfirmation(this.model.get('id'), function(err, message) {
        if (err) return Views.modal.show('err', err);
        Views.modal.show('confirm', message);
    });
    return false;
};

Projects.prototype.projectdel = function(ev) {
    var view = this;
    var li = $(ev.currentTarget).parents('li');
    var id = li.data('id');

    App.fetch('/api/Map/' + id, function(err, model) {
        if (err) return Views.modal.show('err', err);
        // Destroy associated markers doc if it exists.
        App.fetch('/api/Markers/' + id, function(err, markers) {
            confirmdel(ev, model, markers);
        });
    });

    // We always say marker, never point
    var summaryNames = {
        types: {
            Point: [' marker', ' markers'],
            Polygon: [' polygon', ' polygons'],
            LineString: [' line', ' lines']
        }
    };

    function confirmdel(ev, model, markers) {
        var msg = '<h3>Are you sure you want to delete ' +
            (model.escape('name') || 'Untitled') + ' <span class="code quiet">(' + model.id + ')</span>?</h3>';

        var features = (markers && markers.get('features')) || [];

        if (features.length) {
            msg += '<span class="quiet small">This will also delete <strong>' + geojsonSummary(features, summaryNames).sentence + '</strong>' +
                ' included in the project.</span>';
        }

        Views.modal.show('confirm', {
            html: msg,
            confirm: 'Delete'
        }, onconfirm);

        function onconfirm(err) {
            if (err) return;
            App.destroy(model, function(e) {
                if (markers) App.destroy(markers, function(e) {});
                li.addClass('deleted');
                view.collection.remove(model);
            });
        }
    }

    return false;
};

Projects.prototype.projectstats = function(ev) {
    var view = this;
    var id = $(ev.currentTarget).parents('li').data('id');
    var li = $(ev.currentTarget).parents('li');
    var day = 864e5;
    var from = Date.parse(new Date(new Date() - (day * 30))),
        to = Date.parse(new Date()),
        extent;
    if (App.param('from')) {
        // MM-DD-YYYY (query date format)
        from = App.param('from').split('-');
        from = Date.parse(from[0] + '-' + from[1] + '-' + from[2]);
        extent = [from];
        if (App.param('to')) {
            to = App.param('to').split('-');
            to = Date.parse(to[0] + '-' + to[1] + '-' + to[2]);
            extent.push(to);
        } else {
            extent.push(to);
        }
    }

    if (li.is('.active')) {
        this.$('li.active').removeClass('active');
        return false;
    }

    this.$('li.active').removeClass('active');
    li.addClass('loading');

    App.fetch('/api/Map/' + id, function(err, model) {
        if (err) return Views.modal.show('err', err);
        var idSegments = id.split('.');
        var account = idSegments.shift();
        var mapid = idSegments.shift() || '';
        App.fetch('/api/users/' + account + '/statistics/' + mapid +
            '?interval=' + 'day' +
            '&period=' + from + ',' + to +
            '&metrics=hosts', function(err, stats) {
            if (err) return Views.modal.show('err', err);
            li.removeClass('loading').addClass('active');
            li = li.children('div .details');
            view.bargraphs = view.bargraphs || {};
            view.bargraphs[id] = view.bargraphs[id] || new ProjectGraph({
                el: li.children('.graph-statistics'),
                model: stats,
                label: model.get('name') || model.id,
                refer: true,
                extent: extent || [from, to],
                services: ['mapview']
            });
        });
    });

    return false;
};

Projects.prototype.inputselect = function(ev) {
    $(ev.currentTarget).select();
};

Projects.prototype.helptoggle = function(ev) {
    $('body').toggleClass('showhelp');
    location.hash = '';
    return false;
};

function load() {
    // This view requires an authenticated user.
    if (!App.user) return Views.modal.show('auth', {redirect: '/'}, load);

    if (Views.projects) return;
    Views.projects = true;
    $('#all-projects').addClass('loading');

    (function getdata(opts) {
        if (!opts.collection) return App.fetchall([
            '/api/User/' + App.user.id,
            '/api/Map?list=1&private=1&_type=composite&account=' + App.user.id
        ], function(err, objects) {
            if (err) return Views.modal.show('err', err);
            if (App.param('debug') === 'empty') objects.models = [];
            var opts = {};
            opts.model = objects.shift();
            opts.collection = objects.shift();
            getdata(opts);
        });

        $('#all-projects').removeClass('loading');
        opts.el = $('body');
        Views.projects = new Projects(opts);
        analytics.identify(App.user.id, {
            projects: opts.collection.length
        });
    })({});
}

App.onUserLoad(load);

})();
