var thdim = 200;
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

function setup_thrust_canvas(th_size) {
  thdim = th_size;
  thrust = Raphael("thrust", thdim, thdim);
  $("#thrust").click(function (event) { thrust_event(event); });
  thrust_bg = thrust.rect(0, 0, thdim, thdim, 5).attr({fill: "#000", stroke: "none"});
  thrust_bg.drag(
    function(dx,dy,x,y,event) { thrust_event(event); },// move handler
    function(x,y,event) { thrust_event(event); },
    function(event) {});
}

function polar_vector_path(scale, rho, theta) {
  var x = thdim/2 + rho * scale * Math.sin(theta * Math.PI/180);
  var y = thdim/2 - rho * scale * Math.cos(theta * Math.PI/180);
  var ps = "M" + thdim/2 + "," + thdim/2 +
    "L" + x.toFixed(0) + "," + y.toFixed(0);
  return ps;
}

function draw_thrust_plot() {
  th_wind = Model_Wind(cur_state, cur_model);
  var wind_speed = Math.sqrt(th_wind.u*th_wind.u + th_wind.v*th_wind.v);
  var wind_dir = Math.atan2(th_wind.u,th_wind.v) * 180/Math.PI;
  $("#wind_speed").html(wind_speed.toFixed(2) + " m/s");
  $("#wind_dir").html(wind_dir.toFixed(0) + "<sup>o</sup>");
  var wind_max = Math.max(Math.max(Math.abs(th_wind.u),Math.abs(th_wind.v)), thrust_absmax);
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
  cur_state.drive_power = calc_power_from_velocity(cur_state.thrust);
  var dp = cur_state.drive_power/1000;
  $("#drive_power").html(dp.toFixed(1) + " KW");
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
