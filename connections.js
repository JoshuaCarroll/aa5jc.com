var iconHeight = 30;
var iconWidth = 30;

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
	iconAnchor: [iconWidth/2,iconHeight]
});

var iconReceiving = L.divIcon({
	className: 'icon-receiving',
	iconAnchor: [iconWidth/2,iconHeight]
});

var iconTransmitting = L.divIcon({
	className: 'icon-transmitting',
	iconAnchor: [iconWidth/2,iconHeight]
});

function newMarker(node, city, lat, lon) {
	return L.marker([lat, lon], {icon: iconDisconnectedNode}).addTo(map).bindPopup(city + "<br>" + "node " + node);;
}

function loadConnections(nodes) {
	const newData = {};
	const currentNodes = new Set();
	const existingNodes = new Set();

	// Build a quick lookup from incoming data
	for (const node of nodes) {
		newData[node.node] = node;
		currentNodes.add(node.node);
	}

	// If this is the first time, initialize dataCache
	if (!dataCache) {
		dataCache = {};
	}

	// Build list of currently cached node IDs
	for (const cachedNode in dataCache) {
		existingNodes.add(cachedNode);
	}

	// 1. Remove nodes no longer present
	for (const cachedNode of existingNodes) {
		if (!currentNodes.has(cachedNode)) {
			// Remove map marker
			try {
				map.removeLayer(window["m" + cachedNode]);
			} catch { }

			// Remove table row
			$("#t" + cachedNode).remove();

			// Delete from cache
			delete dataCache[cachedNode];
		}
	}

	// 2. Add or update each node
	for (const node of nodes) {
		const id = node.node;
		const markerVar = "m" + id;

		const latValid = node.latitude != null && node.latitude != 0;
		const lonValid = node.longitude != null && node.longitude != 0;

		// If it's a private node, skip it
        if (id < 2000) {
            continue;
        }

		// If it's a new node, add it to the map and table
		if (!dataCache[id]) {
			if (latValid && lonValid) {
				window[markerVar] = newMarker(id, node.location, node.latitude, node.longitude);
			}

			$("#tbodyConnections").append(
				"<tr id='t" + id + "'><td>" + id + "</td><td>" + node.callSign + " - " + node.location + "</td><td>" + (node.timeSpanConnected ?? "∞") + "</td><td>" + (node.timeSinceTransmit ?? "∞") + "</td></tr>"
			);
		}
		else {
			// Update marker popup (optional)
			if (latValid && lonValid) {
				try {
					window[markerVar].setPopupContent("Node " + id + " - " + node.callSign + "<br>" + node.location);
				} catch { }
			}

			// Update table row content
			const $row = $("#t" + id + " td");
			$row.eq(1).text(node.callSign + " - " + node.location);
			$row.eq(2).text(node.timeSpanConnected ?? "∞");
			$row.eq(3).text(node.timeSinceTransmit ?? "∞");
		}

		// Update icon
		if (window[markerVar]) {
			window[markerVar].setIcon(node.transmitting ? iconTransmitting : iconReceiving);
		}

		// Update cache
		dataCache[id] = node;
	}
}



var dataCache = null;
function loadData() {
    $.getJSON("https://local.aa5jc.com/api/", function (data) {
        loadConnections(data);
    });
}


$(function () {
	setInterval(function () {
		loadData();
	}, 2000);
});