$('.js-signup-action').on('click',function() {
    Views.modal.show('auth', function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
        if (err && err.code === 'closed') return;
        location.href = '../projects/index.html#new';
    });
    Views.modal.slide('active3');
    analytics.track('Clicked Showcase Signup Link');
    return false;
});
