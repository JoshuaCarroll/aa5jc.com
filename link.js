/* links.js
 * Client?side logic for AllMon link manager
 * Extracted from original inline scripts and refactored into a single module.
 * Expects the following globals (bootstrapped by PHP):
 *   - SESSION_LOGGED_IN : boolean
 *   - NODES             : array<int|string>
 *   - ASTDB             : object { [node]: [desc, loc, owner] }
 */

/* global $, NODES, ASTDB, SESSION_LOGGED_IN */

(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Boot helpers
    // ---------------------------------------------------------------------
    const hideLoginLink = false;

    function buildConnectForm() {
        if (NODES.length > 1) {
            const $select = $('<select>', { id: 'localnode' });
            NODES.forEach((node) => {
                let info = 'Node not in database';
                if (ASTDB[node]) {
                    info = ASTDB[node][1] + ' ' + ASTDB[node][2] + ' ' + ASTDB[node][3];
                }
                $('<option>', { value: node, text: `${node} – ${info}` }).appendTo($select);
            });
            $('#connect_form').append($select).show();
        } else if (NODES.length === 1) {
            $('<input>', { type: 'hidden', id: 'localnode', value: NODES[0] }).appendTo('#connect_form');
            $('#connect_form').show();
        }
    }

    // ---------------------------------------------------------------------
    // Original inline script 1 (dialog & login handling)
    // ---------------------------------------------------------------------
    $(document).ready(function () {
        // Hide login link on page load?
        if (hideLoginLink || SESSION_LOGGED_IN) {
            $('#loginlink').hide();
        }

        // Build the connection form UI
        buildConnectForm();

        // Login dialog setup
        const $loginDialog = $('#login').dialog({
            autoOpen: false,
            title: 'Manager Login',
            modal: true,
            open: function () {
                $(this).find('[type=submit]').hide();
            },
            buttons: [
                {
                    text: 'OK',
                    type: 'submit',
                    form: 'login',
                    click: function () {
                        const user = $('form input:text').val();
                        const passwd = $('input:password').val();
                        $(this).dialog('close');
                        $('#test_area').load('login.php', { user, passwd }, function (response) {
                            if (response.substr(0, 5) !== 'Sorry') {
                                $('#connect_form').show();
                            } else {
                                alert(response);
                            }
                        });
                    }
                }
            ]
        });

        $('#loginlink').on('click', function (e) {
            e.preventDefault();
            $loginDialog.dialog('open');
        });

        // -----------------------------------------------------------------
        // Original inline script 2 (helper functions, polling, etc.)
        // -----------------------------------------------------------------

        function formatTimeSpan(timeSpan) {
            const arrTime = timeSpan.split(':');
            if (arrTime.length !== 3) return timeSpan;
            const [hours, minutes, seconds] = arrTime.map(Number);
            let output = '';
            if (hours) output += `${hours}h `;
            if (minutes) output += `${minutes}m `;
            output += `${seconds}s`;
            return output;
        }

        // Polling example (replace URL with real endpoint)
        function pollStatus() {
            $.getJSON('/allmon2/server.php', { nodes: NODES.join(',') }, function (data) {
                // Update the UI table with data.rows
                // TODO: implement rendering logic
            }).always(function () {
                setTimeout(pollStatus, 5000);
            });
        }

        pollStatus();
    });
})();
