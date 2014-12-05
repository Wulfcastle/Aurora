function mapboxblog(pathname) {
    pathname = pathname || '';
    var url = 'http://www.mapbox.com/blog' + pathname;
    var url2 = 'https://www.mapbox.com/blog' + pathname;
    var count = 0;
    var $div = $('.js-twitter-count');
    var render = function(resp) {
        if (resp && resp.count) {
            count = count + resp.count;
            $div.removeClass('big').addClass('pad1y').text((count));
        }
    };
    $.ajax({
        url: 'https://cdn.api.twitter.com/1/urls/count.json',
        data: {
            url: url
        },
        dataType: 'jsonp',
        success: render,
        error: render
    });
    $.ajax({
        url: 'https://cdn.api.twitter.com/1/urls/count.json',
        data: {
            url: url2
        },
        dataType: 'jsonp',
        success: render,
        error: render
    });
}

App.onUserLoad(function () {
    if (App.user) {
        $('.js-show-ad').addClass('hidden');
    }
});

$('.js-signup-action').on('click',function() {
    Views.modal.show('auth', {close: true}, function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
        if (err && err.code === 'closed') return;
        location.href = '../projects/index.html#new';
    });
    Views.modal.slide('active3');
    analytics.track('Clicked Blog Signup Link');
    return false;
});

$('a.js-tweets').click(function() {
    window.open(
        this.href, 'mywindow', 'menubar=no,scrollbars=no,top=20,left=20,resizable=no,width=550,height=300');
        return false;
});
