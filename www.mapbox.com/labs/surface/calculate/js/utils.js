function haverDistance(p1,p2){
    var R = 41807040;
    var dLat = (Math.PI/180.0)*((p2.lat-p1.lat));
    var dLon = (Math.PI/180.0)*((p2.lng-p1.lng));
    var lat1 = (Math.PI/180.0)*p1.lat,
        lat2 = (Math.PI/180.0)*p2.lat;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d;
}
function roundTo(num) {    
    return +(Math.round(num + "e+8")  + "e-8");
}