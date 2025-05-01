var server = "https://local.aa5jc.com";

function getUrl(page) {
	var url = "";
	
	switch (page) {
		case "stats":
			url = "/stats.php";
			break;
		case "main":
			url = "/local/link.php?nodes=499601";
			break;
	}
	
    return server + url;
}

var uiBorder = ['bg-1'];
var uiColors = ['bg-2', 'bg-3', 'bg-4', 'bg-3', 'bg-4', 'bg-3', 'bg-4'];
var uiColorsDark = ['bg-2-dark', 'bg-3-dark', 'bg-4-dark', 'bg-3-dark', 'bg-4-dark', 'bg-3-dark', 'bg-4-dark'];
var uiInactive = ['bg-7', 'bg-8'];
var empty = ['bg-empty'];

var tmrClock = null;
var data = {
        location: {
                latitude:'',
                longitude:''
        },
        server: {
                cputemp: { F:0,C:0 },
                memory: { percentAvailable: '100' },
                cpuusage: 0,
                services: {
                        analogbridge: 'active',
                        mmdvmBridge: 'active',
                        md380Emulator: 'active'
                }
        },
        timestamp: {time:'00:00'}
};
function getData() {
        var request = new XMLHttpRequest();
        request.open('GET', getUrl("stats"), true);

        request.onload = function() {
                if (request.status >= 200 && request.status < 400) {
                        // Success!
                        $("body").removeClass("red-alert");
                        data = JSON.parse(request.responseText);

                        try {
                                // Send this to the iframe for display
                                document.getElementById('allmon2linkphp').contentWindow.updateLog("<span class='special'>" + request.responseText + '</span>');
                        }
                        catch (err) {
                                // Who cares.
                        }

                        if (data.skywarn != "0") {
                                $("body").addClass("red-alert");
                        }
                        else {
                                $("body").removeClass("red-alert");
                        }

                        // Calculate any values
                        data.server.memory.percentAvailable = Math.round((data.server.memory.free / data.server.memory.total) * 100);
                        data.server.cpuusage = Math.round(((data.server.cpuusage.split("load average: ")[1].split(", ")[1]) * 100) / data.server.cores);
                        data.location.headerString = data.location.latitude + ', ' + data.location.longitude;
                        data.weather.headerString = data.weather.observation + ", " + data.weather.temperature.F + " (" + data.weather.temperature.C + ")";

                        // Update the page
                        updateField("data.server.memory.percentAvailable", "RAM free: ", "%");
                        updateField("data.server.memory.available", "RAM avail: ", "MB");
                        updateField("data.server.memory.free", "RAM free: ", "MB");
                        updateField("data.server.cpuusage", "CPU used: ", "%");
                        updateField("data.timestamp.time");
                        updateField("data.location.headerString", "LOCATION: ");
                        updateField("data.location.AMSL", "ALTITUDE: ", " meters");
                        updateField("data.weather.headerString", "WEATHER: ")
                } else {
                        console.error("The server returned an error.");
                        $("body").addClass("red-alert");
                }
        };

        request.onerror = function() {
                console.error("Unable to connect to " + getUrl("stats"));
                $("body").addClass("red-alert");
        };

        request.send();
}
function updateField(id, prefix, suffix, dontIncludeValue){
        var val = "";
        if (prefix == null) {prefix = "";}
        if (suffix == null) {suffix = "";}
        if (dontIncludeValue == null) { dontIncludeValue = false; }
        if (!dontIncludeValue) { val = eval(id); }

        var el = document.getElementById(id);
        if (el != null) {
                if (el.hasAttribute("data-label")) {
                        el.setAttribute("data-label", prefix + val + suffix); 
                }
                else if (el.getElementsByClassName("text").length > 0) {
                        el.getElementsByClassName("text")[0].innerText = prefix + val + suffix;
                }
                else {
                        el.innerText = prefix + val + suffix;
                }
        }
        else {
                console.log('document.getElementById(' + id + ') is null');
        }
}
function getStatColor(stat, statValue) {
        var good = ['status-good-1', 'status-good-2', 'status-good-3', 'status-good-4'];
        var bad = ['bg-red-1','bg-red-2'];

        var rtn = good;

        if (stat == "temp" && statValue > 170) { rtn = bad; }
        if (stat == "memoryPercentAvailable" && statValue < 40) { rtn = bad; }
        if (stat == "cpu" && statValue > 70) { rtn = bad; }
        if (stat == "service" && statValue != "active") { rtn = bad; console.log("BAD... statValue = " + statValue); }

        return rtn;
}
function showAlternateData(objId, altValue) {
        oldValue = $("#" + objId).attr("data-label");
        $("#" + objId).attr("data-label", altValue);
        $("#" + objId).attr("href", 'javascript:showAlternateData("' + objId + '", "' + oldValue + '");');
}
function toggleFullScreen(event) {
  var element = document.body;

        if (event instanceof HTMLElement) {
                element = event;
        }

        var isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

        element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
        document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };

        isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}

var bracket = {type:'wrapper', class:'sdk bracket typeA', children:[
                {type:'wrapper', class:'content', id:"bracketContents", children: [
                        {type:'htmlTag', tag:'div', text:'', 
                         style:'background-image: url("/images/ufp.png"); background-size:contain; background-repeat: no-repeat; background-position: center center; height:100%; width:100%', 
                         color:LCARS.colorGen(uiColors).replace('bg-', 'text-')}
                ]},
                {type:'elbow', version:'top-left', size:'small', color:LCARS.colorGen(uiColors), children:[{type:'bar'}], noEvent:true},
                {type:'elbow', version:'top-right', size:'small', color:LCARS.colorGen(uiColors), children:[{type:'bar'}], noEvent:true},
                {type:'elbow', version:'bottom-left', size:'small', color:LCARS.colorGen(uiColors), children:[{type:'bar'}], noEvent:true},
                {type:'elbow', version:'bottom-right', size:'small', color:LCARS.colorGen(uiColors), children:[{type:'bar'}], noEvent:true},
                {type:'column', flex:'v', children:[
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors), children:[{type:'bar', color:'bg-white'}]},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)}
                ]},
                {type:'column', flex:'v', children:[
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)}
                ]},
                {type:'column', flex:'v', children:[
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors), children:[{type:'bar', color:'bg-white'}]},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)}
                ]},
                {type:'column', flex:'v', children:[
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)},
                        {type:'bar', flexC:'v', color:LCARS.colorGen(uiColors)}
                ]}
        ]
};

var buttonCount = 0;
function makeButton(labelString, URL) {
        buttonCount++;

        var btnVersion;
        if (buttonCount % 2 != 0) { btnVersion = 'left'; }
        else { btnVersion = 'button';  }

        if ((labelString == "") && (URL == "")) {
                return {type:'button', color:LCARS.colorGen('bg-empty'), label:''};
        }
        else if (URL == "#") {
                return {type:'button', color:'bg-white', label:labelString, version:btnVersion};
        }
        else {
                return {type:'button', color:LCARS.colorGen(uiColors), version:btnVersion, label:labelString, href:'javascript:window.open("' + URL + '")' };
        }
}

function buildNemesisUi() {
        var nemesisUI = {type:'wrapper', id:'wpr_viewport', version:'row', flex:'h', arrive:function(){$(this).viewport('zoom', {width:1920, height:1080});}, children:[

                //Left Column Wrapper
                {type:'column', flex:'v', children:[
                        {type:'wrapper', children:[

                                //Bracket
                                {type:'bracket', template:bracket},

                                //Top Button Group
                                {type:'wrapper', flex:'h', version:'button-wrap', children:[
                                        {type:'button', color:LCARS.colorGen(getStatColor('cpu',data.server.cpuusage)), id:'data.server.cpuusage', label:'', version:'left'},
                                        {type:'button', color:LCARS.colorGen(getStatColor('memoryPercentAvailable',data.server.memory.percentAvailable)), id: 'data.server.memory.percentAvailable', label:'', version:'button' },
                                        {type:'button', color:LCARS.colorGen(getStatColor('memoryAvailable',data.server.memory.available)), id: 'data.server.memory.available', label:'', version:'left' },
                                        {type:'button', color:LCARS.colorGen(getStatColor('memoryFree',data.server.memory.free)), id: 'data.server.memory.free', label:'', version:'button' },

                                        makeButton("",""),makeButton("",""),
                                        makeButton("About Me","https://about.me/joshuacarroll"),
                                        makeButton("LinkedIn", "https://www.linkedin.com/in/joshuacarroll/"),
                                        makeButton('Github', "https://github.com/JoshuaCarroll/"),
                                        makeButton("Stack Overflow","https://stackoverflow.com/users/1539065/joshua"),
                                        makeButton("Blog","https://joshwebdev.blogspot.com/"),
                                        makeButton("Instagram","https://www.instagram.com/j0s.h/"),
                                        makeButton("Personal YouTube","https://www.youtube.com/channel/UCzIgyTBQ0267ANPd1y6B4ig"),
                                        makeButton("QRZ","https://qrz.com/db/aa5jc"),
                                ]},
                                {type:'wrapper', flex:'h', version:'button-wrap', children:[]},
                        ]},

                        {type:'column', style:'justify-content: flex-end;', flexC:'v', flex:'v', children:[
                                {type:'complexButton', id:'data.timestamp.time', text: '00:00', template:LCARS.templates.sdk.buttons.complexText.typeG, colors:LCARS.colorGroupGen(uiColors, 3)}
                        ]}
                ]},

                //Main Area
                {type:'wrapper', version:'column', id:'wpr_mainView', flex:'v', flexC:'h', children:[   

                        //Header
                        {type:'row', version:'header', flex:'h', children:[

                                //Elbow & Button
                                {type:'column', flex:'v', children:[
                                        {type:'elbow', version:'bottom-left', color:LCARS.colorGen(uiBorder), flexC:'v'}
                                ]},

                                {type:'wrapper', flexC:'h', flex:'v', children:[

                                        //Header Content Area
                                        {type:'wrapper', version:'content', flexC:'v', children:[
                                                {type:'row', flex:'h', children:[
                                                        {type:'column', class:'headerCol1 text-grey-3', flex:'h', children:[
                                                                {type:'wrapper', flex:'h', class:'stats', children:[
                                                                        {type:'htmlTag', tag:'ul', children:[
                                                                                {type:'htmlTag', tag:'li', id:'data.location.headerString'},
                                                                                {type:'htmlTag', tag:'li', id:'data.location.AMSL'},
                                                                                {type:'htmlTag', tag:'li', id:'data.weather.headerString'},
                                                                                {type:'htmlTag', tag:'li', id:'data.server.ports.headerString'},
                                                                        ]}
                                                                ]}
                                                        ]},
                                                        {type:'column', class:'headerCol2', flex:'h', children:[
                                                                //Header Title
                                                                {type:'title', text:'AA5JC', class:'headerTitle'},

                                                                //Header Pill Button Group
                                                                {type:'wrapper', flex:'h', class:'button-wrap headerButtons', children:[
                                                                        {type:'button', color:LCARS.colorGen(uiColors), version:'left', label:'Full screen', href:'javascript:toggleFullScreen();'},
                                                                        {type:'button', color:LCARS.colorGen(uiColors), version:'button', label:'Get data', href:'javascript:getData();'},
                                                                        {type:'button', color:LCARS.colorGen(uiColors), version:'left', label:'AllStar map', href:'javascript:window.open("https://stats.allstarlink.org/maps/allstarUSAMap.html");' },
                                                                        {type:'button', color:LCARS.colorGen(uiColors), version:'button', label:'Reload', href:'javascript:window.location.reload();'}
                                                                ]}
                                                        ]}
                                                ]}
                                        ]},
                                        //Header Bottom Bars
                                        {type:'row', version:'frame', flex:'h', children:[
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder), flexC:'h'},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)}
                                        ]}
                                ]}
                        ]},

                        //Main Content Area
                        {type:'wrapper', class:'main', flex:'h', flexC:'v', children:[

                                //Left Columns & Elbow
                                {type:'wrapper', version:'column', flex:'v', children:[
                                        {type:'elbow', version:'top-left', color:LCARS.colorGen(uiBorder), class:'step-two'},
                                        {type:'button', id:'btn00', color:LCARS.colorGen(uiColorsDark), label:'Allstar Hub', href:'javascript:setContent("'+ server + '/local/link.php?nodes=499601", "btn00")'},
                                        {type:'button', id:'btn01', color:LCARS.colorGen(uiColorsDark), label:'Monitor Skywarn', href:'javascript:setContent("https://www.broadcastify.com/webPlayer/45060", "btn01")'},
                                        {type:'button', id:'btn05', color:LCARS.colorGen(uiColorsDark), label:'Radar', href:'javascript:setContent("https://radar.weather.gov/?settings=v1_eyJhZ2VuZGEiOnsiaWQiOiJuYXRpb25hbCIsImNlbnRlciI6Wy05Mi4wOTUsMzQuNjU4XSwibG9jYXRpb24iOm51bGwsInpvb20iOjcuNjgyNTI2NzY1NDYxMjI3LCJsYXllciI6ImJyZWZfcWNkIn0sImFuaW1hdGluZyI6ZmFsc2UsImJhc2UiOiJkYXJrY2FudmFzIiwiYXJ0Y2MiOmZhbHNlLCJjb3VudHkiOnRydWUsImN3YSI6ZmFsc2UsInJmYyI6ZmFsc2UsInN0YXRlIjpmYWxzZSwibWVudSI6dHJ1ZSwic2hvcnRGdXNlZE9ubHkiOnRydWUsIm9wYWNpdHkiOnsiYWxlcnRzIjowLjgsImxvY2FsIjowLjYsImxvY2FsU3RhdGlvbnMiOjAuOCwibmF0aW9uYWwiOjAuNn19", "btn05")'},
                                        {type:'button', id:'btn04', color:LCARS.colorGen(uiColorsDark), label:'Ham.Live', href:'javascript:setContent("https://www.ham.live/views/dashboard", "btn04")'},
					{type:'button', color:LCARS.colorGen(uiBorder), flexC:'v'},
					{type:'button', id:'btn06', color:LCARS.colorGen(uiColorsDark), label:'Monitor Skywarn', href:'javascript:setContent("https://www.broadcastify.com/webPlayer/43811", "btn06")'},
					{type:'button', color:LCARS.colorGen(uiBorder), flexC:'v'},
                                        {type:"button", id:'lcarsSkywarn', color:LCARS.colorGen(uiColorsDark), label:"Activate Skywarn", href:"javascript:setContent('" + server + "/totp/auth.php');" },
                                ]},

                                {type:'column', flexC:'h', flex:'v', children:[
                                        //Top Bars Group
                                        {type:'row', flex:'h', class:'frame', children:[
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder), version:'small'},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder), flexC:'h'},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)},
                                                {type:'bar', color:LCARS.colorGen(uiBorder)}
                                        ]},

                                        //Main Content Wrapper
                                        {type:'wrapper', class:'content', flexC:'v', style:'margin:0px; padding:0px;  overflow:auto;', children:[
                                                {
                                                        type:'htmlTag', tag:'div', id:'divMainContent', text:'',
                                                        style:'margin:0px; padding:0px; width: 100%; height: 100%; overflow: hidden;',
                                                        color:LCARS.colorGen(uiColors).replace('bg-', 'text-')
                                                }
                                        ]}
                                ]}
                        ]}
                ]}
        ]};

        $("body").html("");
        $(nemesisUI).createObject({appendTo:'body'});
}
function getUtcTime() {
        var now = new Date;
        var hours = now.getUTCHours().toString() ;
        var minutes = now.getMinutes().toString();
        var separator = ":";
        if (hours.length == 1) { hours = "0" + hours; }
        if (minutes.length == 1) {minutes = "0" + minutes; }
        return hours + separator + minutes;
}
function getMillisecondsLeft() {
        // Ensures that this only runs exactly once per minute
        var now = new Date();
        var ms = ((60 - now.getSeconds()) * 1000) + (1000 - now.getMilliseconds());
        return ms;
}
function tmrClock_tick() {
        getData();
        tmrClock = window.setTimeout(function() {
                tmrClock_tick();
        }, getMillisecondsLeft());
}
function setContent(url, caller) {
        var iframeName = url.replace(/:/g,"").replace(/\//g,"").replace(/\./g,"");
        arrCharactersToStopAt = ["?","#"];
        for (var x = 0; x < arrCharactersToStopAt.length; x++) {
                if (iframeName.indexOf(arrCharactersToStopAt[x]) > 0) {
                        iframeName = iframeName.substring(0,iframeName.indexOf(arrCharactersToStopAt[x]));
                }
        }

        if ( $("#"+iframeName).length ) {
                if ($("#"+iframeName).is(":visible")) {
                        $("#"+iframeName).remove();
                        setButtonStatus(caller, false);
                }
                else {
                        $("iframe").hide();
                        $("#"+iframeName).show();
                        setButtonStatus(caller, true);
                }
        }
        else {
                setButtonStatus(caller, true);
                $("iframe").hide();
                $("#divMainContent").append("<iframe id='" + iframeName + "' allow='camera;microphone' src='" + url + "'></iframe>");
        }
}
function setButtonStatus(obj, isEnabled) {
        if (obj != null) {
                if (isEnabled) {
                        var objClass = $("#"+obj).attr("class").replace("-dark","");
                        $("#"+obj).attr("class", objClass);
                }
                else {
                        var objClass = $("#"+obj).attr("class") + "-dark";
                        $("#"+obj).attr("class", objClass);
                }
        }
}
$(document).on('ready', function(){
        $("body").html("");
        buildNemesisUi();
        tmrClock_tick();
        setContent(getUrl("main"), "btn00");
});

