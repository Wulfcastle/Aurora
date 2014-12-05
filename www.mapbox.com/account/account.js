(function() {

    if (!App) throw new Error('Global App object required');
    if (!Views) throw new Error('Global Views object required');

    var Account = Backbone.View.extend({});

    Account.prototype.events = {
        'submit form#profile': 'save',
        'click .js-change-password': 'triggerChangePassword',
        'click .js-twostep-enable': 'generateTwoStep',
        'click .js-twostep-disable': 'disableTwoStep',
        'click .js-manual': 'enterManually',
        'submit #modal-twostep-generate': 'enableTwoStep',
        'submit #modal-changepw': 'changePassword',
        'click a[href=#confirm]': 'triggerResend',
        'click .js-resend': 'triggerResend'
    };

    Account.prototype.initialize = function(options) {
        if (!this.model) throw new Error('Model required');
        this.templateBroadcast = App.template('template-broadcast');
        this.render();
    };

    Account.prototype.render = function() {
        var view = this;

        $('.js-account-nav').html(App.template('accountnav-template')(App.user));

        this.$el.find('#account-page').html(App.template('template-account')({
            user: this.model
        }));


        if (window.location.hash.split('#').pop() === 'password')
            Views.modal.show('changepw');

        this.$('#broadcast').empty();
        view.options.feed.each(function(item) {
            if (item.get('code') === 'success') return;
            var actions = {
                    overage: {
                        href: '/plans/',
                        title: 'Upgrade your plan.'
                    },
                    billing: {
                        href: 'billing/update-payment-info/index.html',
                        title: 'Update your payment information.'
                    },
                    confirmed: {
                        href: '#confirm',
                        title: 'Resend confirmation email.'
                    }
            };

            if (!(item.get('code') === 'confirmed')) {
                view.$('#broadcast').append(view.templateBroadcast({
                    message: item.get('message'),
                    action: actions[item.get('code')]
                }));
            }
        }, this);
    };

    Account.prototype.save = function(ev) {
        ev.preventDefault();
        Views.account.$el.addClass('loading');
        var attrs = _($(ev.currentTarget).serializeArray()).reduce(function(memo, obj) {
            memo[obj.name] = obj.value;
            return memo;
        }, {});

        this.model.set(attrs);

        return App.save(this.model, function(err, model) {
            Views.account.$el.removeClass('loading');
            if (err) {
                Views.modal.show('err', err);
            } else {
                Views.modal.show('confirm', 'Profile updated successfully');
                App.refreshUser(model.id, function(err) {
                    if (err) return Views.modal.show('err', err);
                });
            }
        });
    };

    Account.prototype.triggerChangePassword = function(ev) {
        ev.preventDefault();
        return Views.modal.show('changepw');
    };

    Account.prototype.generateTwoStep = function(ev) {
        ev.preventDefault();
        this.key = this.generateKey();
        Views.modal.show('twostep-generate');
        var qr = document.getElementById('qrcode');
        qr.innerHTML = '';
        var url = 'otpauth://totp/Mapbox:' + encodeURIComponent(App.user.id) + '?secret=' + this.key + '&issuer=Mapbox';
        var qrcode = new QRCode(qr, {
            text: url,
            width: 160,
            height: 160,
            colorDark : '#303030'
        });
    };

    Account.prototype.enterManually = function(ev) {
        ev.preventDefault();
        var readableKey = this.key.match(/..../g).join(' ');
        $(ev.currentTarget).replaceWith('<code class="small">' + readableKey + '</code>');
    };

    Account.prototype.generateKey = function() {
        var set = 'ABCDEFGHIJKLMNOPQRSTUVWXTZ234567'; // Base32
        var key = '';
        for (var i = 0; i < 16; i++) key += set.charAt(Math.floor(Math.random() * set.length));
        return key;
    };

    Account.prototype.enableTwoStep = function(ev) {
        ev.preventDefault();
        var model = Views.account.model;
        var $modal = $(Views.modal.el);
        var page = this.$el.find('#account-page');
        if (!$modal) return false;

        var attrs = App.form(ev.currentTarget);
        if (!attrs.code || attrs.code.length !== 6) {
            return Views.modal.show('err', new Error('A 6-digit code is required.'));
        }

        // On submission, save the generated this.key
        model.set({
            'mfaKey': this.key,
            'code': attrs.code
        });
        page.addClass('loading');
        return App.save(model, function(err) {
            page.addClass('loading');
            if (err) {
                Views.modal.show('err', err);
            } else {
                Views.modal.done('twostep-generate');
                Views.modal.show('confirm', 'Two-step verification enabled.');
                analytics.track('Enabled two-step verification');
                load(true);
            }

            model.unset('mfaKey');
        });
    };

    Account.prototype.disableTwoStep = function(ev) {
        ev.preventDefault();
        Views.modal.show('confirm', 'Are you sure you want to disable two-step verification?', function(e) {
            if (!e) {
                var page = this.$el.find('#account-page');
                var model = Views.account.model;
                model.set({mfaKey: false});
                page.addClass('loading');
                App.save(model, function(err) {
                    page.removeClass('loading');
                    if (err) {
                        Views.modal.show('err', err);
                    } else {
                        Views.modal.show('confirm', 'Two-step verification disabled.');
                        analytics.track('Disabled two-step verification');
                        load(true);
                    }
                    model.unset('mfaKey');
                });
            }
        });
    };

    Account.prototype.changePassword = function(ev) {
        ev.preventDefault();

        var $modal = $(Views.modal.el);
        var model = Views.account.model;

        if (!$modal) return false;

        var attrs = App.form(ev.currentTarget);
        if (!attrs.password)
            return Views.modals.show('err', new Error('New password is required'));
        if (attrs.password !== attrs.passwordConfirm)
            return Views.modal.show('err', new Error('Password confirmation does not match password'));

        model.set(attrs);
        $modal.addClass('loading');
        return App.save(model, function(err) {
            $modal.removeClass('loading');
            if (err) {
                Views.modal.show('err', err);
            } else {
                Views.modal.done('changepw');
                window.location.hash = '';
                Views.modal.show('confirm', 'Password changed successfully');
            }

            _.each(attrs, function(value, key) {
                model.unset(key);
            });
        });
    };

    Account.prototype.triggerResend = function(ev) {
        var page = this.$el.find('#account-page');
        page.addClass('loading');
        this.resendConfirmation(this.model.id, function(err, res) {
            if (err) return Views.modal.show('err', err);
            page.removeClass('loading');
            Views.modal.show('confirm', res);
        });
        return false;
    };

    Account.prototype.resendConfirmation = function(id, callback) {
        App.put('/api/users/' + id + '/resend', null, function(err) {
            if (err) return callback(err);
            callback(null, 'Confirmation email sent.');
        });
    };


    function load(refresh) {

        if (!App.user) {
            Views.modal.show('auth', {redirect:'/'}, load);
            if (window.location.hash.split('#').pop() === 'password')
                Views.modal.slide('active1');
            return;
        }

        $('#account-page').addClass('loading');
        (function getdata(opts) {
            if (!opts.model) return App.fetchall([
                '/api/User/' + App.user.id,
                '/api/feed/' + App.user.id
            ], refresh, function(err, objects) {
                if (err) return Views.modal.show('err', err);
                var opts = {};
                opts.model = objects.shift();
                opts.feed = objects.shift();
                getdata(opts);
            });
            $('#account-page').removeClass('loading');
            opts.el = $('body');
            Views.account = new Account(opts);
        })({});
    }

    App.onUserLoad(load);

})();
