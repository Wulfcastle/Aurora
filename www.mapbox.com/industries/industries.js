var stickyNavTop = $('.sticky-nav').offset().top;
var navItems = [];
var realestateVid;
var vidPlaying = false;

$(document).ready(init());

function init (){
  $.each($('.sticky-nav ul li a'), function( index, value ) {
      var navItem = $(value);
      navItem.name = navItem.attr('class');
      if(navItem.name !== 'icon' || navItem.name !== 'mail'){
        navItems.push(navItem);
      }
  });

  realestateVid = $('#realestate-video');
  stickyNav();
}


function stickyNav(){
  var scrollTop = $(window).scrollTop();
  var windowWidth = $(window).innerWidth();
  if (windowWidth > 640) {
    if (scrollTop > stickyNavTop) {
      $('.sticky-nav').addClass('sticky');
      $('.sticky-nav + div').addClass('space-top4');
      
      if (realestateVid[0] && !vidPlaying) {
          console.log(vidPlaying)
        realestateVid.attr('src', '//player.vimeo.com/video/113416059?autoplay=1&amp;loop=1')
        vidPlaying = true;
      }

    } else {
      $('.sticky-nav').removeClass('sticky');
      $('.sticky-nav + div').removeClass('space-top4');

      if (realestateVid[0] && vidPlaying) {
          console.log(vidPlaying)
        realestateVid.attr('src', '../../player.vimeo.com/video/113416059_170d0552.html')
        vidPlaying = false;
      }

    }
  }
};

$(window).scroll(function() {
      stickyNav();
      highlightMenuItem()
    if($('.page-content').hasClass('industries-active')){
      closeDropDown();
    }
});

function highlightMenuItem(){

   $.each(navItems, function( key, item ) {
          if( $('#' + item.name).length > 0 ) {
              if(isOnScreen($('#' + item.name))) {
                $('.sticky-nav ul li a').removeClass('active');
                $('.' + item.name).addClass('active');
              } else {
                $('.' + item.name).removeClass('active');
              }
           }
       });
}


function isOnScreen(elem){
    var elem = $(elem);
    var win = $(window);

    var viewport = {
        top : win.scrollTop(),
        left : win.scrollLeft()
    };

    viewport.bottom = viewport.top + (win.height()/2) + $('.sticky-nav').height();

    var bounds = elem.offset();
    bounds.bottom = bounds.top + elem.outerHeight();

    return (!( viewport.bottom < bounds.top || viewport.top > bounds.bottom - (win.height()/2) + $('.sticky-nav').height()));

}

$('.js-signup-action').on('click',function() {
    Views.modal.show('auth', function(err) {
        if (err && err.code !== 'closed') Views.modal.show('err', err);
        if (err && err.code === 'closed') return;
        location.href = '../projects/index.html#new';
    });
    Views.modal.slide('active3');
    analytics.track('Clicked Homepage Signup Link');
    return false;
});


function closeDropDown(){
      $('.industries-subnav').removeClass('active');
      $('.page-content').removeClass('industries-active');
      $('a.js-industries').addClass('plus');
}
