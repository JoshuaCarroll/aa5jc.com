var iconHeight = 30;
var iconWidth = 30;

var dataCache = {};

var zoomLevel = 6;
if (screen.height == "480") {
	zoomLevel = 5;
}

var map = L.map("map").setView([34.7, -92.5], zoomLevel);

var tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var iconDisconnectedNode = L.divIcon({
	className: 'icon-antenna',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

var iconReceiving = L.divIcon({
	className: 'icon-receiving',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

var iconTransmitting = L.divIcon({
	className: 'icon-transmitting',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

function newMarker(node, city, lat, lon) {
	return L.marker([lat, lon], {icon: iconDisconnectedNode}).addTo(map).bindPopup(city + "<br>" + "node " + node);;
}

function AddOrUpdateNode(node) {
	// Build list of currently cached node IDs
	for (const cachedNode in dataCache) {
		existingNodes.add(cachedNode);
	}

	const nodeId = node.name;
	const markerName = "m" + nodeId;

	const latValid = node.server.latitude != null && node.server.latitude != 0;
	const lonValid = node.server.longitude != null && node.server.longitude != 0;

	// If it's a private node, skip it
    if (nodeId < 2000) {
        return;
    }

	// If it's a new node, add it to the map and table
	if (!dataCache[nodeId]) {
		if (latValid && lonValid) {
			window[markerName] = newMarker(nodeId, node.server.location, node.server.latitude, node.server.longitude);
		}

		$("#tbodyConnections").append(
			"<tr id='t" + nodeId + "'><td>" + nodeId + "</td><td>" + node.user_ID + " - " + node.server.location + "</td><td>" + "LINKED" + "</td><td>" + "∞" + "</td></tr>"
		);
	}
	else {
		// Update marker popup (optional)
		if (latValid && lonValid) {
			try {
				window[markerName].setPopupContent("Node " + nodeId + " - " + node.User_ID + "<br>" + node.server.location);
			} catch { }
		}

		// Update table row content
		const $row = $("#t" + nodeId + " td");
		$row.eq(1).text(node.User_ID + " - " + node.server.location);
		$row.eq(2).text("LINKED");
		$row.eq(3).text("∞");
	}

	// Update icon
	window[markerName].setIcon(iconReceiving); 

	// Update cache
	dataCache[nodeId] = node;
}



var dataCache = null;
function loadData() {
	$.getJSON("https://local.aa5jc.com/api/asl?node=65017", function (data) {
        loadConnections(data);
    });
}


$(function () {
	setInterval(function () {
		loadData();
	}, 2000);
});