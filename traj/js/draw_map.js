var xdim = 600;
var ydim = 420;
var minWindFieldSpacing = 20; // pixels
var normalWindSpeed = 10; // m/s to match latitude grid spacing
var paper;
var background;
var rubber, rubberx, rubbery, rubberdx, rubberdy;

var minLat = 360;
var maxLat = -360;
var minLon = 360;
var maxLon = -360;
var nBorders = Map.length; // Map.length
var XScale, YScale; // pixels per degree

function init_scale_from_map() {
  var i;
  for (i = 0; i < nBorders; ++i) { // Map.length
    var mLon = Map[i].BoundingBox[0];
    var MLon = Map[i].BoundingBox[1];
    var mLat = Map[i].BoundingBox[2];
    var MLat = Map[i].BoundingBox[3];
    if (mLat < minLat) minLat = mLat;
    if (MLat > maxLat) maxLat = MLat;
    if (mLon < minLon) minLon = mLon;
    if (MLon > maxLon) maxLon = MLon;
  }
  init_scale();
}

function init_scale() {
  // alert("minLon: " + minLon + " maxLon: " + maxLon);
  var dLat = (maxLat - minLat);
  var dLon = (maxLon - minLon);
  var meanLat = (minLat+maxLat)/2;
  var meanLon = (minLon+maxLon)/2;
  var cosLat = Math.cos(meanLat * Math.PI / 180.);
  if (dLon * cosLat / xdim > dLat / ydim ) {
    dLat = ydim * dLon * cosLat / xdim;
    minLat = meanLat - dLat/2;
    maxLat = meanLat + dLat/2;
  } else {
    dLon = xdim * dLat / (ydim * cosLat);
    minLon = meanLon - dLon/2;
    maxLon = meanLon + dLon/2;
  }
  $("#minLat").val(minLat.toFixed(4));
  $("#maxLat").val(maxLat.toFixed(4));
  $("#minLon").val(minLon.toFixed(4));
  $("#maxLon").val(maxLon.toFixed(4));
  XScale = xdim/(maxLon - minLon);
  YScale = ydim/(maxLat - minLat);
  // alert("minLat: " + minLat + " maxLat: " + maxLat + " minLon: " + minLon + " maxLon: " + maxLon);
}

function update_scale() {
  var mLon = parseFloat($("#minLon").val());
  var MLon = parseFloat($("#maxLon").val());
  var mLat = parseFloat($("#minLat").val());
  var MLat = parseFloat($("#maxLat").val());
  // alert("mLon: " + mLon + " MLon: " + MLon);
  if (mLon >= MLon) {
    alert("min Lon must be less than max Lon: (" + mLon + " >= " + MLon + ")");
  } else if (mLat >= MLat) {
    alert("min Lat must be less than max Lat");
  } else {
    minLat = mLat;
    maxLat = MLat;
    minLon = mLon;
    maxLon = MLon;
  }
  init_scale();
}

function map_scale(x, y) {
  x = Math.round((x-minLon) * XScale);
  y = Math.round((maxLat - y) * YScale);
  return x + "," + y;
}

function draw_map() {
  var i, j;
  paper.clear();
  background = paper.rect(0, 0, xdim, ydim, 10).attr({fill: "#eee", stroke : "none"});
  for (i = 0; i < nBorders; ++i) {
    // Map[i].BoundingBox = [ mLon MLon mLat MLat ];
    var BB = Map[i].BoundingBox;
    if (BB[0] <= maxLon && BB[1] >= minLon && BB[2] <= maxLat && BB[3] >= minLat) {
      var ps = 'M' + map_scale(Map[i].X[1], Map[i].Y[1]);
      for (j = 1; j < Map[i].X.length; ++j) {
        ps = ps + "L" + map_scale(Map[i].X[j], Map[i].Y[j]);
      }
      // alert(ps);
      paper.path(ps).attr({ fill: "none", stroke: "#fff",
        "stroke-width": 2}).show;
    }
  }
  background.drag( function(dx,dy,x,y,event) { // move handler
    x -= $("#canvas").offset().left;
    y -= $("#canvas").offset().top;
    // $("#mvdx").text(dx.toFixed(0));
    // $("#mvdy").text(dy.toFixed(0));
    // $("#mvx").text(x.toFixed(0));
    // $("#mvy").text(y.toFixed(0));
    var rx = rubberx;
    var ry = rubbery;
    rubberdx = dx;
    rubberdy = dy;
    if (dx < 0) {
      rx = rubberx + dx;
      dx = -dx;
    }
    if (dy < 0) {
      ry = rubbery + dy;
      dy = -dy;
    }
    rubber.attr( { x: rx, y: ry, width: dx, height: dy}).show;
  },
  function(x,y,event) { // start handler
    rubberx = x - $("#canvas").offset().left;
    rubbery = y - $("#canvas").offset().top;
    rubberdx = 0;
    rubberdy = 0;
    rubber = paper.rect(rubberx, rubbery, 1, 1, 0).attr({fill: "none", stroke : "#000" });
    rubber.show;
    // $("#stx").text(x.toFixed(0));
    // $("#sty").text(y.toFixed(0));
  },
  function(event) { // end handler
    rubber.remove();
    delete(rubber);
    if (rubberdx != 0 && rubberdy != 0) {
      if (rubberdx < 0) {
        rubberx += rubberdx;
        rubberdx = -rubberdx;
      }
      if (rubberdy < 0) {
        rubbery += rubberdy;
        rubberdy = -rubberdy;
      }
      var mLon = minLon + rubberx/XScale;
      maxLon = minLon + (rubberx+rubberdx)/XScale;
      minLon = mLon;
      var MLat = maxLat - rubbery/YScale;
      minLat = maxLat - (rubbery+rubberdy)/YScale;
      maxLat = MLat;
      init_scale();
      sequence_init([
        { Status: "Drawing map...", Function: draw_map },
        { Status: "Drawing wind field...", Function: draw_wind_field } ]);
    }
  });
}

// for this, we only need to interpolat in time, since we are only
// using points from the grid.
function draw_wind_field() {
  var LatStep = 1;
  var LonStep = 1;
  var dLat = windData.lats[1] - windData.lats[0];
  if (dLat < 0) dLat = -dLat;
  var Ypixels = dLat * YScale;
  if (Ypixels < minWindFieldSpacing) {
    LatStep = Math.ceil(minWindFieldSpacing/Ypixels);
  }
  var LatGrid = dLat*LatStep;
  
  var dLon = windData.lons[1] - windData.lons[0];
  if (dLon < 0) dLon = -dLon;
  var Xpixels = dLon * XScale;
  if (Xpixels < minWindFieldSpacing) {
    LonStep = Math.ceil(minWindFieldSpacing/Xpixels);
  }
  var LonGrid = dLon*LonStep;
  
  // We will scale winds so normalWindSpeed matches one latitude grid
  var NwindScale = dLat*LatStep/normalWindSpeed; // deg Lat per m/s
  var EwindScale = NwindScale * YScale / XScale; // deg Lon per m/s
  var i, j;
  for (i = 0; i < windData.nlats; i += LatStep) {
    var lat = windData.lats[i];
    // alert("lat: " + lat.toFixed(2) + " minLat: " + minLat.toFixed(2) +
    //  " maxLat: " + maxLat.toFixed(2));
    if (lat + LatGrid >= minLat && lat - LatGrid <= maxLat) {
      for (j = 0; j < windData.nlons; j += LonStep) {
        var lon = windData.lons[j];
        if (lon > maxLon) lon -= 360;
        // alert("lon: " + lon.toFixed(2) + " minLon: " + minLon.toFixed(2) +
        //  " maxLon: " + maxLon.toFixed(2));
        if (lon + LonGrid >= minLon && lon - LonGrid <= maxLon) {
          var lon1 = lon + windData.field[i*windData.nlons*2] * EwindScale;
          var lat1 = lat + windData.field[i*windData.nlons*2+1] * NwindScale;
          var ps = 'M' + map_scale(lon, lat) + "L" + map_scale(lon1, lat1);
          paper.path(ps).attr({ fill: "none", stroke: "#F00",
            "stroke-width": 1, "arrow-end": "classic-wide-long"}).show;
          // alert(ps);
        }
      }
    }
  }
}

function set_status(text) {
  $("#Status").text(text);
}

function setup_canvases() {
  paper = Raphael("canvas", xdim, ydim);
  paper.clear();
  background = paper.rect(0, 0, xdim, ydim, 10).attr({fill: "#eee", stroke : "none"});
  $( "#zoomfull").click(function() {
    draw_all();
    return false;
  });
  sequence_init([
    { Status: "Loading Models ...", Function: model_init, Async: 1 } ]);
}

function draw_all() {
  sequence_init([
      { Status: "Initializing Range from map", Function: init_scale_from_map },
      { Status: "Drawing map ...", Function: draw_map },
      { Status: "Drawing wind field ...", Function: draw_wind_field }
    ]);
}

//      $( "#canvas" ).on( "click", function( event ) {
//        var $this = $( this );
//        //console.log( "event object:" );
//        //console.dir( event );
//        //console.log( "canvas:" );
//        //console.dir( $this.offset() );
//        var Xoff = event.pageX - $this.offset().left;
//        var Yoff = event.pageY - $this.offset().top;
//        $("#Xval").text(Xoff.toFixed(0));
//        $("#Yval").text(Yoff.toFixed(0));
//        });
