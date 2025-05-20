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

function setStatus(node, status) {
	console.log(node, status);
	if (status == "transmitting") {
		try {
			eval("m"+node+".setIcon(iconTransmitting);");
		}
		catch {}
	}
	else if (status == "connected") {
		try {
			eval("m"+node+".setIcon(iconReceiving);");
		}
		catch {}
	}
}

function loadConnections(nodes) {
	for (var x = 0; x < nodes.length; x++) {
		if (nodes[x].latitude != null && nodes[x].latitude != 0 && nodes[x].longitude != null && nodes[x].longitude != 0)
		newMarker(nodes[x].node, nodes[x].location, nodes[x].latitude, nodes[x].longitude);
	}
}

$.getJSON( "https://local.aa5jc.com/api/", function( data ) {
	loadConnections(data);
});