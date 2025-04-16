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

var m499600 = newMarker("499600","Little Rock","34.7996003700085", "-92.50015731946019");
var m45921 = newMarker("45921","Mountain View","35.85780435264522","-92.10813056300331");
var m510541 = newMarker("510541","Tontitown","36.188789876414","-94.24906533159587");
var m519080 = newMarker("519080","Royal","34.511017217374814","-93.24102116322892");
var m41705 = newMarker("41705", "Sherwood", "34.840305629296196","-92.22573504061002");
var m508064 = newMarker("508064", "Salem", "36.37067440497465","-91.82594030403487");
var m55447 = newMarker("55447", "Pine Bluff", "34.20905737952694","-92.02576435747902");
var m57970 = newMarker("57970", "Highland", "36.26393495613541","-91.52023683557502");
var m557961 = newMarker("557961", "Conway", "35.10638872624134", "-92.45918479898032");
