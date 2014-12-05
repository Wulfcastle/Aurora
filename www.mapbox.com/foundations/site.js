$(function() {
    // Sign up form at the bottom of posts.
    App.onUserLoad(function () {
      if (App.user) $('.js-show-signup').addClass('hidden');
    });


    $('.js-signup').on('click',function() {
        $('a.action.signup').trigger('click');
        return false;
    });

    $('.js-view-source').on('click', function() {
        $(this).parent().find('.highlight').toggleClass('active');
        $(this).toggleClass('active');
        return false;
    });

    $('#help-feedback').on('submit', function(ev) {
        ev.preventDefault();
        var text = $(ev.currentTarget).find('input[type="text"]').val();
        if (text) {
            analytics.track('Submitted foundations feedback', {
                type: 'foundations-feedback',
                user: (App.user) ? App.user.id : '',
                plan: (App.user && App.user.plan) ? App.user.plan.name : '',
                origin: document.location.pathname,
                improve: text
            });
            $(ev.currentTarget).html('<div class="center pad4y"><h2>Thanks for your feedback!</h2></div>');
        }
    });

    $('body').scrollspy({ target: '.toc' });
    $('.toc-wrap').affix({
      offset: {
        top: function () {
          return (this.top = $('.splash').outerHeight(true))
        },
        bottom: function () {
          return (this.bottom = $('.footer').outerHeight(true))
        }
      }
    })
});

function mapboxguides(pathname) {
    pathname = pathname || '';
    var url = 'http://www.mapbox.com/foundations' + pathname;
    var url2 = 'https://www.mapbox.com/foundations' + pathname;
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
$('a.js-tweets').click(function() {
    window.open(
        this.href, 'mywindow', 'menubar=no,scrollbars=no,top=20,left=20,resizable=no,width=550,height=300');
        return false;
});
