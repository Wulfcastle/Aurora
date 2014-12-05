(function() {

    if (!App) throw new Error('Global App object required');
    if (!Views) throw new Error('Global Views object required');

    var Plans = Backbone.View.extend({});

    Plans.prototype.events = {
        'click a.signup': 'signup',
        'click a.plan:not(.disabled)': 'plan',
        'click .period-toggle a': 'toggle'
    };

    Plans.prototype.initialize = function(options) {
        var view = this;
        view.render();
    };

    Plans.prototype.render = function() {
        var view = this;
        this.$('#plan-intro').html(App.template('template-plan-intro')(
            this.options.model ? this.options.model.get('plan') : false));

        var period = (function() {
            if (App.param('period')) {
                return App.param('period');
            } else if (view.options.model && _(['month', 'year']).contains(view.options.model.get('plan').period)) {
                return view.options.model.get('plan').period;
            } else {
                return 'month';
            }
        })();

        this.$('.js-plan-list').html(App.template('plans-template')({
            period: period,
            plans: this.options.plans,
            user: this.options.model
        }));
    };

    Plans.prototype.signup = function(ev, callback) {
        var view = this;
        Views.modal.show('auth', {redirect: '/'}, function(err) {
            if (err && err.code !== 'closed') Views.modal.show('err', err);
            if (err && err.code === 'closed') return;
            view.options.model = new Backbone.Model(App.user);
            if (typeof callback === 'function') {
                return callback();
            } else {
                location.href = '../projects/index.html#new';
            }
        });
        Views.modal.slide('active3');
        return false;
    };

    Plans.prototype.plan = function(ev) {
        var view = this;

        var plan = view.options.plans.get($(ev.currentTarget).attr('href').split('#').pop());
        if (!App.user) {
            view.signup(ev, function() {
                if (plan.id === 'starter') {
                    location.href = '../projects/index.html#new';
                    return;
                }
                change(function() {
                    location.href = '../projects/index.html#new';
                });
            });
        } else {
            change(function() {
                document.location.reload(true);
            });
        }

        function change(callback) {
            Views.modal.show('plan', {
                plan: plan,
                user: view.options.model,
                op: App.isUpgrade(view.options.model.get('plan'), plan) ? 'upgrade' : 'downgrade'
            }, function(err, subscription) {
                if (err && err.code === 'closed') return;
                if (err) return Views.modal.show('err', err);
                view.options.model.set('accountLevel', subscription.plan.id);
                view.options.model.set('plan', view.options.plans.get(subscription.plan.id).toJSON());
                App.refreshUser(view.options.model.id, function() {
                    callback();
                });
            });
        }

        return false;
    };

    function load() {

        var opts = {};
        $('#plans').addClass('loading');

        (function load(opts) {
            if (!opts.model && App.user) return App.fetch('/api/User/' + App.user.id, function(err, model) {
                if (err) return Views.modal.show('err', err);
                opts.model = model;
                load(opts);
            });
            if (!opts.plans) return App.fetch('../api/Plans', function(err, collection) {
                if (err) return Views.modal.show('err', err);
                opts.plans = new Backbone.Collection(collection.filter(function(model) {
                    return _([
                      'free',
                      'starter',
                      'basic',
                      'basic-annual',
                      'standard',
                      'standard-annual',
                      'plus',
                      'plus-annual',
                      'premium',
                      'premium-annual'
                    ]).contains(model.id);
                }));
                if (opts.plans.get('starter')) opts.plans.remove('free');
                load(opts);
            });
            $('#plans').removeClass('loading');
            opts.el = $('#plans');
            Views.plans = new Plans(opts);
        })({});

    }

    App.onUserLoad(load);

})();
