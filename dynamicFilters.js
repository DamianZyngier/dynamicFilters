// ==UserScript==
// @name         Dynamic Filters
// @author       Damian Zyngier
// @version      1.0
// @description  Make the JIRA filters more dynamic
// @match        https://*.atlassian.net/*RapidBoard.jspa*
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    var teamAssignee = [
        "Jan Kowalski",
        "Alina Nowak"
    ];

    function createFilters() {
        console.log("=====================================================================================================================================================================================================");
        setupAssignee();

    }

    var rapidView = new URLSearchParams(window.location.search).get('rapidView');

    // https://openuserjs.org/scripts/KyleMit/Exclusive_Quick_Filters/source
    $("body").on("mouseup", ".df-avatar", function(e) {
        if ($(this).is(".df-active")) return;
        if (e.ctrlKey || e.shiftKey) return;

        $(".df-avatar").each(function() {
            $.removeCookie(rapidView + $(this).attr("name"));
        });

        $(".df-avatar.df-active").removeClass("df-active");
    });

    // https://openuserjs.org/scripts/santa/Show_full_backlog_in_Jira_board/source
    const unfoldBacklog = () => {
        const elem = document.querySelector('.js-show-all-link');
        if (elem) {
            elem.click();
            clearInterval(interval);
        }
    };

    if (/\bview=planning\b/.test (location.search) ) {

        let interval;
        window.addEventListener('load', () => {
            interval = setInterval(unfoldBacklog, 1000);
        }, false);
    } else {
        var initializeContainerInterval = setInterval(function() {
            if ($('#ghx-controls-work').length) {
                $('<dd><a role="button" href="#" id="df-button" class="js-quickfilter-button ghx-active" title="Dynamic Filters">DF</a></dd>').insertAfter('#js-quickfilters-label');
                $('<div id="df-container"><div id="df-label">Dynamic Filters:</div><div id="df-clear"><a role="button" href="#" id="df-button" title="Dynamic Filters">Clear</a></dd></div>').insertAfter('#js-work-quickfilters');
            }

            if($('#df-container').length) {
                clearInterval(initializeContainerInterval);
                postInitializeFunc();
            }
        }, 100);

        var initializeContainerInterval2 = setInterval(function() {
            if ($('.ghx-columns').length && $('#df-container').length) {
                clearInterval(initializeContainerInterval2);
                createFilters();
            }
        }, 100);

    }

    function postInitializeFunc() {
        var button = $("#df-button")[0];
        var container = $("#df-container")[0];
        $(button).click(function() {

            if ($(container).css('display') == 'none') {
                $(button).addClass("ghx-active");
                $(container).slideDown("slow");
            } else {
                $(button).removeClass("ghx-active");
                $(container).slideUp("slow");
            }
        });

        var buttonClear = $("#df-clear")[0];

        $(buttonClear).click(function() {
            $(".df-avatar").each(function() {
                $(this).removeClass("df-active");
                $.removeCookie(rapidView + $(this).attr("name"));
            });
            filterIssues();
        });


        $('#ghx-pool').on('DOMSubtreeModified', function (){
            clearTimeout($(this).data('timer'));
            $(this).data('timer', setTimeout(function(){
                console.log('changed ' + $(this).html);
                filterIssues();
            },10));

        });

/*
        $('.ghx-issue').waypoint(function() {
            console.log('changed ' + $(this).html);
            filterIssues();
        });
*/

    }

    function setupAssignee() {

        var assigneeList = [],
            assigneeTag, name, array, assigneeDiv;

        $('.ghx-avatar').each(function() {

            assigneeTag = $(this).children();
            if ($(assigneeTag).length !== 1) {
                return;
            }

            name = $(assigneeTag).attr('data-tooltip').split('Assignee: ').pop();

            if (assigneeList.find(data => data.name === name)) {
                return;
            }

            if (assigneeTag.attr('src')) {
                assigneeList.push(
                    {
                        "name": name,
                        "img": assigneeTag.attr('src')
                    }
                );
            }

            if (assigneeTag.attr('style')) {

                assigneeList.push(
                    {
                        "name": name,
                        "img": assigneeTag.attr('style')
                    }
                );
            }
        });

        $('#df-container').append('<div id="df-container-assignee">' +
                                  '<div id="df-assignee-sort-div">' +
                                  '<div id="df-assignee-sort-label">Sort</div>' +
                                  '<div id="df-assignee-sort-radio-container">' +
                                  '<input class="df-assignee-sort-radio" type="radio" value="firstname" name="assignee" id="sort-firstname" checked>' +
                                  '<label class="df-assignee-sort-radio-label" title="Sort: First Name" for="sort-firstname">FN</label>' +
                                  '<input class="df-assignee-sort-radio" type="radio" value="lastname" name="assignee" id="sort-lastname">' +
                                  '<label class="df-assignee-sort-radio-label" title="Sort: Last Name" for="sort-lastname">LN</label>' +
                                  '</div></div></div>');

        assigneeList.forEach(function (assignee, i) {
            if (assignee.img.startsWith("http")) {
                assigneeDiv = $('#df-container-assignee').append('<div class="df-assignee-div">' +
                                                                 '<img src="' + assignee.img + '" class="df-avatar ghx-avatar-img" name="' + assignee.name + '" alt="Assignee: ' + assignee.name + '" data-tooltip="Assignee: ' + assignee.name + '" /></div>');
            } else {
                assigneeDiv = $('#df-container-assignee').append('<div class="df-assignee-div">' +
                                                                 '<span style="' + assignee.img + '" class="df-avatar ghx-avatar-img ghx-auto-avatar" name="' + assignee.name + '" data-tooltip="Assignee: ' + assignee.name + '">' + assignee.name.charAt(0) + '</span></div>');
            }
        });

        $('#df-container-assignee').append('<div class="df-assignee-div unassigned" style="order: 666">' +
                                           '<img src=document.location.protocol +"//"+ document.location.hostname + "/jira/secure/useravatar?size=medium&avatarId=10173" class="df-avatar ghx-avatar-img" name="Unassigned" alt="Assignee: Unassigned" data-tooltip="Assignee: Unassigned" /></div>');

        teamAssignee.forEach(setupTeamAssignee);
        $(".df-avatar").each(applyFilter);
        filterIssues();

        $(".df-avatar").click(function() {
            if ($(this).hasClass("df-active")) {
                $(this).removeClass("df-active");
                $.removeCookie(rapidView + $(this).attr("name"));
            } else {
                $(this).addClass("df-active");
                $.cookie(rapidView + $(this).attr("name"), 1);
            }

            filterIssues();
        });

        if (typeof $.cookie(rapidView + "df-sort-assignee") != 'undefined') {
            ($('input[type=radio][name="assignee"][value="' + $.cookie(rapidView + "df-sort-assignee") + '"]')[0]).checked = true;
        }
        sortAssignee();

        $('input[type=radio][name="assignee"]').change(function() {
            $.cookie(rapidView + "df-sort-assignee", $(this).val());
            sortAssignee($(this).val());
        });
    }

    function setupTeamAssignee(assignee, i) {
        if ($('#df-container-assignee').find("[name='" + assignee + "']").length) {
            $('#df-container-assignee').find("[name='" + assignee + "']").parent().css("order", i);
            $('#df-container-assignee').find("[name='" + assignee + "']").parent().addClass("team-assignee");
        } else {
            $('#df-container-assignee').append('<div class="df-assignee-div team-assignee">' +
                                               '<span style="background-color: ' + getRandomColor() + '" class="df-avatar ghx-avatar-img ghx-auto-avatar" name="' + assignee + '" data-tooltip="Assignee: ' + assignee + '">' + assignee.charAt(0) + '</span></div>');
        }
    }

    function applyFilter() {
        if ($.cookie(rapidView + $(this).attr("name"))) {
            $(this).addClass("df-active")
        }
    }


    function filterIssues() {
        var assignees = [], hide;
        $(".df-assignee-div").each(function() {
            if ($(this).children().hasClass("df-active")) {
                assignees.push($(this).children().attr("name"));
            }
        });

        if (assignees.length === 0) {
            $('.ghx-issue').each(function() {
                $(this).removeClass("hide");
            });
            return;
        }

        $('.ghx-issue').each(function() {
            hide = 1;
            if ($(this).find(".ghx-avatar-img").length) {
                if (assignees.includes($(this).find(".ghx-avatar-img").attr('data-tooltip').split('Assignee: ').pop())) {
                    hide = 0;
                }
            } else {
                if (assignees.includes("Unassigned")) {
                    hide = 0;
                }
            }

            if (hide === 1) {
                $(this).addClass("hide");
            } else {
                $(this).removeClass("hide");
            }
        });

    }

    function getRandomColor(){
        function c() {
            var hex = Math.floor(Math.random()*256).toString(16);
            return ("0"+String(hex)).substr(-2);
        }
        return "#"+c()+c()+c();
    }

    function sortAssignee(sortorder) {
        var assignees = [], teamAssignees = [], allAssignees = [];

        $(".team-assignee").each(function() {
            teamAssignees.push($(this).children().attr("name"));
        });

        $(".df-assignee-div").not("[class*='team-assignee']").not("[class*='unassigned']").each(function() {
            assignees.push($(this).children().attr("name"));
        });

        if (sortorder === "firstname" || typeof sortorder === 'undefined') {
            allAssignees = teamAssignees.sort(compareFirstNames).concat(assignees.sort(compareFirstNames));
        } else {
            allAssignees = teamAssignees.sort(compareLastNames).concat(assignees.sort(compareLastNames));
        }

        allAssignees.forEach(function(assignee, i) {
            $($($(".df-assignee-div>[name='" + assignee + "']")[0]).parent()[0]).css("order", i);
        });
    }

    function compareFirstNames(a, b) {
        var splitA = a.split(" ");
        var splitB = b.split(" ");
        var lastA = splitA[0];
        var lastB = splitB[0];

        if (lastA < lastB) return -1;
        if (lastA > lastB) return 1;
        return 0;
    }

    function compareLastNames(a, b) {
        var splitA = a.split(" ");
        var splitB = b.split(" ");
        var lastA = splitA[splitA.length - 1];
        var lastB = splitB[splitB.length - 1];

        if (lastA < lastB) return -1;
        if (lastA > lastB) return 1;
        return 0;
    }


    var styles = `

        #ghx-header {
            padding: 10px 20px 0px 20px;
        }

        ##ghx-header h1 {
            font-weight: 500;
        }

        #ghx-header h1 span#ghx-board-name {
            padding: 2px 10px 0 0;
        }


        #ghx-header h1 span {
            display: inline-block;
        }

        span#subnav-title span {
            font-size: 20px;
        }


        /* DF General */ /* DF General */ /* DF General */ /* DF General */

        #df-button {
            padding: 7px 2px;
            text-decoration: underline;
        }

       /* DF Assignee Sort */ /* DF Assignee Sort */ /* DF Assignee Sort */


        #df-assignee-sort-div {
            height: 30px;
            text-transform: uppercase;
            display: inline-block;
        }

        #sort-firstname + label {
            float: left;
            width: 100%;
        }

        #sort-lastname + label {
            float: left;
            clear: left;
            width: 100%;
        }

        .df-assignee-sort-radio {
            pointer-events: none;
        }

        #df-assignee-sort-radio-container {
            display: inline-block;
            margin-right: 10px;

        }

        #df-asssignee-sort-radio-container > *{
            position: absolute;
        }

        .df-assignee-sort-radio:checked + label,
        .df-assignee-sort-radio:not(:checked) + label {
            height: 11px;
            line-height: 11px;
        	padding: 1px 2px;
        	border-radius: 4px;
            border: 1px solid;
        	font-size: 10px;
        	text-align: center;
        	overflow: hidden;
        	cursor: pointer;
        	text-transform: uppercase;
        	-webkit-transition: all 300ms linear;
        	transition: all 300ms linear;
        }
        .df-assignee-sort-radio:checked + label {
            border-color: transparent;
            background-color: #344563;
            color: white;
        }

        .df-assignee-sort-radio:hover:not(:checked) + label {
            border-color: #c1c7d0 !important;
        }

        .df-assignee-sort-radio:not(:checked) + label {
            border-color: transparent;
            background-color: white;
            color: #344563;
        }

        [type="radio"]:checked,
        [type="radio"]:not(:checked){
        	position: absolute;
        	left: -9999px;
        	width: 0;
        	height: 0;
        	visibility: hidden;
        }

        #df-assignee-sort-label {
            display: inline-block;
            height: 30px;
            writing-mode: vertical-lr;
        	font-size: 12px;
            color: #0052cc;
        }

        /* DF Assignee Container */ /* DF Assignee Container */ /* DF Assignee Container */

        #df-container {
            padding-bottom: 10px;
        }

        #df-container>div {
            height: 30px;
            display: inline-block;
        }

        div#df-clear a {
            text-decoration: none;
            border: 1px solid transparent;
            -webkit-border-radius: 3px 3px 3px 3px;
            border-radius: 3px 3px 3px 3px;
            display: inline-block;
            line-height: 1;
            margin: 0 5px 0 0;
            padding: 7px 10px;
            float: left;
        }

        div#df-clear a:hover {
            border-color: rgb(63, 69, 71);
        }

        div#df-clear a:active {
            background-image: initial;
            background-color: rgb(42, 55, 79);
            border-color: transparent;
            color: rgb(232, 230, 227);
        }

        #df-label {
            float: left;
            padding-right: 10px;
            color: #5e6c84;
            font-size: 12px;
            font-weight: 600;
            line-height: 30px;
            letter-spacing: 0;
            text-transform: uppercase;
        }

        #df-container-assignee {
            display: inline-flex !important;
        }

        .df-assignee-div {
            display: inline-block;
            height: 26px;
            width: 26px;
            padding-bottom: 4px;
        }

        .df-assignee-div>img, .df-assignee-div>span {
            min-width: 24px;
            width: 30px;
            height: 30px;
            line-height: 30px !important;
            box-shadow: 0 0 0 1px white;
            -moz-user-select: none;
            -khtml-user-select: none;
            -webkit-user-select: none;
            -moz-user-drag: none;
            -khtml-user-drag: none;
            -webkit-user-drag: none;
        }

        .df-assignee-div>img {
            -webkit-border-radius: 50%;
            border-radius: 50%;
            background-color: white;
        }

        .df-assignee-div:hover {
            transform: scale(1.1);
            transform-origin: center
        }

        .df-active {
            box-shadow: 0 0 0 2px #344563 !important;
        }

        img.df-active {
            background-color: #344563 !important;
        }

        .hide {
            display: none;
        }

    `

    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

})();



