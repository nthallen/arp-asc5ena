// This is what gets recorded in the trajectory record
function trajectory_rec(cur_state) {
  switch (arguments.length) {
    case 0:
      this.longitude = 0.0;
      this.latitude = 0.0;
      this.armtime = 0.0;
      this.thrust = 0.0;
      this.orientation = 0.0;
      this.solazi = 0.0;
      this.solele = 0.0;
      this.battery_charge = 0.0;
      this.surplus_energy = 0.0;
      break;
    case 1:
      this.longitude = cur_state.longitude;
      this.latitude = cur_state.latitude;
      this.armtime = cur_state.armtime;
      this.thrust = cur_state.thrust;
      this.orientation = cur_state.orientation;
      this.solazi = cur_state.solazi;
      this.solele = cur_state.solele;
      this.battery_charge = cur_state.battery_charge;
      this.surplus_energy = cur_state.surplus_energy;
      break;
    default:
      alert("Invalid number of arguments in trajectory_rec(): " + arguments.length);
      break;
  }
}

 // SC_State is the StratoCruiser current state
function SC_State(lat, lon, cur_time, step, thrust, orientation) {
  this.thrust = 0;
  this.orientation = 0;
  this.error = 0;
  this.busy = 0;
  switch (arguments.length) {
    case 0:
      this.latitude = 0;
      this.longitude = 0;
      this.armtime = 0;
      this.end_armtime = 0;
      this.stop_armtime = 0;
      this.thrust = 0;
      this.orientation = 0;
      this.solazi = 0.0;
      this.solele = 0.0;
      this.battery_charge = 0.0;
      this.surplus_energy = 0.0;
      this.solar_power = 0.0;
      this.drive_power = 0.0;
      break;
    case 1:
      this.latitude = lat.latitude;
      this.longitude = lat.longitude;
      this.armtime = lat.armtime;
      this.end_armtime = lat.end_armtime;
      this.stop_armtime = lat.end_armtime;
      this.thrust = lat.thrust;
      this.orientation = lat.orientation;
      this.solazi = lat.solazi;
      this.solele = lat.solele;
      this.battery_charge = lat.battery_charge;
      this.surplus_energy = lat.surplus_energy;
      this.solar_power = lat.solar_power;
      this.drive_power = lat.drive_power;
      break;
    case 6:
      this.orientation = orientation;
    case 5:
      this.thrust = thrust;
    case 4:
      this.latitude = lat;
      this.longitude = lon;
      this.armtime = cur_time;
      this.end_armtime = cur_time + step;
      this.stop_armtime = this.end_armtime;
      this.solazi = 0.0;
      this.solele = 0.0;
      this.battery_charge = 0.0;
      this.surplus_energy = 0.0;
      this.solar_power = 0.0;
      this.drive_power = 0.0;
      break;
    default:
      alert("Invalid number of arguments for SC_State(): " + arguments.length);
      break;
  }
}

function Trajectory_Integrate() {
  // console.log("Trajectory_Integrate()");
  //  This function integrates the balloon trajectory forward in time.
  //
  //  cur_state (input/output): Data structure containing the last position (longitude, 
  //	latitude, cur_armtime, end_armtime) from which to begin the integration of the balloon's
  //	trajectory. 
  //
  //  trajectory (output) I think I'm going to move this into the model
  //	An array of data structures containing the longitude, latitude, and 
  //	armtime of every point along the trajectory. 
  //
  //  model (input)
  //	The resource structure containing metadata on the model used to provide 
  //	the wind field. 
  //
  //  thrust (input)
  //	The resource structure containing settings for the balloon thrust. 
  //
  //  step (input)
  //	The number of days over which to integrate forward in time. 
  //
  // Returns zero on error. It is up to the caller to determine whether
  //   the requested range has been completed or additional wind fields
  //   need to be loaded in order to continue.

  //  Earth's radius.

  var Re = 6378.0e3;  // meters

  //  Set the integration time step. 

  var dt = 1.0 / ( 24 * 60 ); // 1 minute

  //  Define Runge-Kutta scheme.

  var rk = [
    { weight:1.0/6.0, interp:0.0 },
    { weight:2.0/6.0, interp:0.5 },
    { weight:2.0/6.0, interp:0.5 },
    { weight:1.0/6.0, interp:1.0 } ];
  var nrk = rk.length;

  while ( cur_state.armtime < cur_state.end_armtime &&
          cur_state.armtime < cur_model.armtimes[1]) {
    var dpos = new trajectory_rec();
    var dposa = new Array();
    var i;

    // Calculate drive power
    var thrust = cur_state.thrust;
    cur_state.drive_power = calc_power_from_velocity(cur_state.thrust);
    if (cur_state.solar_power < cur_state.drive_power && cur_state.battery_charge <= 0) {
      thrust = 0;
      cur_state.drive_power = 0;
    }
    
    if (cur_state.end_armtime-cur_state.armtime < 1.25 * dt) {
      dt = cur_state.end_armtime - cur_state.armtime;
    }
    //console.log("Int: " + cur_state.armtime.toFixed(3) +
    //  " Lon: " + cur_state.longitude.toFixed(3));
    for (i=0; i < nrk; ++i) {
      //  Define a temporary position, the one at which the wind field is to be 
      //  evaluated. 

      var temp_pos = new trajectory_rec();
      temp_pos.longitude = cur_state.longitude + rk[i].interp * dpos.longitude;
      temp_pos.latitude = cur_state.latitude + rk[i].interp * dpos.latitude;
      temp_pos.armtime = cur_state.armtime + rk[i].interp * dpos.armtime;
      
      if (isNaN(temp_pos.longitude) || isNaN(temp_pos.latitude)) {
        console.log("NaN in temp_pos: armtime: " + cur_state.armtime.toFixed(3));
        cur_state.error = 1;
        return 1;
      }
      // Evaluate the wind field at the temporary position. 

      // console.log("temp_pos(" +
        // temp_pos.longitude.toFixed(2) + ", " +
        // temp_pos.latitude.toFixed(2) + ") armtime: " +
        // temp_pos.armtime.toFixed(3));
      trace_winds = 0;
      var wind = Model_Wind(temp_pos, cur_model);
      // console.log(temp_pos.armtime.toFixed(4) + ", " +
        // temp_pos.longitude.toFixed(4) + ", " +
        // wind.u.toFixed(4) + ", " +
        // wind.v.toFixed(4));
      trace_winds = 0;
      if ( wind.status == 0 ) { // zero return means we need more wind
        // alert("Ran out of wind data");
        return 1;
      }
      if (isNaN(wind.u) || isNaN(wind.v)) {
        console.log("NaN in winds: armtime: " + cur_state.armtime.toFixed(3));
        cur_state.error = 1;
        return 1;
      }
      //console.dir(temp_pos);
      //console.dir(wind);
      //  Apply the thrust. 

      var u = wind.u + thrust * Math.sin( cur_state.orientation * Math.PI/180 );
      var v = wind.v + thrust * Math.cos( cur_state.orientation * Math.PI/180 );

      //  Do the integration according to the Runge-Kutta rule. 

      dpos.longitude = u * ( dt * 86400 ) /
        ( Re * Math.cos( cur_state.latitude * Math.PI/180 ) ) * 180/Math.PI;
      dpos.latitude = v * ( dt * 86400 ) / ( Re ) * 180/Math.PI;
      dpos.armtime = dt;

      // Store this evaluation of the forward step. Linearly combine all Runge-Kutta
      // steps later. 

      dposa.push(new trajectory_rec(dpos));
    }

    //  Linearly combine all elements of the Runge-Kutta forward step. 

    dpos =  new trajectory_rec();

    for (i=0; i < nrk; ++i) {
      dpos.longitude += dposa[i].longitude * rk[i].weight;
      dpos.latitude += dposa[i].latitude * rk[i].weight;
      dpos.armtime += dposa[i].armtime * rk[i].weight;
    }
    // console.log("Int: dpos(" +
      // dpos.longitude.toFixed(2) + "," +
      // dpos.latitude.toFixed(2) + ") darmtime: " +
      // dpos.armtime.toFixed(3));
    //  Define the new position. 

    cur_state.longitude += dpos.longitude;
    cur_state.latitude += dpos.latitude;
    cur_state.armtime += dpos.armtime;
    var solar_power0 = cur_state.solar_power;
    calc_solar_power(cur_state);
    var net_energy = (0.5 * (solar_power0 + cur_state.solar_power) -
      cur_state.drive_power) * dt * 24;
    cur_state.battery_charge += net_energy;
    if (cur_state.battery_charge < 0) {
      cur_state.surplus_energy += cur_state.battery_charge;
      cur_state.battery_charge = 0;
    } else if (cur_state.battery_charge > cur_model.battery_capacity) {
      cur_state.surplus_energy += cur_state.battery_charge - cur_model.battery_capacity;
      cur_state.battery_charge = cur_model.battery_capacity;
    } else {
      cur_state.surplus_energy = 0;
    }
  }
  if (cur_state.end_armtime-cur_state.armtime < 1.0/(3600*24)) {
    cur_state.armtime = cur_state.end_armtime;
  }

  //  Done.

  return 1;
}

function packing_efficiency(w, h, tile_edge) {
  // area = packing_efficiency(w, h, tile_edge);
  if (arguments.length < 3) {
      tile_edge = 0.127; // 5"
  }
  // corners is the area lost at the corners from cutting a 5" square
  // out of a 6" diameters circular wafer
  var corners = 0.951;
  var nw = Math.floor(w/tile_edge);
  var nh = Math.floor(h/tile_edge);
  var area = corners * nw * nh * tile_edge * tile_edge;
  return area;
}

// Uses degrees
function sph2cartd(az, elev, r) {
  var elevr = elev * Math.PI / 180;
  var azr = az * Math.PI / 180;
  var z = r * Math.sin(elevr);
  var rcoselev = r * Math.cos(elevr);
  var x = rcoselev * Math.cos(azr);
  var y = rcoselev * Math.sin(azr);
  return [x,y,z];
}

function dot_product(a, b) {
  return (a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);
}

function norm_cross(a, b) {
  var c =
    [ a[1]*b[2]-a[2]*b[1], 
      a[2]*b[0]-a[0]*b[2],
      a[0]*b[1]-a[1]*b[0]];
  return c[0]*c[0] + c[1]*c[1] + c[2]*c[2];
}

var SPM = {}; // this is the solar power model

function init_solar_model() {
  var a = 2.5;
  var b = 1.25;
  var h = 2.5;
  SPM.solar_cell_efficiency = 0.20;
  SPM.PF = 1300 * SPM.solar_cell_efficiency;
  SPM.flat = { normal: [0,0,1], area: packing_efficiency(2*a, 2*b) };
  SPM.hinge1 = { vertex: [1,0,0], area: 2 * packing_efficiency(2*a, h) };
  SPM.hinge2 = { vertex: [0,1,0], area: 2 * packing_efficiency(2*b, h) };
}

function calc_solar_power(state) {
  var AzEl = SolarAzEl(state.armtime,  state.latitude, state.longitude, 20);
  state.solazi = AzEl.Az;
  state.solele = AzEl.El;
  var sun = sph2cartd(state.orientation-state.solazi, state.solele, state.solele > 0);
  var WF = dot_product(SPM.flat.normal, sun);
  var theta = Math.acos(WF * Math.PI / 180);
  WF = WF * SPM.PF * SPM.flat.area * Math.cos(Math.pow(theta/90,5) * Math.PI / 2);
  var WH1 = norm_cross(SPM.hinge1.vertex,sun);
  theta = Math.acos(WH1) * 180 / Math.PI;
  WH1 = WH1 * SPM.PF * SPM.hinge1.area * Math.cos(Math.pow(theta/90,5) * Math.PI / 2);
  var WH2 = norm_cross(SPM.hinge2.vertex,sun);
  theta = Math.acos(WH2) * 180 / Math.PI;
  WH2 = WH2 * SPM.PF * SPM.hinge2.area * Math.cos(Math.pow(theta/90,5) * Math.PI / 2);
  var WM = WF + WH1 + WH2;
  state.solar_power = WM;
}

// Thrust Model
var TM = { V: [], P: []};

function init_thrust_model() {
  var rho = 0.091; // kg/m^3
  var Balloon_Area = 984.9; // m^2
  var Gondola_Area = 7.67; // m^2
  var Gondola_CD = 1.2;
  var Thrust_Safety = 1.2;
  var Propeller_Efficiency = 0.5;
  var V; // Desired velocity m/s
  for (V = thrust_max; V <= thrust_absmax; V += 0.1) {
    if (V+.05 > thrust_absmax) {
      V = thrust_absmax;
    }
    var Balloon_CD = (V-5)*(0.14-0.1)/(8-5) + 0.1;
    var Balloon_Drag = 0.5 * rho * V*V * Balloon_CD * Balloon_Area;
    var Gondola_Drag = 0.5 * rho * V*V * Gondola_CD * Gondola_Area;
    // Tether_Drag...
    var Power = Thrust_Safety * (Balloon_Drag + Gondola_Drag) *
          V / Propeller_Efficiency;
    TM.V.push(V);
    TM.P.push(Power);
  }
}

function calc_power_from_velocity(V) {
  var P;
  var ivel = find_in_array(TM.V, V);
  if (ivel.i < 0) {
    if (ivel.t < 0) {
      P = TM.P[0] * V/5;
    } else {
      alert('Requested velocity outside limits');
      P = 0.;
    }
  } else {
    P = TM.P[ivel.i] * (1-ivel.t) + TM.P[ivel.i+1] * (ivel.t);
  }
  return P;
}
