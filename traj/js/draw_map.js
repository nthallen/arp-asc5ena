var xdim = 800;
var ydim = 600;
var thdim = 200;
var minWindFieldSpacing = 40; // pixels
var normalWindSpeed = 10; // m/s to match latitude grid spacing
var pos_radius = 4; // radius of the circle marking current position
var paper; // Raphael paper for main plot
var ra_background; // Raphael object for main background rectangle
var ra_wind_field = new Array(); // array of wind vectors
var ra_pos; // Current position object
var ra_traj; // Trajectory path object
var rubber, rubberx, rubbery, rubberdx, rubberdy;

var thrust; // Raphael paper for thrust plot
var thrust_bg; // Raphael rect for thrust background
var th_scale; // pixels per m/s
var th_wind; // wind structure
var ra_th_wind; // wind vector
var ra_th_thrust; // thrust vector
var ra_th_net; // net vector
var thrust_absmax = 8; // m/s
var ra_th_absmax; // 8 m/s circle
var thrust_max = 5; // m/s
var ra_th_max; // 5 m/s circle

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

function draw_current_position() {
  var x = Math.round((cur_state.longitude-minLon) * XScale);
  var y = Math.round((maxLat - cur_state.latitude) * YScale);
  if (ra_pos) {
    ra_pos.remove();
  }
  ra_pos = paper.circle(x, y, pos_radius).attr({ fill: "#ff0", stroke: "#0f0",
        "stroke-width": 1}).show();
  // console.log("draw_current_position(" + cur_state.longitude.toFixed(2) + "," +
    // cur_state.latitude.toFixed(2) + ") (" + x + ", " + y + ")");
}

function draw_map() {
  var i, j;
  paper.clear();
  ra_traj = undefined;
  ra_pos = undefined;
  ra_wind_field.length = 0;
  ra_background = paper.rect(0, 0, xdim, ydim, 10).attr({fill: "#eee", stroke : "none"});
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
  ra_background.drag( function(dx,dy,x,y,event) { // move handler
    if (!cur_state.busy) {
      x -= $("#canvas").offset().left;
      y -= $("#canvas").offset().top;
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
    }
  },
  function(x,y,event) { // start handler
    if (!cur_state.busy) {
      rubberx = x - $("#canvas").offset().left;
      rubbery = y - $("#canvas").offset().top;
      rubberdx = 0;
      rubberdy = 0;
      rubber = paper.rect(rubberx, rubbery, 1, 1, 0).attr({fill: "none", stroke : "#000" });
      rubber.show;
    }
  },
  function(event) { // end handler
    rubber.remove();
    delete(rubber);
    if (!cur_state.busy && rubberdx != 0 && rubberdy != 0) {
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
        { Status: "Drawing map ...", Function: draw_map },
        { Status: "Drawing wind field ...", Function: draw_wind_field },
        { Status: "Drawing trajectory ...", Function: draw_trajectory },
        { Status: "Draw current position ...", Function: draw_current_position }
        ]);
    }
  });
}

// for this, we only need to interpolat in time, since we are only
// using points from the grid.
function draw_wind_field() {
  while (ra_wind_field.length > 0) {
    // console.log("ra_wind_field.length: " + ra_wind_field.length);
    // console.dir(ra_wind_field[0]);
    ra_wind_field[0].remove();
    ra_wind_field.shift();
  }
  var LatStep = 1;
  var LonStep = 1;
  // console.log("draw: armtimes: " + cur_model.armtimes.length + " winds: " +
    // cur_model.winds.length);
  if (cur_model.winds.length < 2) {
    alert("Winds not loaded in draw_wind_field: length " + cur_model.winds.length + " " +
      cur_model.armtimes.length);
    return 0;
  }
  var winds0 = cur_model.winds[0];
  var winds1 = cur_model.winds[1];
  var dLat = winds0.lats[1] - winds0.lats[0];
  if (dLat < 0) dLat = -dLat;
  var Ypixels = dLat * YScale;
  if (Ypixels < minWindFieldSpacing) {
    LatStep = Math.ceil(minWindFieldSpacing/Ypixels);
  }
  var LatGrid = dLat*LatStep;
  
  var dLon = winds0.lons[1] - winds0.lons[0];
  if (dLon < 0) dLon = -dLon;
  var Xpixels = dLon * XScale;
  if (Xpixels < minWindFieldSpacing) {
    LonStep = Math.ceil(minWindFieldSpacing/Xpixels);
  }
  var LonGrid = dLon*LonStep;

  var itime = find_in_array(cur_model.armtimes, cur_state.cur_armtime);
  if (itime.i < 0) {
    alert('Error interpolating time in draw_wind_field');
    // console.log("cur: " + cur_state.cur_armtime + " 0: " + cur_model.armtimes[0] +
      // " 1: " + cur_model.armtimes[1]);
    return 0;
  }
  
  // We will scale winds so normalWindSpeed matches one latitude grid
  var NwindScale = dLat*LatStep/normalWindSpeed; // deg Lat per m/s
  var EwindScale = NwindScale * YScale / XScale; // deg Lon per m/s
  var i, j;
  for (i = 0; i < winds0.nlats; i += LatStep) {
    var lat = winds0.lats[i];
    // alert("lat: " + lat.toFixed(2) + " minLat: " + minLat.toFixed(2) +
    //  " maxLat: " + maxLat.toFixed(2));
    if (lat + LatGrid >= minLat && lat - LatGrid <= maxLat) {
      for (j = 0; j < winds0.nlons; j += LonStep) {
        var lon = winds0.lons[j];
        if (lon > maxLon) lon -= 360;
        // alert("lon: " + lon.toFixed(2) + " minLon: " + minLon.toFixed(2) +
        //  " maxLon: " + maxLon.toFixed(2));
        if (lon + LonGrid >= minLon && lon - LonGrid <= maxLon) {
          var pos = new trajectory_rec();
          pos.longitude = lon;
          pos.latitude = lat;
          pos.armtime = cur_state.cur_armtime;
          wind = Model_Wind(pos, cur_model);
          var lon1 = lon + wind.u*EwindScale;
          var lat1 = lat + wind.v*NwindScale;
          var ps = 'M' + map_scale(lon, lat) + "L" + map_scale(lon1, lat1);
          ra_wind_field.push(
            paper.path(ps).attr({ fill: "none", stroke: "#F00",
              "stroke-width": 1, "arrow-end": "classic-wide-long"}).show());
        }
      }
    }
  }
}

function draw_trajectory() {
  // console.log("draw_trajectory");
  if (ra_traj) {
    ra_traj.remove();
    ra_traj = null;
  }
  var i;
  var tr = cur_model.trajectory;
  if (tr.length > 1) {
    var ps = 'M' + map_scale(tr[0].longitude, tr[0].latitude);
    for (i = 1; i < tr.length; ++i) {
      ps = ps + 'L' + map_scale(tr[i].longitude, tr[i].latitude);
    }
    ra_traj =
      paper.path(ps).attr({ fill: "none", stroke: "#0F0",
        "stroke-width": 1}).show();
  }
}

function polar_vector_path(scale, rho, theta) {
  var x = thdim/2 + rho * scale * Math.sin(theta * Math.PI/180);
  var y = thdim/2 - rho * scale * Math.cos(theta * Math.PI/180);
  var ps = "M" + thdim/2 + "," + thdim/2 +
    "L" + x.toFixed(0) + "," + y.toFixed(0);
  return ps;
}

function draw_thrust_plot() {
  // Note: If I renamed SC_State's cur_armtime member to armtime,
  // I could initialize this with cur_state, or even pass cur_state
  // to Model_Wind directly.
  var temp_pos = new trajectory_rec();
  temp_pos.longitude = cur_state.longitude;
  temp_pos.latitude = cur_state.latitude;
  temp_pos.armtime = cur_state.cur_armtime;
  th_wind = Model_Wind(temp_pos, cur_model);
  var wind_speed = Math.sqrt(th_wind.u*th_wind.u + th_wind.v*th_wind.v);
  var wind_dir = Math.atan2(th_wind.u,th_wind.v) * 180/Math.PI;
  $("#wind_speed").html(wind_speed.toFixed(2) + " m/s");
  $("#wind_dir").html(wind_dir.toFixed(0) + "<sup>o</sup>");
  var wind_max = Math.max(Math.max(Math.abs(wind.u),Math.abs(wind.v)), thrust_absmax);
  th_scale = thdim/(2*wind_max);
  var ps = polar_vector_path(th_scale, wind_speed, wind_dir);
  if (ra_th_wind) {
    ra_th_wind.attr({ path: ps});
  } else {
    ra_th_wind = thrust.path(ps).attr({ fill: "none", stroke: "#F00",
              "stroke-width": 1, "arrow-end": "classic-wide-long"}).show();
  }
  if (ra_th_absmax) {
    ra_th_absmax.attr({ r: thrust_absmax * th_scale });
  } else {
    ra_th_absmax = thrust.circle(thdim/2, thdim/2, thrust_absmax * th_scale)
      .attr({ fill: "none", stroke: "#f00", "stroke_width": 1}).show();
  }
  if (ra_th_max) {
    ra_th_max.attr({ r: thrust_max * th_scale });
  } else {
    ra_th_max = thrust.circle(thdim/2, thdim/2, thrust_max * th_scale)
      .attr({ fill: "none", stroke: "#0f0", "stroke_width": 1}).show();
  }
  draw_thrust_vector();
  $("#thrust").click(function (event) { thrust_event(event); });
  thrust_bg.drag(
    function(dx,dy,x,y,event) { thrust_event(event); },// move handler
    function(x,y,event) { thrust_event(event); },
    function(event) {});
}

function thrust_event(event) {
  var th = $("#thrust");
  var u = (event.pageX - th.offset().left - thdim/2) / th_scale;
  var v = -(event.pageY - th.offset().top - thdim/2) / th_scale;
  var drive_dir = Math.atan2(u,v) * 180/Math.PI;
  var drive_speed = Math.sqrt(u*u + v*v);
  if (drive_speed > thrust_absmax) {
    drive_speed = thrust_absmax;
    u = drive_speed * Math.sin(drive_dir * Math.PI/180);
    v = drive_speed * Math.cos(drive_dir * Math.PI/180);
  }
  cur_state.thrust = drive_speed;
  cur_state.orientation = drive_dir;
  draw_thrust_vector();
}

function draw_thrust_vector() {
// var ra_th_net; // net vector
  $("#drive_speed").html(cur_state.thrust.toFixed(2) + " m/s");
  $("#drive_dir").html(cur_state.orientation.toFixed(0) + "<sup>o</sup>");
  ps = polar_vector_path(th_scale, cur_state.thrust, cur_state.orientation);
  if (ra_th_thrust) {
    ra_th_thrust.attr({ path: ps});
  } else {
    ra_th_thrust = thrust.path(ps).attr({ fill: "none", stroke: "#0f0",
              "stroke-width": 1, "arrow-end": "classic-wide-long"}).show();
  }
  var net_u = th_wind.u + cur_state.thrust * Math.sin(cur_state.orientation * Math.PI/180);
  var net_v = th_wind.v + cur_state.thrust * Math.cos(cur_state.orientation * Math.PI/180);
  var net_speed = Math.sqrt(net_u*net_u+net_v*net_v);
  var net_dir = Math.atan2(net_u, net_v) * 180/Math.PI;
  $("#net_speed").html(net_speed.toFixed(2) + " m/s");
  $("#net_dir").html(net_dir.toFixed(0) + "<sup>o</sup>");
  ps = polar_vector_path(th_scale, net_speed, net_dir);
  if (ra_th_net) {
    ra_th_net.attr({ path: ps});
  } else {
    ra_th_net = thrust.path(ps).attr({ fill: "none", stroke: "yellow",
              "stroke-width": 1, "arrow-end": "classic-wide-long"}).show();
  }
}

function set_status(text) {
  $("#Status").text(text);
}

function setup_canvases() {
  paper = Raphael("canvas", xdim, ydim);
  paper.clear();
  ra_background = paper.rect(0, 0, xdim, ydim, 10).attr({fill: "#eee", stroke : "none"});
  $( "#zoomfull").click(function() {
    draw_all();
    return false;
  });
  thrust = Raphael("thrust", thdim, thdim);
  thrust_bg = thrust.rect(0, 0, thdim, thdim, 5).attr({fill: "#000", stroke: "none"});
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