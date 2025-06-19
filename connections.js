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

var dataCache = {};

$(function () {
	//setInterval(function () {
	loadData();
	//}, 2000);
});

function loadData() {
    console.log("Loading data...");
	$.getJSON("https://local.aa5jc.com/api/asl", function (nodes) {

		AddOrUpdateNodes(nodes);

  //      console.log("Clear old markers that are no longer in the data"); 
		//for (const key in dataCache) {
		//	if (!nodes.hasOwnProperty(key)) {
		//		const marker = window["m" + dataCache[key].name];
		//		if (marker instanceof L.Marker) {
		//			map.removeLayer(marker);
		//			delete window[markerName];
		//		}
		//	}
		//}

		// Remove polylines that are no longer needed

        // Draw lines between nodes

        // Update the cache with the latest data
		dataCache = nodes;
	});
}

function AddOrUpdateNodes(nodes) {
	for (const key in nodes) {
		AddOrUpdateNode(nodes[key]);
	}
}

function AddOrUpdateNode(node) {
	const nodeId = node.name;
	const markerName = "m" + nodeId;

	const latValid = node.server.latitude != null && node.server.latitude != 0;
	const lonValid = node.server.longitude != null && node.server.longitude != 0;

	// If it's a private node, skip it
    if (nodeId < 2000) {
        return;
    }

	if (latValid && lonValid) {
		window[markerName] = newMarker(nodeId, node.server.location, node.server.latitude, node.server.longitude);
	}

	$("#tbodyConnections").append(
		"<tr id='t" + nodeId + "'><td>" + nodeId + "</td><td>" + node.user_ID + " - " + node.server.location + "</td><td>" + "LINKED" + "</td><td>" + "∞" + "</td></tr>"
	);

	// Select icon
	if (node.data.keyed) {
		window[markerName].setIcon(iconTransmitting);
	} else {
		window[markerName].setIcon(iconReceiving);
	}
}

function newMarker(node, city, lat, lon) {
	return L.marker([lat, lon], { icon: iconDisconnectedNode }).addTo(map).bindPopup(city + "<br>" + "node " + node);;
}

function drawLineBetweenPoints(pointA, pointB, options = {}) {
	// Ensure pointA and pointB are arrays in [lat, lng] format
	const latlngs = [pointA, pointB];

	// Draw the line with optional styling
	const line = L.polyline(latlngs, {
		color: options.color || 'white',
		weight: options.weight || 3,
		opacity: options.opacity || 0.7,
		dashArray: options.dashArray || null
	});

	line.addTo(map);
	return line; // Return the line if you want to manipulate it later
}