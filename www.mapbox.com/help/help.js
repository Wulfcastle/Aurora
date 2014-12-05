(function() {

    if (!App) throw new Error('Global App object required');
    if (!Views) throw new Error('Global Views object required');

    var Help = Backbone.View.extend({});

    Help.prototype.events = {
        'submit #email-support form': 'email',
        'submit #help-feedback': 'feedback'
    };

    Help.prototype.initialize = function() {
        if (window.location.hash.match(/stq/)) window.location.hash = '';
        if (this.model) $('#email-address').val(this.model.get('email'));
    };

    Help.prototype.email = function(ev) {
        ev.preventDefault();
        if ($('#email-address').val() === '' ||
            $('#email-subject').val() === '' ||
            $('#email-body').val() === '') return false;

        $('#email-support button').addClass('hidden');
        var fields = _($(ev.currentTarget).serializeArray()).reduce(function(obj, input) {
            obj[input.name] = input.value;
            return obj;
        }, {});

        $.ajax({
            url: App.api + '/api/contact',
            contentType: 'application/json',
            type: 'post',
            data: JSON.stringify(fields)
        })
        .done(function(data) {
            $('#email-us').addClass('hidden');
            $('#email-success').removeClass('hidden');
            return true;
        });
    };

    Help.prototype.feedback = function(ev) {
        ev.preventDefault();
        var text = $(ev.currentTarget).find('textarea').val();

        if (text) {
            analytics.track('Submitted help feedback', {
                type: 'help-feedback',
                user: (App.user) ? App.user.id : '',
                plan: (App.user && App.user.plan) ? App.user.plan.name : '',
                origin: document.location.pathname,
                improve: text
            });
            $(ev.currentTarget).html('<div class="center pad4y"><h2>Thanks for your feedback!</h2></div>');
        }
    };

    App.onUserLoad(function() {
        if (App.user && (App.user.plan.name === ('Premium' || 'Plus'))) {
            $('.js-show-ad').removeClass('hidden');
        }

        var opts = {
            el: $('#help-page')
        };

        if (App.user) {
            App.fetch('/api/User/' + App.user.id, function(err, model) {
                if (err) return Views.modal.show('err', err);
                opts.model = model;
                Views.help = new Help(opts);
            });
        } else {
            Views.help = new Help(opts);
        }
    });
})();
