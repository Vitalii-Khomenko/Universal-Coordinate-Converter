function pot2wgs(lng, lat) {
    var dx = 598.1, dy = 73.7, dz = 418.2;
    var rx = 0.202 / 3600 * Math.PI / 180;
    var ry = 0.045 / 3600 * Math.PI / 180;
    var rz = -2.455 / 3600 * Math.PI / 180;
    var m = 6.7 / 1e6;
    var a = 6377397.15508;
    var f = 3.34277321e-3;
    var e2 = 2*f - f*f;
    var latRad = lat * Math.PI / 180;
    var lngRad = lng * Math.PI / 180;
    var N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
    var X = N * Math.cos(latRad) * Math.cos(lngRad);
    var Y = N * Math.cos(latRad) * Math.sin(lngRad);
    var Z = N * (1 - e2) * Math.sin(latRad);
    var X2 = X + dx + m*X - rz*Y + ry*Z;
    var Y2 = Y + dy + rz*X + m*Y - rx*Z;
    var Z2 = Z + dz - ry*X + rx*Y + m*Z;
    var a2 = 6378137.0;
    var f2 = 1 / 298.257223563;
    var e22 = 2*f2 - f2*f2;
    var p = Math.sqrt(X2*X2 + Y2*Y2);
    var lat2 = Math.atan2(Z2, p * (1 - e22));
    var lat2old;
    do {
        lat2old = lat2;
        var N2 = a2 / Math.sqrt(1 - e22 * Math.sin(lat2old) * Math.sin(lat2old));
        lat2 = Math.atan2(Z2 + e22*N2*Math.sin(lat2old), p);
    } while (Math.abs(lat2 - lat2old) > 1e-11);
    var lng2 = Math.atan2(Y2, X2);
    return { lat: lat2 * 180/Math.PI, lng: lng2 * 180/Math.PI };
}

function gk2geo(rw, hw) {
    var ll = {};
    if (rw == "" || hw == "" || isNaN(rw) || isNaN(hw)) return ll;
    rw = parseFloat(rw);
    hw = parseFloat(hw);
    var a = 6377397.15508;
    var f = 3.34277321e-3;
    var pi = Math.PI;
    var c = a/(1-f);
    var ex2 = (2*f-f*f)/((1-f)*(1-f));
    var ex4 = ex2*ex2;
    var ex6 = ex4*ex2;
    var ex8 = ex4*ex4;
    var e0 = c*(pi/180)*(1 - 3*ex2/4 + 45*ex4/64 - 175*ex6/256 + 11025*ex8/16384);
    var f2 =   (180/pi)*(    3*ex2/8 - 3*ex4/16  + 213*ex6/2048 -  255*ex8/4096);
    var f4 =              (180/pi)*(  21*ex4/256 -  21*ex6/256  +  533*ex8/8192);
    var f6 =                           (180/pi)*(  151*ex6/6144 -  453*ex8/12288);
    var sigma = hw/e0;
    var sigmr = sigma*pi/180;
    var bf = sigma + f2*Math.sin(2*sigmr) + f4*Math.sin(4*sigmr) + f6*Math.sin(6*sigmr);
    var br = bf * pi/180;
    var tan1 = Math.tan(br);
    var tan2 = tan1*tan1;
    var tan4 = tan2*tan2;
    var cos1 = Math.cos(br);
    var cos2 = cos1*cos1;
    var etasq = ex2*cos2;
    var nd = c/Math.sqrt(1 + etasq);
    var nd2 = nd*nd;
    var nd4 = nd2*nd2;
    var nd6 = nd4*nd2;
    var nd3 = nd2*nd;
    var nd5 = nd4*nd;
    var kz = parseInt(rw/1e6);
    var lh = kz*3;
    var dy = rw-(kz*1e6+500000);
    var dy2 = dy*dy;
    var dy4 = dy2*dy2;
    var dy3 = dy2*dy;
    var dy5 = dy4*dy;
    var dy6 = dy3*dy3;
    var b2 = - tan1*(1+etasq)/(2*nd2);
    var b4 =   tan1*(5+3*tan2+6*etasq*(1-tan2))/(24*nd4);
    var b6 = - tan1*(61+90*tan2+45*tan4)/(720*nd6);
    var l1 =   1/(nd*cos1);
    var l3 = - (1+2*tan2+etasq)/(6*nd3*cos1);
    var l5 =   (5+28*tan2+24*tan4)/(120*nd5*cos1);
    var lat = bf + (180/pi) * (b2*dy2 + b4*dy4 + b6*dy6);
    var lng = lh + (180/pi) * (l1*dy  + l3*dy3 + l5*dy5);
    var llw = pot2wgs(lng, lat);
    return llw;
}

function Dezimal2GK(lp, bp) {
    var gk = {};
    if (lp === "" || bp === "" || isNaN(lp) || isNaN(bp)) return gk;
    lp = parseFloat(lp);
    bp = parseFloat(bp);
    if (bp < 46 || bp > 56 || lp < 5 || lp > 16) {
        return gk;
    }
    var a = 6377397.15508;
    var f = 3.34277321e-3;
    var pi = Math.PI;
    var c = a / (1 - f);
    var ex2 = (2 * f - f * f) / ((1 - f) * (1 - f));
    var ex4 = ex2 * ex2;
    var ex6 = ex4 * ex2;
    var ex8 = ex4 * ex4;
    var e0 = c * (pi / 180) * (1 - 3 * ex2 / 4 + 45 * ex4 / 64 - 175 * ex6 / 256 + 11025 * ex8 / 16384);
    var e2 = c * (-3 * ex2 / 8 + 15 * ex4 / 32 - 525 * ex6 / 1024 + 2205 * ex8 / 4096);
    var e4 = c * (15 * ex4 / 256 - 105 * ex6 / 1024 + 2205 * ex8 / 16384);
    var e6 = c * (-35 * ex6 / 3072 + 315 * ex8 / 12288);
    var br = bp * pi / 180;
    var tan1 = Math.tan(br);
    var tan2 = tan1 * tan1;
    var tan4 = tan2 * tan2;
    var cos1 = Math.cos(br);
    var cos2 = cos1 * cos1;
    var cos4 = cos2 * cos2;
    var cos3 = cos2 * cos1;
    var cos5 = cos4 * cos1;
    var etasq = ex2 * cos2;
    var nd = c / Math.sqrt(1 + etasq);
    var g = e0 * bp + e2 * Math.sin(2 * br) + e4 * Math.sin(4 * br) + e6 * Math.sin(6 * br);
    var kz = parseInt((lp + 1.5) / 3);
    var lh = kz * 3;
    var dl = (lp - lh) * pi / 180;
    var dl2 = dl * dl;
    var dl4 = dl2 * dl2;
    var dl3 = dl2 * dl;
    var dl5 = dl4 * dl;
    var hw = g + nd * cos2 * tan1 * dl2 / 2 + nd * cos4 * tan1 * (5 - tan2 + 9 * etasq) * dl4 / 24;
    var rw = nd * cos1 * dl + nd * cos3 * (1 - tan2 + etasq) * dl3 / 6 + nd * cos5 * (5 - 18 * tan2 + tan4) * dl5 / 120 + kz * 1e6 + 500000;
    gk["h"] = hw.toFixed(3);
    gk["r"] = rw.toFixed(3);
    gk["z"] = rw.toString().charAt(0);
    return gk;
}

function wgs2pot(lp, bp) {
    var ll = [];
    if (lp === "" || bp === "" || isNaN(lp) || isNaN(bp)) return ll;
    lp = parseFloat(lp);
    bp = parseFloat(bp);

    var a = 6378137.000 - 739.845;
    var fq = 3.35281066e-3 - 1.003748e-05;
    var f = 3.35281066e-3;

    var dx = -587;
    var dy = -16;
    var dz = -393;

    var e2q = (2 * fq - fq * fq);
    var e2 = (2 * f - f * f);
    var pi = Math.PI;
    var b1 = bp * (pi / 180);
    var l1 = lp * (pi / 180);
    var nd = a / Math.sqrt(1 - e2 * Math.sin(b1) * Math.sin(b1));

    var x = nd * Math.cos(b1) * Math.cos(l1);
    var y = nd * Math.cos(b1) * Math.sin(l1);
    var z = (1 - e2) * nd * Math.sin(b1);

    var xp = x + dx;
    var yp = y + dy;
    var zp = z + dz;

    var rb = Math.sqrt(xp * xp + yp * yp);
    var b2 = (180 / pi) * Math.atan((zp / rb) / (1 - e2q));
    var l2 = 0;
    if (xp > 0)
        l2 = (180 / pi) * Math.atan(yp / xp);
    if (xp < 0 && yp > 0)
        l2 = (180 / pi) * Math.atan(yp / xp) + 180;
    if (xp < 0 && yp < 0)
        l2 = (180 / pi) * Math.atan(yp / xp) - 180;

    ll["lng"] = parseFloat(l2.toFixed(8));
    ll["lat"] = parseFloat(b2.toFixed(8));
    return ll;
}

// Mathematical helper functions for older browser compatibility
Math.cosh = Math.cosh || function(x) {
    return (Math.exp(x) + Math.exp(-x)) / 2;
};

Math.sinh = Math.sinh || function(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2;
};

Math.tanh = Math.tanh || function(x) {
    var exp2x = Math.exp(2 * x);
    return (exp2x - 1) / (exp2x + 1);
};

Math.asinh = Math.asinh || function(x) {
    return Math.log(x + Math.sqrt(x * x + 1));
};

Math.atanh = Math.atanh || function(x) {
    return 0.5 * Math.log((1 + x) / (1 - x));
};

function sweref99ToWGS84(easting, northing) {
    // SWEREF99 18 00 parameters (EPSG:3011)
    var a = 6378137.0;              // Semi-major axis (GRS80)
    var f = 1 / 298.257222101;      // Flattening (GRS80)
    var lat0 = 0.0;                 // Latitude of natural origin (degrees)
    var lon0 = 18.0;                // Longitude of natural origin (degrees)
    var k0 = 1.0;                   // Scale factor at natural origin
    var x0 = 150000.0;              // False easting (meters)
    var y0 = 0.0;                   // False northing (meters)

    // Convert to radians
    var DEG_TO_RAD = Math.PI / 180.0;
    var RAD_TO_DEG = 180.0 / Math.PI;

    lat0 *= DEG_TO_RAD;
    lon0 *= DEG_TO_RAD;

    // Derived constants
    var b = a * (1 - f);           // Semi-minor axis
    var e2 = 2 * f - f * f;        // First eccentricity squared
    var e = Math.sqrt(e2);         // First eccentricity
    var e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

    // Remove false easting and northing
    var x = easting - x0;
    var y = northing - y0;

    // Calculate meridional arc
    var M0 = 0; // M0 = 0 since lat0 = 0
    var M = M0 + y / k0;

    // Calculate footprint latitude
    var mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));

    var e1_2 = e1 * e1;
    var e1_3 = e1_2 * e1;
    var e1_4 = e1_3 * e1;

    var fp = mu + (3*e1/2 - 27*e1_3/32) * Math.sin(2*mu) 
               + (21*e1_2/16 - 55*e1_4/32) * Math.sin(4*mu)
               + (151*e1_3/96) * Math.sin(6*mu)
               + (1097*e1_4/512) * Math.sin(8*mu);

    // Calculate radius of curvature
    var sin_fp = Math.sin(fp);
    var cos_fp = Math.cos(fp);
    var tan_fp = Math.tan(fp);
    var tan2_fp = tan_fp * tan_fp;
    var tan4_fp = tan2_fp * tan2_fp;

    var n1 = a / Math.sqrt(1 - e2 * sin_fp * sin_fp);
    var r1 = a * (1 - e2) / Math.pow(1 - e2 * sin_fp * sin_fp, 1.5);
    var d = x / (n1 * k0);
    var d2 = d * d;
    var d3 = d2 * d;
    var d4 = d3 * d;
    var d5 = d4 * d;
    var d6 = d5 * d;

    var c1 = e2 * cos_fp * cos_fp / (1 - e2);
    var c1_2 = c1 * c1;

    // Calculate latitude
    var lat = fp - (n1 * tan_fp / r1) * (d2/2 - (5 + 3*tan2_fp + 10*c1 - 4*c1_2 - 9*e2*cos_fp*cos_fp) * d4/24
              + (61 + 90*tan2_fp + 298*c1 + 45*tan4_fp - 252*e2*cos_fp*cos_fp - 3*c1_2) * d6/720);

    // Calculate longitude
    var lon = lon0 + (d - (1 + 2*tan2_fp + c1) * d3/6 
                   + (5 - 2*c1 + 28*tan2_fp - 3*c1_2 + 8*e2*cos_fp*cos_fp + 24*tan4_fp) * d5/120) / cos_fp;

    // Convert to degrees
    return {
        lat: lat * RAD_TO_DEG,
        lng: lon * RAD_TO_DEG
    };
}

function wgs84ToSweref99(lat, lng) {
    // SWEREF99 18 00 parameters (EPSG:3011)
    var a = 6378137.0;              // Semi-major axis (GRS80)
    var f = 1 / 298.257222101;      // Flattening (GRS80)
    var lat0 = 0.0;                 // Latitude of natural origin (degrees)
    var lon0 = 18.0;                // Longitude of natural origin (degrees)
    var k0 = 1.0;                   // Scale factor at natural origin
    var x0 = 150000.0;              // False easting (meters)
    var y0 = 0.0;                   // False northing (meters)

    // Convert to radians
    var DEG_TO_RAD = Math.PI / 180.0;

    lat *= DEG_TO_RAD;
    lng *= DEG_TO_RAD;
    lat0 *= DEG_TO_RAD;
    lon0 *= DEG_TO_RAD;

    // Derived constants
    var b = a * (1 - f);           // Semi-minor axis
    var e2 = 2 * f - f * f;        // First eccentricity squared
    var e = Math.sqrt(e2);         // First eccentricity

    // Calculate radius of curvature in the prime vertical
    var sin_lat = Math.sin(lat);
    var cos_lat = Math.cos(lat);
    var tan_lat = Math.tan(lat);
    var tan2_lat = tan_lat * tan_lat;
    var tan4_lat = tan2_lat * tan2_lat;

    var n = a / Math.sqrt(1 - e2 * sin_lat * sin_lat);
    var c = e2 * cos_lat * cos_lat / (1 - e2);
    var c2 = c * c;
    var a2 = (lng - lon0) * cos_lat;
    var a2_2 = a2 * a2;
    var a2_3 = a2_2 * a2;
    var a2_4 = a2_3 * a2;
    var a2_5 = a2_4 * a2;
    var a2_6 = a2_5 * a2;

    // Calculate meridional arc
    var M0 = 0; // M0 = 0 since lat0 = 0
    var M = a * ((1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256) * lat
               - (3*e2/8 + 3*e2*e2/32 + 45*e2*e2*e2/1024) * Math.sin(2*lat)
               + (15*e2*e2/256 + 45*e2*e2*e2/1024) * Math.sin(4*lat)
               - (35*e2*e2*e2/3072) * Math.sin(6*lat));

    // Calculate coordinates
    var x = k0 * n * (a2 + (1 - tan2_lat + c) * a2_3 / 6
                   + (5 - 18*tan2_lat + tan4_lat + 72*c - 58*e2*cos_lat*cos_lat) * a2_5 / 120);

    var y = k0 * (M - M0 + n * tan_lat * (a2_2/2 + (5 - tan2_lat + 9*c + 4*c2) * a2_4/24
                  + (61 - 58*tan2_lat + tan4_lat + 600*c - 330*e2*cos_lat*cos_lat) * a2_6/720));

    return {
        x: x + x0,
        y: y + y0
    };
}
