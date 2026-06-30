var howOftenToUpdateNodes = 	70; // seconds
var howOftenToUpdateWeather = 60; // seconds

var mapCenter = [34.7, -92.5]; // Default to Arkansas

// ____________________________________________________________________________________________________________

var markerNamePrefix = "m";
var tableRowNamePrefix = "t";

var iconHeight = 30;
var iconWidth = 30;

var mapZoomLevel = 7;
if (screen.height == "480") {
	mapZoomLevel = 5;
}

const mapObjects = {
    markers: new Map(),
    lines: new Map()
};

$(function () {
	loadAllstarConnections();
	//loadWeatherAlerts();
	$("#divLoadingContainer").hide();
});

function loadWeatherAlerts() {
	var geoJsonUrl = "https://api.weather.gov/alerts/active?status=actual&message_type=alert,update&area=MO,TN,MS,LA,TX,OK,AR&urgency=Immediate&severity=Extreme,Severe";
	$.getJSON(geoJsonUrl, function (geojsonData) {
		L.geoJSON(geojsonData, {
			onEachFeature: function (feature, layer) {
				if (feature.properties && feature.properties.headline) {
					layer.bindPopup(feature.properties.headline);
				}
			},
			style: function(feature) {
				switch (feature.properties.event) {
					case 'Tsunami Warning': return {color: "#FD6347"};
					case 'Tornado Warning': return {color: "#FF0000"};
					case 'Extreme Wind Warning': return {color: "#FF8C00"};
					case 'Severe Thunderstorm Warning': return {color: "#FFA500"};
					case 'Flash Flood Warning': return {color: "#8B0000"};
					case 'Flash Flood Statement': return {color: "#8B0000"};
					case 'Severe Weather Statement': return {color: "#00FFFF"};
					case 'Shelter In Place Warning': return {color: "#FA8072"};
					case 'Evacuation Immediate': return {color: "#7FFF00"};
					case 'Civil Danger Warning': return {color: "#FFB6C1"};
					case 'Nuclear Power Plant Warning': return {color: "#4B0082"};
					case 'Radiological Hazard Warning': return {color: "#4B0082"};
					case 'Hazardous Materials Warning': return {color: "#4B0082"};
					case 'Fire Warning': return {color: "#A0522D"};
					case 'Civil Emergency Message': return {color: "#FFB6C1"};
					case 'Law Enforcement Warning': return {color: "#C0C0C0"};
					case 'Storm Surge Warning': return {color: "#B524F7"};
					case 'Hurricane Force Wind Warning': return {color: "#CD5C5C"};
					case 'Hurricane Warning': return {color: "#DC143C"};
					case 'Typhoon Warning': return {color: "#DC143C"};
					case 'Special Marine Warning': return {color: "#FFA500"};
					case 'Blizzard Warning': return {color: "#FF4500"};
					case 'Snow Squall Warning': return {color: "#C71585"};
					case 'Ice Storm Warning': return {color: "#8B008B"};
					case 'Heavy Freezing Spray Warning': return {color: "#00BFFF"};
					case 'Winter Storm Warning': return {color: "#FF69B4"};
					case 'Lake Effect Snow Warning': return {color: "#008B8B"};
					case 'Dust Storm Warning': return {color: "#FFE4C4"};
					case 'Blowing Dust Warning': return {color: "#FFE4C4"};
					case 'High Wind Warning': return {color: "#DAA520"};
					case 'Tropical Storm Warning': return {color: "#B22222"};
					case 'Storm Warning': return {color: "#9400D3"};
					case 'Tsunami Advisory': return {color: "#D2691E"};
					case 'Tsunami Watch': return {color: "#FF00FF"};
					case 'Avalanche Warning': return {color: "#1E90FF"};
					case 'Earthquake Warning': return {color: "#8B4513"};
					case 'Volcano Warning': return {color: "#2F4F4F"};
					case 'Ashfall Warning': return {color: "#A9A9A9"};
					case 'Flood Warning': return {color: "#00FF00"};
					case 'Coastal Flood Warning': return {color: "#228B22"};
					case 'Lakeshore Flood Warning': return {color: "#228B22"};
					case 'Ashfall Advisory': return {color: "#696969"};
					case 'High Surf Warning': return {color: "#228B22"};
					case 'Extreme Heat Warning': return {color: "#C71585"};
					case 'Tornado Watch': return {color: "#FFFF00"};
					case 'Severe Thunderstorm Watch': return {color: "#DB7093"};
					case 'Flash Flood Watch': return {color: "#2E8B57"};
					case 'Gale Warning': return {color: "#DDA0DD"};
					case 'Flood Statement': return {color: "#00FF00"};
					case 'Extreme Cold Warning': return {color: "#0000FF"};
					case 'Freeze Warning': return {color: "#483D8B"};
					case 'Red Flag Warning': return {color: "#FF1493"};
					case 'Storm Surge Watch': return {color: "#DB7FF7"};
					case 'Hurricane Watch': return {color: "#FF00FF"};
					case 'Hurricane Force Wind Watch': return {color: "#9932CC"};
					case 'Typhoon Watch': return {color: "#FF00FF"};
					case 'Tropical Storm Watch': return {color: "#F08080"};
					case 'Storm Watch': return {color: "#FFE4B5"};
					case 'Tropical Cyclone Local Statement': return {color: "#FFE4B5"};
					case 'Winter Weather Advisory': return {color: "#7B68EE"};
					case 'Avalanche Advisory': return {color: "#CD853F"};
					case 'Cold Weather Advisory': return {color: "#AFEEEE"};
					case 'Heat Advisory': return {color: "#FF7F50"};
					case 'Flood Advisory': return {color: "#00FF7F"};
					case 'Coastal Flood Advisory': return {color: "#7CFC00"};
					case 'Lakeshore Flood Advisory': return {color: "#7CFC00"};
					case 'High Surf Advisory': return {color: "#BA55D3"};
					case 'Dense Fog Advisory': return {color: "#708090"};
					case 'Dense Smoke Advisory': return {color: "#F0E68C"};
					case 'Small Craft Advisory': return {color: "#D8BFD8"};
					case 'Brisk Wind Advisory': return {color: "#D8BFD8"};
					case 'Hazardous Seas Warning': return {color: "#D8BFD8"};
					case 'Dust Advisory': return {color: "#BDB76B"};
					case 'Blowing Dust Advisory': return {color: "#BDB76B"};
					case 'Lake Wind Advisory': return {color: "#D2B48C"};
					case 'Wind Advisory': return {color: "#D2B48C"};
					case 'Frost Advisory': return {color: "#6495ED"};
					case 'Freezing Fog Advisory': return {color: "#008080"};
					case 'Freezing Spray Advisory': return {color: "#00BFFF"};
					case 'Low Water Advisory': return {color: "#A52A2A"};
					case 'Local Area Emergency': return {color: "#C0C0C0"};
					case 'Winter Storm Watch': return {color: "#4682B4"};
					case 'Rip Current Statement': return {color: "#40E0D0"};
					case 'Beach Hazards Statement': return {color: "#40E0D0"};
					case 'Gale Watch': return {color: "#FFC0CB"};
					case 'Avalanche Watch': return {color: "#F4A460"};
					case 'Hazardous Seas Watch': return {color: "#483D8B"};
					case 'Heavy Freezing Spray Watch': return {color: "#BC8F8F"};
					case 'Flood Watch': return {color: "#2E8B57"};
					case 'Coastal Flood Watch': return {color: "#66CDAA"};
					case 'Lakeshore Flood Watch': return {color: "#66CDAA"};
					case 'High Wind Watch': return {color: "#B8860B"};
					case 'Extreme Heat Watch': return {color: "#800000"};
					case 'Extreme Cold Watch': return {color: "#5F9EA0"};
					case 'Freeze Watch': return {color: "#00FFFF"};
					case 'Fire Weather Watch': return {color: "#FFDEAD"};
					case 'Extreme Fire Danger': return {color: "#E9967A"};
					case '911 Telephone Outage': return {color: "#C0C0C0"};
					case 'Coastal Flood Statement': return {color: "#6B8E23"};
					case 'Lakeshore Flood Statement': return {color: "#6B8E23"};
					case 'Special Weather Statement': return {color: "#FFE4B5"};
					case 'Marine Weather Statement': return {color: "#FFDAB9"};
					case 'Air Quality Alert': return {color: "#808080"};
					case 'Air Stagnation Advisory': return {color: "#808080"};
					case 'Hazardous Weather Outlook': return {color: "#EEE8AA"};
					case 'Hydrologic Outlook': return {color: "#90EE90"};
					case 'Short Term Forecast': return {color: "#98FB98"};
					case 'Administrative Message': return {color: "#C0C0C0"};
					case 'Test': return {color: "#F0FFFF"};
					case 'Child Abduction Emergency': return {color: "#FFFFFF"};
					case 'Blue Alert': return {color: "#FFFFFF"};
					default: return {};
				}
			}
		}).addTo(map);	

		// Set up periodic updates
		setTimeout(function () {
			loadAllstarConnections();
		}, howOftenToUpdateWeather * 1000); // Convert seconds to milliseconds for setTimeout
	});
}

function loadAllstarConnections() {
	var geoJsonUrl = "https://hub.aa5jc.com/allmon3/netmap.php?format=geojson";
	$.getJSON(geoJsonUrl, function (geojsonData) {
		$("#tbodyConnections").empty();

		L.geoJSON(geojsonData, {
			pointToLayer: addMarker,
			onEachFeature: function (feature, layer) {
				layer.bindPopup("<b>Node " + feature.properties.node + "</b><br>" + feature.properties.description);
			},
			style: function(feature) {
				if (feature.properties && feature.properties.type){
					// Customize the style based on the feature type
				}
			}
		}).addTo(map);	

		// Set up periodic updates
		setTimeout(function () {
			loadAllstarConnections();
		}, howOftenToUpdateNodes * 1000); // Convert seconds to milliseconds for setTimeout
	});
}

function removeMarker(nodeNumber) {
	const markerName = markerNamePrefix + nodeNumber;
	const marker = mapObjects.markers.get(markerName);

	if (marker) {
		if (marker instanceof L.Marker) {
			markerCluster.removeLayer(marker);
		}

		mapObjects.markers.delete(markerName);
	}
}

function addMarker(feature, latlng) {
	// Only add markers for nodes with valid coordinates and node numbers greater than or equal to 2000
	if (!feature || !feature.properties || !feature.properties.lat || !feature.properties.lon) {
		return;
	}

	const markerName = markerNamePrefix + feature.properties.node;
	
	if (!mapObjects.markers.get(markerName)) {
		var NewMarkerIcon = { icon: iconReceiving };
		var popupContent = "<b>Node " + feature.properties.node + "</b><br>" + feature.properties.desc;

		if (feature.properties.type == "asl") {
			popupContent = "<b>AllStarLink " + feature.properties.node + "</b><br>" + feature.properties.desc;
		}
		else if (feature.properties.type == "echolink") {
			NewMarkerIcon = { icon: iconComputer };
			popupContent = "<b>EchoLink " + feature.properties.node + "</b><br>" + feature.properties.desc;
		}

		const marker = L.marker([feature.properties.lat, feature.properties.lon], NewMarkerIcon).bindPopup(popupContent);
		markerCluster.addLayer(marker);
		
		mapObjects.markers.set(markerName, marker);
	}
}

function newTableRow(featureProperties) {
	return "<tr id='" + tableRowNamePrefix + featureProperties.node + "'>"
	+ "  <td><a href='https://stats.allstarlink.org/stats/" + featureProperties.node + "' target='_blank'>" + featureProperties.node + "</a></td>"
	+ "  <td><a href='https://www.qrz.com/db/" + featureProperties.callsign + "' target='_blank'>" + featureProperties.callsign + "</a></td>"
	+ "  <td>" + featureProperties.desc + "</td>"
	+ "</tr>"
}

// _____ Leaflet Map Functions ____________________________________________________________________________________________________________

// Initialize the map
var map = L.map("map", { maxZoom: 18 }).setView(mapCenter, mapZoomLevel);

// Initialize the marker cluster group
// This facilitates clustering of markers on the map for better visualization and performance.
var markerCluster = L.markerClusterGroup({
	spiderfyOnMaxZoom: true,
	showCoverageOnHover: false,
	zoomToBoundsOnClick: true,
	animate: true,
	animateAddingMarkers: true,
	maxClusterRadius: 15,
	iconCreateFunction: function (cluster) {
		return L.divIcon({ html: cluster.getChildCount(), className: 'icon-receiving', iconSize: L.point(iconWidth, iconHeight) });
	}
});
map.addLayer(markerCluster);

L.maplibreGL({
	style: 'https://tiles.openfreemap.org/styles/dark',
	attribution: 'Powered by <a href="https://github.com/JoshuaCarroll/allmon3-netmap">NetMap</a> | <a href="https://openfreemap.org/">OpenFreeMap</a> | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var iconDisconnectedNode = L.divIcon({
	className: 'icon-antenna',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

var iconTower = L.divIcon({
	className: 'icon-receiving',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

var iconComputer = L.divIcon({
	className: 'icon-computer',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});