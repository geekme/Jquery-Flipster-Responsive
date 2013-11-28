(function ($) {
    $.fn.flipster = function (options) {

        var defaults = {
            itemContainer: 'ul', // Container for the flippin' items.
            itemSelector: 'li', // Selector for children of itemContainer to flip
            style: 'carousel', // Switch between 'coverflow' or 'carousel' display styles
            start: 'center', // Starting item. Set to 0 to start at the first, 'center' to start in the middle or the index of the item you want to start with.
            isResponsive: false,//Set the Responsive to true if you want to make the Flipster Responsive and False to disable it
            showTitle: false,
            enableKeyboard: true, // Enable left/right arrow navigation
            enableMousewheel: true, // Enable scrollwheel navigation (up = left, down = right)
            enableTouch: true, // Enable swipe navigation for touch devices

            enableNav: false, // If true, flipster will insert an unordered list of the slides
            enableNavButtons: false, // If true, flipster will insert Previous / Next buttons
            autoStart:false, //Set to true, to initialize auto Scrolling
            timeOut:2000, //Default timing for Auto Scrolling

            onItemSwitch: function () {
            } // Callback function when items are switches
        };
        var settings = $.extend({}, defaults, options);
        var win = $(window);

        if (settings.showTitle) {
            var titleCarrier = $('<p>');
            titleCarrier.addClass("titleCarrier");

            $(this).append(titleCarrier);
        }
        return this.each(function () {

            var _flipster = $(this);
            var _flipItemsOuter;
            var _flipItems;
            var _flipNav;
            var _flipNavItems;
            var _current = 0;

            var _startTouchX = 0;
            var _actionThrottle = 0;
            var _throttleTimeout;
            var compatibility;

            function removeThrottle() {
                _actionThrottle = 0;
            }

            function resize() {
                _flipItemsOuter.height(calculateBiggestFlipItemHeight());

                //My Hack IN,
                // Getting the Outer Divs Width
                var width = _flipItemsOuter.width();
                var actualWidthOfContainer = "50%";

                //Parent Width
                var parentWidth = _flipItemsOuter.parent().width();
                var actualParentWidth = parseInt($(window).width() - 60, 10);

                //Less Margin
                var marg = calculateBiggestFlipItemHeight();
                var marginCalculation = -(marg / 3.6);

                _flipster.css("height", "auto");

                if (settings.isResponsive && settings.style === 'carousel') {
//                alert("Showing Responsive");
                    _flipItemsOuter.css({
                        width: actualWidthOfContainer,
                        left: "50%",
                        position: "relative",
//                        marginLeft: marginCalculation,
                        marginLeft:-parseInt(_flipItems.width(), 10) / 2,
                        marginTop: "2%"
                    });
                    //Set parents Width and some spacing for Box-shadow
                    _flipItemsOuter.parent().width(actualParentWidth);
//                    _flipItemsOuter.parent().css("height",_flipItems.height());
//                    _flipItemsOuter.parent().height(calculateBiggestFlipItemHeight());
                    _flipItemsOuter.parent().css("paddingLeft", "20px")
                    _flipItemsOuter.parent().css("paddingRight", "20px")
                    _flipItemsOuter.parent().css("paddingTop", "20px")
                }
                else {
                    _flipItemsOuter.width(_flipItems.width());
                }
            }

            function showTitle() {
                if (settings.showTitle) {
                    var title = $(_flipItems[_current]).data("title");

                    _flipItemsOuter.parent().find('.titleCarrier').html(title);
                }
            }

            function calculateBiggestFlipItemHeight() {
                var biggestHeight = 0;
                _flipItems.each(function () {
                    if ($(this).height() > biggestHeight) biggestHeight = $(this).height();
                });
                return biggestHeight;
            }

            function buildNav() {
                if (settings.enableNav && _flipItems.length > 1) {
                    var navCategories = [],
                        navItems = [],
                        navList = [];

                    _flipItems.each(function () {
                        var category = $(this).data("flip-category"),
                            itemId = $(this).attr("id"),
                            itemTitle = $(this).attr("title");

                        if (typeof category !== 'undefined') {
                            if ($.inArray(category, navCategories) < 0) {
                                navCategories.push(category);
                                navList[category] = '<li class="flip-nav-category"><a href="#" class="flip-nav-category-link" data-flip-category="' + category + '">' + category + '</a>\n<ul class="flip-nav-items">\n';
                            }
                        }

                        if ($.inArray(itemId, navItems) < 0) {
                            navItems.push(itemId);
                            link = '<a href="#' + itemId + '" class="flip-nav-item-link">' + itemTitle + '</a></li>\n';
                            if (typeof category !== 'undefined') {
                                navList[category] = navList[category] + '<li class="flip-nav-item">' + link;
                            } else {
                                navList[itemId] = '<li class="flip-nav-item no-category">' + link;
                            }
                        }
                    });

                    navDisplay = '<ul class="flipster-nav">\n';
                    for (var catIndex in navCategories) {
                        navList[navCategories[catIndex]] = navList[navCategories[catIndex]] + "</ul>\n</li>\n";
                    }
                    for (var navIndex in navList) {
                        navDisplay += navList[navIndex];
                    }
                    navDisplay += '</ul>';

                    _flipNav = $(navDisplay).prependTo(_flipster);
                    _flipNavItems = _flipNav.find("a").on("click", function (e) {
                        var target;
                        if ($(this).hasClass("flip-nav-category-link")) {
                            target = _flipItems.filter("[data-flip-category='" + $(this).data("flip-category") + "']");
                        } else {
                            target = $(this.hash);
                        }

                        if (target.length) {
                            jump(target);
                            e.preventDefault();
                        }
                    });
                }
            }

            function updateNav() {
                if (settings.enableNav && _flipItems.length > 1) {
                    currentItem = $(_flipItems[_current]);
                    _flipNav.find(".flip-nav-current").removeClass("flip-nav-current");
                    _flipNavItems.filter("[href='#" + currentItem.attr("id") + "']").addClass("flip-nav-current");
                    _flipNavItems.filter("[data-flip-category='" + currentItem.data("flip-category") + "']").parent().addClass("flip-nav-current");
                }
            }

            function buildNavButtons() {
                if (settings.enableNavButtons && _flipItems.length > 1) {
                    _flipster.find(".flipto-prev, .flipto-next").remove();
                    _flipster.append("<a href='#' class='flipto-prev'><img src = './img/leftArrow.png' /></a> <a href='#' class='flipto-next'><img src = './img/rightArrow.png'/></a>");

                    _flipster.children('.flipto-prev').on("click", function (e) {
                        jump("left");
                        e.preventDefault();
                    });

                    _flipster.children('.flipto-next').on("click", function (e) {
                        jump("right");
                        e.preventDefault();
                    });
                }
            }

            function addBlack(next, prev){
                //add Black Screen
                var blackDiv = $("<div>");
                blackDiv.addClass("screen");
                blackDiv.css({
                    "background":"rgba(0,0,0,0.4)",
                    "position":"absolute",
                    "top":"0px",
                    "left":"0px",
                    "width":"100%",
                    "height":"100%"
                });
                
                //Remove Screen from Current Flip Item
                $(_flipItems[_current]).find('.screen').remove();
                _flipster.find('.flip-prev, .flip-next').find('.screen').remove();
                _flipster.find('.flip-prev, .flip-next').append(blackDiv);
            }

            function center() {
                var currentItem = $(_flipItems[_current]).addClass("flip-current");

                _flipItems.removeClass("flip-prev flip-next flip-current flip-past flip-future no-transition");

                if (settings.style === 'carousel') {

                    _flipItems.addClass("flip-hidden");

                    var nextItem = $(_flipItems[_current + 1]),
                        futureItem = $(_flipItems[_current + 2]),
                        prevItem = $(_flipItems[_current - 1]),
                        pastItem = $(_flipItems[_current - 2]);


                    if (_current === 0) {
                        prevItem = _flipItems.last();
                        pastItem = prevItem.prev();
                    }
                    else if (_current === 1) {
                        pastItem = _flipItems.last();
                    }
                    else if (_current === _flipItems.length - 2) {
                        futureItem = _flipItems.first();
                    }
                    else if (_current === _flipItems.length - 1) {
                        nextItem = _flipItems.first();
                        futureItem = $(_flipItems[1]);
                    }

                    futureItem.removeClass("flip-hidden").addClass("flip-future");
                    pastItem.removeClass("flip-hidden").addClass("flip-past");
                    nextItem.removeClass("flip-hidden").addClass("flip-next");
                    prevItem.removeClass("flip-hidden").addClass("flip-prev");
                    addBlack(nextItem, prevItem);

                } else {
                    var spacer = currentItem.outerWidth() / 2;
                    var totalLeft = 0;
                    var totalWidth = _flipItemsOuter.width();
                    var currentWidth = currentItem.outerWidth();
                    var currentLeft = (_flipItems.index(currentItem) * currentWidth) / 2 + spacer / 2;

                    _flipItems.removeClass("flip-hidden");

                    for (i = 0; i < _flipItems.length; i++) {
                        var thisItem = $(_flipItems[i]);
                        var thisWidth = thisItem.outerWidth();

                        if (i < _current) {
                            thisItem.addClass("flip-past")
                                .css({
                                    "z-index": i,
                                    "left": (i * thisWidth / 2) + "px"
                                });
                        }
                        else if (i > _current) {
                            thisItem.addClass("flip-future")
                                .css({
                                    "z-index": _flipItems.length - i,
                                    "left": (i * thisWidth / 2) + spacer + "px"
                                });
                        }
                    }

                    currentItem.css({
                        "z-index": _flipItems.length + 1,
                        "left": currentLeft + "px"
                    });

                    totalLeft = (currentLeft + (currentWidth / 2)) - (totalWidth / 2);
                    var newLeftPos = -1 * (totalLeft) + "px";
                    /* Untested Compatibility */
                    if (compatibility) {
                        var leftItems = $(".flip-past");
                        var rightItems = $(".flip-future");
                        $(".flip-current").css("zoom", "1.0");
                        for (i = 0; i < leftItems.length; i++) {
                            $(leftItems[i]).css("zoom", (100 - ((leftItems.length - i) * 5) + "%"));
                        }
                        for (i = 0; i < rightItems.length; i++) {
                            $(rightItems[i]).css("zoom", (100 - ((i + 1) * 5) + "%"));
                        }

                        _flipItemsOuter.animate({"left": newLeftPos}, 333);
                    }
                    else {
                        _flipItemsOuter.css("left", newLeftPos);
                    }
                }

                currentItem
                    .addClass("flip-current")
                    .removeClass("flip-prev flip-next flip-past flip-future flip-hidden");

                resize();
                updateNav();
                showTitle();
                settings.onItemSwitch.call(this);
            }

            function jump(to) {
                if (_flipItems.length > 1) {
                    if (to === "left") {
                        if (_current > 0) {
                            _current--;
                        }
                        else {
                            _current = _flipItems.length - 1;
                        }
                    }
                    else if (to === "right") {
                        if (_current < _flipItems.length - 1) {
                            _current++;
                        }
                        else {
                            _current = 0;
                        }
                    } else if (typeof to === 'number') {
                        _current = to;
                    } else {
                        // if object is sent, get its index
                        _current = _flipItems.index(to);
                    }
                    center();
                }
            }

            function init() {
                /* Untested Compatibility */

                // Basic setup
                _flipster.addClass("flipster flipster-active flipster-" + settings.style).css("visibility", "hidden");
                _flipItemsOuter = _flipster.find(settings.itemContainer).addClass("flip-items");
                _flipItems = _flipItemsOuter.find(settings.itemSelector).addClass("flip-item flip-hidden").wrapInner("<div class='flip-content' />");

                //Browsers that don't support CSS3 transforms get compatibility:
                var isIEmax8 = ('\v' === 'v'); //IE <= 8
                var checkIE = document.createElement("b");
                checkIE.innerHTML = "<!--[if IE 9]><i></i><![endif]-->"; //IE 9
                var isIE9 = checkIE.getElementsByTagName("i").length === 1;
                if (isIEmax8 || isIE9) {
                    compatibility = true;
                    _flipItemsOuter.addClass("compatibility");
                }


                // Insert navigation if enabled.
                buildNav();
                buildNavButtons();


                // Set the starting item
                if (settings.start && _flipItems.length > 1) {
                    // Find the middle item if start = center
                    if (settings.start === 'center') {
                        if (!_flipItems.length % 2) {
                            _current = _flipItems.length / 2 + 1;
                        }
                        else {
                            _current = Math.floor(_flipItems.length / 2);
                        }
                    } else {
                        _current = settings.start;
                    }
                }


                // initialize containers
                resize();
                calculateBiggestFlipItemHeight()


                // Necessary to start flipster invisible and then fadeIn so height/width can be set accurately after page load
                _flipster.hide().css("visibility", "visible").fadeIn(400, function () {
                    center();
                    addBlack($(_flipItems[_current + 1]), $(_flipItems[_current - 2]) );
                });


                // Attach event bindings.
                win.resize(function () {
                    resize();
                    center();
                    calculateBiggestFlipItemHeight();
                });



                // Navigate directly to an item by clicking
                _flipItems.on("click", function (e) {
                    if (!$(this).hasClass("flip-current")) {
                        e.preventDefault();
                    }
                    jump(_flipItems.index(this));
                });


                // Keyboard Navigation
                if (settings.enableKeyboard && _flipItems.length > 1) {
                    win.on("keydown.flipster", function (e) {
                        _actionThrottle++;
                        if (_actionThrottle % 7 !== 0 && _actionThrottle !== 1) return; //if holding the key down, ignore most events

                        var code = e.which;
                        if (code === 37) {
                            e.preventDefault();
                            jump('left');
                        }
                        else if (code === 39) {
                            e.preventDefault();
                            jump('right');
                        }
                    });

                    win.on("keyup.flipster", function (e) {
                        _actionThrottle = 0; //reset action throttle on key lift to avoid throttling new interactions
                    });
                }


                // Mousewheel Navigation
                if (settings.enableMousewheel && _flipItems.length > 1) { // TODO: Fix scrollwheel on Firefox
                    _flipster.on("mousewheel.flipster", function (e) {
                        _throttleTimeout = window.setTimeout(removeThrottle, 500); //throttling should expire if scrolling pauses for a moment.
                        _actionThrottle++;
                        if (_actionThrottle % 4 !== 0 && _actionThrottle !== 1) return; //throttling like with held-down keys
                        window.clearTimeout(_throttleTimeout);

                        if (e.originalEvent.wheelDelta / 120 > 0) {
                            jump("left");
                        }
                        else {
                            jump("right");
                        }

                        e.preventDefault();
                    });
                }

                if(settings.autoStart){
                    win.load(function(){
                        var auto = window.setInterval(function(){
                            jump("right");
                        }, settings.timeOut)
                    });
                }


                // Touch Navigation
                if (settings.enableTouch && _flipItems.length > 1) {
                    _flipster.on("touchstart.flipster", function (e) {
                        _startTouchX = e.originalEvent.targetTouches[0].screenX;
                    });

                    _flipster.on("touchmove.flipster", function (e) {
                        e.preventDefault();
                        var nowX = e.originalEvent.targetTouches[0].screenX;
                        var touchDiff = nowX - _startTouchX;
                        if (touchDiff > _flipItems[0].clientWidth / 1.75) {
                            jump("left");
                            _startTouchX = nowX;
                        } else if (touchDiff < -1 * (_flipItems[0].clientWidth / 1.75)) {
                            jump("right");
                            _startTouchX = nowX;
                        }
                    });

                    _flipster.on("touchend.flipster", function (e) {
                        _startTouchX = 0;
                    });
                }
            }

            // Initialize if flipster is not already active.
            if (!_flipster.hasClass("flipster-active")) {
                init();
            }
        });
    };
})(jQuery);
