function SolarAzEl(UTC,Lat,Lon,Alt) {
  // Revision History:
  // Translated into Javascript by Norton Allen 1/2/2014
  // Programed by Darin C. Koblick 2/17/2009
  //
  //              Darin C. Koblick 4/16/2013 Vectorized for Speed
  //                                         Allow for MATLAB Datevec input in
  //                                         addition to a UTC string.
  //                                         Cleaned up comments and code to
  //                                         avoid warnings in MATLAB editor.
  //
  //--------------------------------------------------------------------------
  // External Function Call Sequence:
  //[Az El] = SolarAzEl('1991/05/19 13:00:00',50,10,0)
  // Function Description:
  // SolarAzEl will ingest a Universal Time, and specific site location on earth
  // it will then output the solar Azimuth and Elevation angles relative to that
  // site.
  //
  // Input Description:
  // UTC:                  [N x 1]          MATLAB Date Number (Days since 1/1/0000)
  //
  // Lat:                  [N x 1]         (Site Latitude in degrees 
  //                                       -90:90 -> S(-) N(+))
  //
  // Lon:                  [N x 1]         (Site Longitude in degrees 
  //                                        -180:180 W(-) E(+))
  //
  // Alt:                  [N x 1]         Altitude of the site above sea 
  //                                       level (km)
  //
  // Output Description:
  //Az                     [N x 1]         Azimuth location of the sun (deg)
  //El                     [N x 1]         Elevation location of the sun (deg)
  //
  //
  // Source References:
  //  Solar Position obtained from:
  //  http://stjarnhimlen.se/comp/tutorial.html#5
  // Begin Code Sequence

  // compute JD from UTC or datevec
  var jd = juliandate(UTC);
  var d = jd-2451543.5;

  // Keplerian Elements for the Sun (geocentric)
  var w = 282.9404 + 4.70935e-5*d; //    (longitude of perihelion degrees)
  // a = 1.000000; //                  (mean distance, a.u.)
  var e = 0.016709 - 1.151e-9*d; //     (eccentricity)
  var M = (356.0470 + 0.9856002585*d) % 360; //   (mean anomaly degrees)
  var L = w + M;                     // (Sun's mean longitude degrees)
  var oblecl = 23.4393 - 3.563e-7*d;  // (Sun's obliquity of the ecliptic)

  // auxiliary angle
  var E = M + (180/Math.PI) * e*Math.sin(M*(Math.PI/180)) *
          (1+e*Math.cos(M*(Math.PI/180)));

  // rectangular coordinates in the plane of the ecliptic (x axis toward
  // perhilion)
  var x = Math.cos(E*(Math.PI/180))-e;
  var y = Math.sin(E*(Math.PI/180))*Math.sqrt(1-e*e);

  // find the distance and true anomaly
  var r = Math.sqrt(x*x + y*y);
  var v = Math.atan2(y,x)*(180/Math.PI);

  // find the longitude of the sun
  var lon = v + w;

  // compute the ecliptic rectangular coordinates
  var xeclip = r * Math.cos(lon*(Math.PI/180));
  var yeclip = r * Math.sin(lon*(Math.PI/180));
  var zeclip = 0.0;

  // rotate these coordinates to equitorial rectangular coordinates
  var xequat = xeclip;
  var yequat = yeclip*Math.cos(oblecl*(Math.PI/180)) +
        zeclip*Math.sin(oblecl*(Math.PI/180));
  var zequat = yeclip*Math.sin(23.4406*(Math.PI/180)) +
        zeclip*Math.cos(oblecl*(Math.PI/180));

  // convert equatorial rectangular coordinates to RA and Decl:
  r = Math.sqrt(xequat*xequat + yequat*yequat + zequat*zequat) -
        (Alt/149598000); // roll up the altitude correction
  var RA = Math.atan2(yequat,xequat)*(180/Math.PI);
  var delta = Math.asin(zequat/r)*(180/Math.PI);

  // Following the RA DEC to Az Alt conversion sequence explained here:
  // http://www.stargazing.net/kepler/altaz.html

  // Find the J2000 value
  // J2000 = jd - 2451545.0;
  // hourvec = datevec(UTC);
  // UTH = hourvec(:,4) + hourvec(:,5)/60 + hourvec(:,6)/3600;
  var UTH = (UTC*24) % 24;

  // Calculate local siderial time
  var GMST0 = ((L+180)%360)/15;
  var SIDTIME = GMST0 + UTH + Lon/15;

  // Replace RA with hour angle HA
  var HA = (SIDTIME*15 - RA);

  // convert to rectangular coordinate system
  x = Math.cos(HA*(Math.PI/180))*Math.cos(delta*(Math.PI/180));
  y = Math.sin(HA*(Math.PI/180))*Math.cos(delta*(Math.PI/180));
  var z = Math.sin(delta*(Math.PI/180));

  // rotate this along an axis going east-west.
  var xhor = x*Math.cos((90-Lat)*(Math.PI/180))-z*Math.sin((90-Lat)*(Math.PI/180));
  var yhor = y;
  var zhor = x*Math.sin((90-Lat)*(Math.PI/180))+z*Math.cos((90-Lat)*(Math.PI/180));

  // Find the h and AZ
  var Az = Math.atan2(yhor,xhor)*(180/Math.PI) + 180;
  var El = Math.asin(zhor)*(180/Math.PI);
  return( { Az: Az, El: El } );
}

function juliandate(UTC) {
  var arm_epoch = 719529; // 1/1/1970
  var minutes = Math.round((UTC - arm_epoch)*24*60);
  var date = new Date(minutes*60e3);
  var year = date.getUTCFullYear();
  var month = date.getUTCMonth()+1;
  var day = date.getUTCDate();
  var hour = date.getUTCHours();
  var min = date.getUTCMinutes();
  var sec = date.getUTCSeconds();
  if (month <= 2) {
    --year;
    month += 12;
  }
  var jd = Math.floor( 365.25*(year + 4716.0)) +
    Math.floor( 30.6001*( month + 1.0)) + 2.0 -
    Math.floor( year/100.0 ) +
    Math.floor( Math.floor( year/100.0 )/4.0 ) +
    day - 1524.5 +
    (hour + min/60 + sec/3600)/24;
  return jd;
}
