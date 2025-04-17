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
