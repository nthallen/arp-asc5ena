var xdim = 800;
var ydim = 600;
var pos_radius = 4; // radius of the circle marking current position
var paper; // Raphael paper for main plot
var ra_background; // Raphael object for main background rectangle
var ra_pos; // Current position object
var ra_start; // Starting position object
var ra_traj; // Trajectory path object
var rubber, rubberx, rubbery, rubberdx, rubberdy;

var minLat = 360;
var maxLat = -360;
var minLon = 360;
var maxLon = -360;
var nBorders = Map.length; // Map.length
var XScale, YScale; // pixels per degree

function setup_map_canvas(xd, yd) {
  xdim = xd;
  ydim = yd;
  paper = Raphael("canvas", xdim, ydim);
  paper.clear();
  ra_background = paper.rect(0, 0, xdim, ydim, 10).attr({fill: "#000", stroke : "none"});
  // $( "#zoomfull").click(function() {
    // draw_all();
    // return false;
  // });
}

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
  XScale = xdim/(maxLon - minLon);
  YScale = ydim/(maxLat - minLat);
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
  var x, y;
  if (!ra_start) {
    var start = cur_model.trajectory[0];
    x = Math.round((start.longitude-minLon) * XScale);
    y = Math.round((maxLat - start.latitude) * YScale);
    ra_start = paper.circle(x, y, pos_radius).attr({ fill: "#f00", stroke: "#0f0",
	  "stroke-width": 1}).show();
  } else {
    ra_start.toFront();
  }
  x = Math.round((cur_state.longitude-minLon) * XScale);
  y = Math.round((maxLat - cur_state.latitude) * YScale);
  if (ra_pos) {
    ra_pos.attr({cx: x, cy: y}).toFront();
  } else {
    ra_pos = paper.circle(x, y, pos_radius).attr({ fill: "#ff0", stroke: "#0f0",
	  "stroke-width": 1}).show();
  }
}

var map_redraw_seq = [
  { Status: "Drawing map ...", Function: draw_map }
];

function set_map_redraw_seq(new_seq) {
  map_redraw_seq = new_seq;
}


function draw_map() {
  var i, j;
  paper.clear();
  ra_traj = false;
  ra_pos = false;
  ra_start = false;
  ra_background = paper.rect(0, 0, xdim, ydim, 10).attr({fill: "#000", stroke : "none"});
  for (i = 0; i < nBorders; ++i) {
    // Map[i].BoundingBox = [ mLon MLon mLat MLat ];
    var BB = Map[i].BoundingBox;
    if (BB[0] <= maxLon && BB[1] >= minLon && BB[2] <= maxLat && BB[3] >= minLat) {
      var ps = 'M' + map_scale(Map[i].X[1], Map[i].Y[1]);
      for (j = 1; j < Map[i].X.length; ++j) {
        ps = ps + "L" + map_scale(Map[i].X[j], Map[i].Y[j]);
      }
      // alert(ps);
      paper.path(ps).attr({ fill: "none", stroke: "#444",
        "stroke-width": 2}).show;
    }
  }
  paper.text(xdim-20, ydim-40, '+').click(function() { zoom(0.75); })
    .attr({fill: "#eee", stroke: "#eee", "font-size": 16, cursor: 'pointer'});
  paper.text(xdim-20, ydim-20, '-').click(function() { zoom(4/3.); })
    .attr({fill: "#eee", stroke: "#eee", "font-size": 16, cursor: 'pointer'});
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
      rubber = paper.rect(rubberx, rubbery, 1, 1, 0).attr({fill: "none", stroke : "#00F" });
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
      sequence_init(map_redraw_seq);
    }
  });
}

function zoom_scale(range, factor) {
  var mean = (range[0] + range[1])/2;
  var delta = factor * (range[1] - range[0])/2;
  range[0] = mean - delta;
  range[1] = mean + delta;
}

function zoom(factor) {
  var range = [minLat, maxLat];
  zoom_scale(range, factor);
  minLat = range[0];
  maxLat = range[1];
  range = [minLon, maxLon];
  zoom_scale(range, factor);
  minLon = range[0];
  maxLon = range[1];
  init_scale();
  sequence_init(map_redraw_seq);
}

function draw_trajectory(all) {
  if (arguments.length == 0) {
    all = 0;
  }
  var tr = cur_model.trajectory;
  var i = tr.length-1, j = 0;
  if (i > 1) {
    var ps = 'M' + map_scale(tr[i].longitude, tr[i].latitude);
    for (i--; i >= 0 && (all || ++j < 48); --i) {
      ps = ps + 'L' + map_scale(tr[i].longitude, tr[i].latitude);
    }
    if (ra_traj) {
      ra_traj.attr({ path: ps });
    } else {
      ra_traj =
        paper.path(ps).attr({ fill: "none", stroke: "#0F0",
          "stroke-width": 1}).show();
    }
  } else if (ra_traj) {
    ra_traj.attr({ path: '' });
  }
}
