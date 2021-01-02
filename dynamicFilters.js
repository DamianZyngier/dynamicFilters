// ==UserScript==
// @name         Dynamic Filters
// @description  Make the JIRA filters more dynamic
// @author       Damian Zyngier
// @version      1.1
// @license      MIT
// @homepage     https://github.com/DamianZyngier/dynamicFilters
// @homepageURL  https://github.com/DamianZyngier/dynamicFilters
// @namespace    https://*.atlassian.net/*RapidBoard.jspa*
// @match        https://*.atlassian.net/*RapidBoard.jspa*
// ==/UserScript==

(function() {
    'use strict';

    var teamAssignee = [
        "Jan Kowalski",
        "Alina Nowak"
    ];

    var dfFieldsActive = {
        "assignee": [],
        "priority": [],
        "project": [],
        "epic": [],
        "type": [],
        "searchtext": [],
        "estimate": []
    };

    var rapidView = new URLSearchParams(window.location.search).get('rapidView');
    var setCookiesTimeout;
    var createFiltersInterval;
    var initializeContainerInterval;
    var unfoldBacklogInterval;

    initializePlugin();


    // https://openuserjs.org/scripts/KyleMit/Exclusive_Quick_Filters/source
    $("body").on("mouseup", ".df-avatar", function(e) {
        if ($(this).is(".df-active")) return;
        if (e.ctrlKey || e.shiftKey) return;

        dfFieldsActive["assignee"] = [];
        $(".df-avatar.df-active").removeClass("df-active");
    });

    // https://openuserjs.org/scripts/santa/Show_full_backlog_in_Jira_board/source
    function unfoldBacklog() {
        console.log("DF: " + arguments.callee.name);
        if ($('.js-show-all-link').first().click()) {
            clearInterval(unfoldBacklogInterval);
        }
    };



    function initializePlugin() {
        console.log("DF: " + arguments.callee.name);

        var searchParams = new URLSearchParams(window.location.search);

        if ($("#df-container").length || !searchParams.has('rapidView')) {
            console.log("DF: Container exists or rapidView do not exists");
            return;
        }

        // Sprint
        if (!(searchParams.has('view'))) {
            console.log("DF: View sprint");
            initializeContainerInterval = setInterval(initializeContainer, 100);
            createFiltersInterval = setInterval(createFilters, 100);
        }

        // Backlog
        if ((searchParams.get('view') === "planning.nodetail")) {
            console.log("DF: View backlog");
            unfoldBacklogInterval = setInterval(unfoldBacklog, 500);
        }

        $(".aui-nav-item").off("click");
        $(".aui-nav-item").click(initializePluginFromSidebar);

    }

    function initializePluginFromSidebar() {
        console.log("DF: " + arguments.callee.name);

        $(".aui-nav-item").off("click");
        setTimeout(function(){
            initializePlugin();
            $(".aui-nav-item").click(initializePluginFromSidebar);
        }, 200);

    }

    function initializeContainer() {
        console.log("DF: " + arguments.callee.name);
        if ($('#ghx-controls-work').length) {
            $('<dd><a role="button" href="#" id="df-button" class="js-quickfilter-button ghx-active" title="Dynamic Filters">DF</a></dd>').insertAfter('#js-quickfilters-label');
            $('<div id="df-container"><div id="df-label">Dynamic Filters:</div><div id="df-clear"><a role="button" href="#" class="df-disabled" title="Dynamic Filters">Clear</a></dd></div>').insertAfter('#js-work-quickfilters');
        }

        if($('#df-container').length) {
            clearInterval(initializeContainerInterval);
            $("#df-button").click(slideDF);
            $("#df-clear").click(clearDF);

            $('#ghx-pool').on('DOMSubtreeModified', function (){
                clearTimeout($(this).data('timer'));
                $(this).data('timer', setTimeout(function(){
                    filterIssues();
                },10));
            });

            $(".aui-nav-item").off("click");
            $(".aui-nav-item").click(initializePluginFromSidebar);
        }
    }

    function slideDF() {
        console.log("DF: " + arguments.callee.name);

        $("#df-button").toggleClass("ghx-active");
        if ($("#df-container").css('display') == 'none') {
            $("#df-container").slideDown("slow");
        } else {
            $("#df-container").slideUp("slow");
        }
    }

    function clearDF() {
        console.log("DF: " + arguments.callee.name);

        $(".df-active").each(function() {
            $(this).removeClass("df-active");
            removeProperty(dfFieldsActive, "assignee", $(this).attr("name"));
        });
        filterIssues();
    }

    function initializeActiveFields() {
        console.log("DF: " + arguments.callee.name);
        // Assignees
        $(".df-avatar").each(function() {
            if (dfFieldsActive["assignee"].includes($(this).attr("name"))) {
                $(this).addClass("df-active");
            }
        });
    }

    function createFilters() {
        console.log("DF: " + arguments.callee.name);
        if ($('.ghx-columns').length && $('#df-container').length) {
            clearInterval(createFiltersInterval);
            setupSearchField();
            setupAssignee();
        }
    }

    function setupSearchField() {
        console.log("DF: " + arguments.callee.name);

        $('#df-container').append('<div id="df-search-field">' +
                                  '<input aria-label="Search for issues" id="df-search-input" class="text" type="text">' +
                                  '<span id="df-search-icon" class="ghx-iconfont aui-icon aui-icon-small aui-iconfont-search-small">' +
                                  '</span></div>');

        $("#df-search-field")
            .click(searchFieldOnClick)
            .focusin(searchFieldOnFocusIn)
            .focusout(searchFieldOnFocusOut);
        $("#df-search-input").on('input', searchFieldOnInput);
        $("#df-search-icon").click(searchIconOnClick);
    }

    function searchIconOnClick() {
        console.log("DF: " + arguments.callee.name);
        if ($("#df-search-icon").hasClass("aui-iconfont-remove")) {
            $("#df-search-input").val("");
            $("#df-search-input").blur();
            searchFieldOnInput();
            filterIssues();
            event.stopImmediatePropagation();
        }
    }

    function searchFieldOnClick() {
        console.log("DF: " + arguments.callee.name);
        if ($("#df-search-input:not(:focus)").length) {
            $("#df-search-input").focus();
        };
    }

    function searchFieldOnFocusIn() {
        console.log("DF: " + arguments.callee.name);
        $("#df-search-input").animate({
            width: "150px"
        }, 300);
    }

    function searchFieldOnFocusOut() {
        console.log("DF: " + arguments.callee.name);
        if(!$("#df-search-input").val()) {
            $("#df-search-input").animate({
                width: "15px"
            }, 300);
        }
    }

    function searchFieldOnInput() {
        console.log("DF: " + arguments.callee.name);
        if($("#df-search-input").val()) {
            $("#df-search-icon").removeClass("aui-iconfont-search-small");
            $("#df-search-icon").addClass("aui-iconfont-remove");
        } else {
            $("#df-search-icon").removeClass("aui-iconfont-remove");
            $("#df-search-icon").addClass("aui-iconfont-search-small");
        }
        filterIssues();
    }

    function setupAssignee() {
        console.log("DF: " + arguments.callee.name);

        var assigneeList = [],
            assigneeTag, name, array, assigneeDiv;

        $('.ghx-avatar').children().each(function() {

            if ($(this).length !== 1) {
                return;
            }

            name = $(this).attr('data-tooltip').split('Assignee: ').pop();

            if (assigneeList.find(data => data.name === name)) {
                return;
            }

            // Has images
            if ($(this).attr('src')) {
                assigneeList.push(
                    {
                        "name": name,
                        "img": $(this).attr('src')
                    }
                );
            }

            // Without images
            if ($(this).attr('style')) {
                assigneeList.push(
                    {
                        "name": name,
                        "img": $(this).attr('style')
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
                                           '<img src="https://jira.deltavista.com/jira/secure/useravatar?size=medium&avatarId=10173" class="df-avatar ghx-avatar-img" name="Unassigned" alt="Assignee: Unassigned" data-tooltip="Assignee: Unassigned" /></div>');

        teamAssignee.forEach(setupTeamAssignee);
        getCookies();
        initializeActiveFields();
        filterIssues();

        $(".df-avatar").click(function() {
            if ($(this).hasClass("df-active")) {
                removeProperty(dfFieldsActive, "assignee", $(this).attr("name"));
            } else {
                addProperty(dfFieldsActive, "assignee", $(this).attr("name"));
            }
            $(this).toggleClass("df-active");

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

        if ($(".df-active")[0]) {
            $("#df-clear").children().removeClass("df-disabled");
        }
    }

    function setupTeamAssignee(assignee, i) {
        console.log("DF: " + arguments.callee.name);
        if ($('#df-container-assignee').find("[name='" + assignee + "']").length) {
            $('#df-container-assignee').find("[name='" + assignee + "']").parent().css("order", i).addClass("team-assignee");
        } else {
            $('#df-container-assignee').append('<div class="df-assignee-div team-assignee">' +
                                               '<span style="background-color: ' + getRandomColor() + '" class="df-avatar ghx-avatar-img ghx-auto-avatar" name="' + assignee + '" data-tooltip="Assignee: ' + assignee + '">' + assignee.charAt(0) + '</span></div>');
        }
    }

    function filterIssues() {
        console.log("DF: " + arguments.callee.name);

        var assignees = [], assignee, hide,
            searchInput = $("#df-search-input").val();
        $(".df-assignee-div").each(function() {
            if ($(this).children().hasClass("df-active")) {
                assignees.push($(this).children().attr("name"));
            }
        });

        if (!assignees.length && !searchInput) {
            $('.ghx-issue').each(function()  {
                $(this).removeClass("hide");
            });
            return;
        }

        $('.ghx-issue').each(function() {
            hide = 1, assignee = "";
            assignee = $(this).find(".ghx-avatar-img").attr('data-tooltip').split('Assignee: ').pop();

            if (($(this).find(".ghx-avatar-img").length && assignees.includes(assignee)) || (!$(this).find(".ghx-avatar-img").length && assignees.includes("Unassigned"))) {
                hide = 0;
            }

            console.log("DF: " + assignee);

            if ($(this).text().toLowerCase().includes(searchInput.toLowerCase()) || assignee.toLowerCase().includes(searchInput.toLowerCase())) {
                hide = 0;
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
        console.log("DF: " + arguments.callee.name);
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

    function setCookies() {
        console.log("DF: " + arguments.callee.name);
        clearTimeout(setCookiesTimeout);
        setCookiesTimeout = setTimeout(function() {
            for (var k in dfFieldsActive) {
                if (dfFieldsActive.hasOwnProperty(k)) {
                    $.cookie(rapidView + ":" + k, JSON.stringify(dfFieldsActive[k]));
                }
            }
        }, 1000);
    }

    function getCookies() {
        console.log("DF: " + arguments.callee.name);
        for (var k in dfFieldsActive) {
            var cookie = $.cookie(rapidView + ":" + k);
            if (cookie) {
                dfFieldsActive[k] = JSON.parse(cookie);
            }
        }
    }

    function addProperty(array, key, value) {
        console.log("DF: " + arguments.callee.name);
        var index = $.inArray(value, array[key]);
        index == -1 ? array[key].push(value) : false;
        $("#df-clear").children().removeClass("df-disabled");
        setCookies();
    }

    function removeProperty(array, key, value) {
        console.log("DF: " + arguments.callee.name);
        var index = $.inArray(value, array[key]);
        index > -1 ? array[key].splice(index, 1) : false;
        setCookies();

        if (Object.keys(array).every(function(key){
            return array[key].length === 0
        })) {
            $("#df-clear").children().addClass("df-disabled");
        }
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

        .aui-nav-selected {
            pointer-events: none;
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
            height: 30px;
            padding-bottom: 10px;
        }

        #df-container>div {
            height: 30px;
            display: inline-block;
            float: left;
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

        div#df-clear a:hover:not(.df-disabled) {
            border-color: rgb(63, 69, 71);
        }

        div#df-clear a:active:not(.df-disabled) {
            background-image: initial;
            background-color: rgb(42, 55, 79);
            border-color: transparent;
            color: rgb(232, 230, 227);
        }

        div#df-clear a.df-disabled {
            pointer-events: none;
            color: #344563;
            text-decoration: line-through;
        }



        #df-search-input {
            width: 15px;
            padding: 5px 24px 5px 5px;
            border: 2px solid #dfe1e6;
            border-radius: 3px 3px 3px 3px;
            -webkit-border-radius: 3px 3px 3px 3px;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
            -webkit-box-sizing: border-box;
        }

        #df-search-icon {
            right: 20px;
            cursor: pointer;
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
