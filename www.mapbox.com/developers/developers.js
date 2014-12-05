function load() {
    var mapid = App.storage('map.id'),
        exampleid = 'username.mapid';

    if (mapid && (mapid || '').indexOf(App.user.id) === 0) {
        exampleid = mapid;
    }

    analytics.trackLink($('a.support-link'), 'Clicked on support.mapbox.com');
    analytics.trackLink($('a.stackoverflow-link'), 'Clicked on stackoverflow');

    // Replace username.mapid with the current one.
    $('pre').each(function() {
        $(this).html($(this).html().replace(/username\.mapid/g, exampleid));
    });

    if (App.user) {
        $('.js-anon-message').addClass('hidden');
        $('.js-user-message').removeClass('hidden');
    }

}

App.onUserLoad(load);
