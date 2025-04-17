        <?php

                include "/var/www/html/allmon2/session.inc";
                error_reporting(E_ALL);
                
        ?>
<!DOCTYPE html>
<html>
<head>
    <title>Link</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="robots" content="noindex, nofollow">
    <link type="text/css" rel="stylesheet" href="allmon.css">
    <link type="text/css" rel="stylesheet" href="jquery-ui.css">
    <script src="jquery-3.3.1.min.js"></script>
    <script src="jquery-ui.min.js"></script>
    <script type="text/javascript">
        $(document).ready(function() {
            var sessionLoggedIn = <?= ($_SESSION['loggedin'] === true) ?>;

            //Set to hide Login Link
            hideLoginLink = false
            
            // Hide login link on page load?
            if (hideLoginLink) {
                $('#loginlink').hide();
            }

            if (sessionLoggedIn) {
                $('#loginlink').hide();
            } else {
                $('#connect_form').hide();
                $('#logoutlink').hide();
            }
            
            // Login dialog
            $("#login").dialog( {
                autoOpen: false,
                title: 'Manager Login',
                modal: true,
            open: function() {
                // On open, hide the original submit button
                $( this ).find( "[type=submit]" ).hide();
            },
                buttons: [ { 
                text: "OK",
                type: "submit",
                form: "login",
                click: function() {
                    var user = $('form input:text').val();
                    var passwd = $('input:password').val();
                    $(this).dialog("close"); 
                    $('#test_area').load("login.php", { 'user' : user, 'passwd' : passwd }, function(response) {
                        if (response.substr(0,5) != 'Sorry') {
                            $('#connect_form').show();
                            $('#logoutlink').show();
                            $('#loginlink').hide();
                        }
                    });
                    $('#test_area').stop().css('opacity', 1).fadeIn(50).delay(1000).fadeOut(2000);
                }
                } ]
            });

            // make enter key submit login form
            $('#login').on('keyup', function(e){
            if (e.keyCode == 13) {
                $(':button:contains("OK")').click();
            }
            });
            
            // Login dialog opener
            $("#loginlink").click(function() {
                $("#login").dialog('open');
                return false;
            });
            
            // Logout 
            $('#logoutlink').click(function(event) {
                $.get("logout.php");
                if (! hideLoginLink) {
                    $('#loginlink').show();
                }
                $('#logoutlink').hide();
                $('#connect_form').hide();
                event.preventDefault();
            });

            // Ajax function a link
            $('#connect, #monitor, #permanent, #localmonitor, #disconnect').click(function() {
                var button = this.id;    // which button was pushed
                var localNode = $('#localnode').val();
                var remoteNode = $('#node').val(); 
                var perm = $('input:checkbox:checked').val();

                    if (remoteNode.length == 0) {
                        alert('Please enter the remote node number.');
                        return;
                    }
                    
                    if (button == 'disconnect') {
                    r = confirm("Disconnect " + remoteNode + " from " + localNode + "?");
                        if (r !== true) {
                                return;
                        }
                        
                    }            
                    
                $.ajax( { url:'/allmon2/connect.php', data: { 'remotenode' : remoteNode, 'perm' : perm, 'button' : button, 'localnode' : localNode }, type:'post', success: function(result) {
                        $('#test_area').html(result);
                        $('#test_area').stop().css('opacity', 1).fadeIn(50).delay(1000).fadeOut(2000);
                    }
                });
            });

            $('#controlpanel').click(function (event) {
                var url = "controlpanel.php?node=" + $('#localnode').val();
                var windowName = "controlPanel";
                var windowSize = 'height=750, width=900';

                window.open(url, windowName, windowSize);

                event.preventDefault();
            });
            
            // Click on a cell to populate the input form
            $('table').on('click', 'td', function( event ) {
                if ( $( this ).attr('class') == 'nodeNum') {
                        // Put node number into id="node"
                        $('#connect_form #node').val($( this ).text());
                        
                        // split table ID and put node into id="localnode"
                        var idarr = $( this ).closest('table').attr('id').split('_');
                        $('#connect_form #localnode').val(idarr[1]);
                }  
            });
            
            // Uncomment this block to allow shift+h to show login dialog.  
            $(document).keypress(function(event) {
                if (hideLoginLink) {
                    var checkWebkitandIE=(event.which==72 ? 1 : 0);
                    var checkMoz=(event.which==104 && event.shiftKey ? 1 : 0);

                    if (sessionLoggedIn && (checkWebkitandIE || checkMoz)) {
                        $("#login").dialog('open');
                        return false;
                    }
                }
            
            });
        });
    </script>
</head>
<body>
    <div id="header">
        <div id="headerLogin">
            <a href="#" id="loginlink">Login</a>
            <a href="#" id="logoutlink">Logout</a>
        </div>
    </div>

    <div id="login">
        <div>
            <form method="post" action="">
                <table>
                    <tr><td>Username:</td><td><input style="width: 150px;" type="text" name="user" autocapitalize="none"></td></tr>
                    <tr><td>Password:</td><td><input style="width: 150px;" type="password" name="password"></td></tr>
                </table>
            </form>
        </div>
    </div>
    <div id="test_area"></div>

        <?php

                $parms = @trim(strip_tags($_GET['nodes']));
                $passedNodes = explode(',', @trim(strip_tags($_GET['nodes'])));

                if (count($passedNodes) == 0) {
                        die ("Please provide a properly formated URI. (ie link.php?nodes=1234 | link.php?nodes=1234,2345)");
                }

                // Get Allstar database file
                $db = "/var/log/asterisk/astdb.txt";
                $astdb = array();
                if (file_exists($db)) {
                        $fh = fopen($db, "r");
                        if (flock($fh, LOCK_SH)){
                                while(($line = fgets($fh)) !== FALSE) {
                                $arr = preg_split("/\|/", trim($line));
                                $astdb[$arr[0]] = $arr;
                                }
                        }
                        flock($fh, LOCK_UN);
                        fclose($fh);
                }

                // Read allmon INI file
                if (!file_exists('../allmon2/allmon.ini.php')) {
                        die("Couldn't load allmon ini file.\n");
                }
                // Parse the allmon.ini file
                $config = parse_ini_file('../allmon2/allmon.ini.php', true);

                // Remove nodes not in our allmon.ini file.
                $nodes=array();
                foreach ($passedNodes as $i => $node) {
                        if (isset($config[$node])) {
                                $nodes[] = $node;
                        } else {
                                print "Warning: Node $node not found in our allmon ini file.";
                        }
                }
        ?>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                crossorigin=""/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                crossorigin=""></script>
        <link type="text/css" rel="stylesheet" href="link.css" />
        <script type="text/javascript">

                function formatTimeSpan(timeSpan) {
                        var arrTime = timeSpan.split(":");

                        if (arrTime.length != 3) { return timeSpan; }

                        var hours = parseInt(arrTime[0]);
                        var minutes = parseInt(arrTime[1]);
                        var seconds = parseInt(arrTime[2]);
                        var output = "";

                        if (hours > 168) { output = roundOff(hours, 168, "wks"); }
                        else if (hours > 24) { output = roundOff(hours, 24, "days"); }
                        else if (hours > 0) { output = roundOff(hours, 60, "hrs"); }
                        else if (minutes > 0) { output = minutes + " min"; }
                        else if (hours + minutes == 0) { output = seconds + " sec"; }
                        else { output = timeSpan; }

                        return output;
                }

                function roundOff(valueToRound, divisor, nameOfMeasurement) {
                        var decimalPlaces = 1;
                        var intDecimal = Math.pow(10, decimalPlaces);
                        return Math.round( valueToRound * intDecimal / divisor ) / intDecimal + " " + nameOfMeasurement;
                }

                // when DOM is ready
                $(document).ready(function() {
                if(typeof(EventSource)!=="undefined") {

                        // Start SSE
                        var source=new EventSource("/allmon2/server.php?nodes=<?php echo $parms; ?>");

                        // Fires when node data come in. Updates the whole table
                        source.addEventListener('nodes', function(event) {
                        // console.log('nodes: ' + event.data);
                        // server.php returns a json formated string
                        var tabledata = JSON.parse(event.data);
                                for (var localNode in tabledata) {
                                        var tablehtml = '';
                                                if (tabledata[localNode].remote_nodes.length == 0) {
                                                        $('#table_' + localNode  + ' tbody:first').html('<tr><td colspan="7">No connections.</td></tr>');
                                                } else {
                                                for (row in tabledata[localNode].remote_nodes) {

                                                // Set green, red or no background color
                                                if (tabledata[localNode].remote_nodes[row].keyed == 'yes') {
                                                        tablehtml += '<tr class="rColor">';
                                                        setStatus(tabledata[localNode].remote_nodes[row].node, "transmitting");
                                                } else if (tabledata[localNode].remote_nodes[row].mode == 'C') {
                                                        tablehtml += '<tr class="cColor">';
                                                        setStatus(tabledata[localNode].remote_nodes[row].node, "notconnected");
                                                } else {
                                                        tablehtml += '<tr>';
                                                        setStatus(tabledata[localNode].remote_nodes[row].node, "connected");
                                                }

                                                var id = 't' + localNode + 'c0' + 'r' + row;
                                                tablehtml += '<td id="' + id + '" class="nodeNum">' + tabledata[localNode].remote_nodes[row].node + '</td>';

                                                // Show info or IP if no info
                                                if (tabledata[localNode].remote_nodes[row].info != "") {
                                                        tablehtml += '<td>' + tabledata[localNode].remote_nodes[row].info + '</td>';
                                                } else {
                                                        tablehtml += '<td>' + tabledata[localNode].remote_nodes[row].ip + '</td>';
                                                }

                                                tablehtml += '<td id="lkey' + row + '">***' + formatTimeSpan(tabledata[localNode].remote_nodes[row].last_keyed) + '</td>';
                                                tablehtml += '<td>' + tabledata[localNode].remote_nodes[row].link.toLowerCase() + '</td>';
                                                tablehtml += '<td>' + tabledata[localNode].remote_nodes[row].direction.toLowerCase() + '</td>';
                                                tablehtml += '<td id="elap' + row +'">' + formatTimeSpan(tabledata[localNode].remote_nodes[row].elapsed) + '</td>';


                                                switch (tabledata[localNode].remote_nodes[row].mode) {
                                                        case "R":
                                                                tablehtml += '<td>Recv</td>';
                                                                break;
                                                        case "T":
                                                                tablehtml += '<td>Full</td>';
                                                                break;
                                                        case "C":
                                                                tablehtml += '<td>Connecting</td>';
                                                                break;
                                                        case "Remote":
                                                                tablehtml += '<td>Remote</td>';
                                                                break;
                                                        default:
                                                                tablehtml += '<td>' + tabledata[localNode].remote_nodes[row].mode + '</td>';
                                                }

                                                tablehtml += '</tr>';
                                        }

                                                tablehtml += "<tr><td colspan='7'><h4 class='longRangeNodeHeader'>Down Range Nodes</h4>";
                                                for (row in tabledata[localNode].longrange_nodes) {
                                                        if (tabledata[localNode].longrange_nodes[row].node != "1999") {
                                                                tablehtml += "<div class='longRangeNode'>" + tabledata[localNode].longrange_nodes[row].node;
                                                                if (tabledata[localNode].longrange_nodes[row].info != "" && tabledata[localNode].longrange_nodes[row].info != "&nbsp;") {
                                                                        tablehtml += ": " + tabledata[localNode].longrange_nodes[row].info
                                                                }
                                                                tablehtml += "</div>";
                                                        }
                                                }
                                                tablehtml += "</td></tr>";

                                                $('#table_' + localNode + ' tbody:first').html(tablehtml);
                                        }
                                }
                        });

                        function randomLcarsColor() {
                                var arrColors = ["666666","e5cb4f","5a9sb7","93dfff","d77074","d5a5d3","18314c","43370d"];
                                return arrColors[Math.floor(Math.random() * arrColors.length)];
                        }

                        var blinkyModulusSeed = 5;

                        // Fires when new time data comes in. Updates only time columns
                        source.addEventListener('nodetimes', function(event) {
                                        var strEventData = event.data;

                                        var tabledata = JSON.parse(event.data);
                                        for (localNode in tabledata) {
                                                tableID = 'table_' + localNode;
                                                for (row in tabledata[localNode].remote_nodes) {
                                                        //console.log(tableID, row, tabledata[localNode].remote_nodes[row].elapsed, tabledata[localNode].remote_nodes[row].last_keyed);
                                                        rowID='lkey' + row;
                                                        $( '#' + tableID + ' #' + rowID).text( formatTimeSpan( tabledata[localNode].remote_nodes[row].last_keyed ) );
                                                        rowID='elap' + row;
                                                        $( '#' + tableID + ' #' + rowID).text( formatTimeSpan( tabledata[localNode].remote_nodes[row].elapsed ) );
                                                }
                                        }
                                        if (isNaN(blinky)) { blinky = 0; }
                                        if (blinky % 6 == 0) { $('#blinky').fadeToggle(1500); }

                                        if (blinky % blinkyModulusSeed == 0) {
                                                blinkyModulusSeed = Math.floor(Math.random() * 15) + 5;
                                                strEventData = "<span style='color: #" + randomLcarsColor()  + "'>" + strEventData + "</span>"; 
                                        }
                                        blinky++;

                                        updateLog(strEventData);
                        });

                        // Fires when conncetion message comes in.
                        source.addEventListener('connection', function(event) {
                                        //console.log(statusdata.status);
                                        var statusdata = JSON.parse(event.data);
                                        tableID = 'table_' + statusdata.node;
                                        $('#' + tableID + ' tbody:first').html('<tr><td colspan="7">' + statusdata.status + '</td></tr>');
                                });

                } else {
                        $("#list_link").html("Sorry, your browser does not support server-sent events...");
                }
                });

                var logArr = [];
                function updateLog(data) {
                        var log = "";

                        logArr.push(data);

                        if (logArr.length > 20) { logArr.shift(); }

                        for (var x = logArr.length-1; x>-1 ; x--) {
                                log += logArr[x] + ";";
                        }

                        $("#log").html(log + " ");
                }

        </script>

        <div id="connect_form">
        <?php
                if (count($nodes) > 0) {
                        if (count($nodes) > 1) {
                                print "<select id=\"localnode\">";
                                foreach ($nodes as $node) {
                                        if (isset($astdb[$node]))
                                                $info = $astdb[$node][1] . ' ' . $astdb[$node][2] . ' ' . $astdb[$node][3];
                                        else
                                                $info = "Node not in database";

                                        print "<option value=\"$node\">$node - $info</option>";
                                }
                                print "</select>\n";
                        } else {
                                print "<input type=\"hidden\" id=\"localnode\" value=\"{$nodes[0]}\">\n";
                        }
        ?>
                        <span id="connectionFields">
                                <input type="text" id="node">
                                <label for="chkPermanent">Permanent</label><input id="chkPermanent" type="checkbox"><br/>
                                <input type="button" value="Connect" id="connect">
                                <input type="button" value="Disconnect" id="disconnect">
                                <input type="button" value="Monitor" id="monitor">
                                <input type="button" value="Local Monitor" id="localmonitor">
                                <input type="button" value="Control Panel" id="controlpanel">
                        </span>
                <?php
                } 
                include "skywarn.inc.php";
                ?>
        </div>

        <!-- Nodes table -->
        <div>
        <?php
        #print '<pre>'; print_r($nodes); print '</pre>';
        foreach($nodes as $node) {
        #print '<pre>'; print_r($config[$node]); print '</pre>';
                if (isset($astdb[$node]))
                        $info = $astdb[$node][1] . ' ' . $astdb[$node][2] . ' ' . $astdb[$node][3];
                else
                        $info = "Node not in database";
        if (($info == "Node not in database" ) || (isset($config[$node]['hideNodeURL']) && $config[$node]['hideNodeURL'] == 1)) {
                $nodeURL = $node;
                $title = "$node - $info";
        } else {
                $nodeURL = "http://stats.allstarlink.org/nodeinfo.cgi?node=$node";
                $bubbleChart = "http://stats.allstarlink.org/getstatus.cgi?$node";
                $title = "Node <a href=\"$nodeURL\" target=\"_blank\">$node</a> - $info ";
                $title .= "<a href=\"$bubbleChart\" target=\"_blank\" id=\"bubblechart\">Bubble Chart</a>";
        }
        ?>
                <table class=gridtable id="table_<?php echo $node ?>">
                        <colgroup>
                                <col span="1">
                                <col span="1">
                                <col span="1">
                                <col span="1">
                                <col span="1">
                                <col span="1">
                                <col span="1">
                        </colgroup>
                        <thead>
                                <tr><th>Node</th><th>Node Information</th><th>Received</th><th>Link</th><th>Direction</th><th>Connected</th><th>Mode</th></tr>
                        </thead>
                        <tbody>
                                <tr><td colspan="7">Waiting...</td></tr>
                        </tbody>
                </table>
                <div id="map"></div>
        <?php
        }
        ?>
        </div>
        <div class="blinkyContainer">
                <div id="blinky">WORKING</div>
        </div>
        <div id="log"></div>

        <link rel="stylesheet" href="link_map.css" />
        <script src="link_map.js"></script>

        <div class="clearer"></div>
        <div></div>
</body>
</html>
