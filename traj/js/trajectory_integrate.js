// This is what gets recorded in the trajectory record
// Note that within Trajectory_Integrate(), I am using trajectory_recs
// although I do not need thrust and orientation.
function trajectory_rec(cur_state) {
  switch (arguments.length) {
    case 0:
      this.longitude = 0.0;
      this.latitude = 0.0;
      this.armtime = 0.0;
      this.thrust = 0.0;
      this.orientation = 0.0;
      break;
    case 1:
      this.longitude = cur_state.longitude;
      this.latitude = cur_state.latitude;
      this.armtime = cur_state.armtime;
      this.thrust = cur_state.thrust;
      this.orientation = cur_state.orientation;
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
      this.cur_armtime = 0;
      this.end_armtime = 0;
      break;
    case 1:
      this.latitude = lat.latitude;
      this.longitude = lat.longitude;
      this.cur_armtime = lat.cur_armtime;
      this.end_armtime = lat.end_armtime;
      this.thrust = lat.thrust;
      this.orientation = lat.orientation;
      break;
    case 6:
      this.orientation = orientation;
    case 5:
      this.thrust = thrust;
    case 4:
      this.latitude = lat;
      this.longitude = lon;
      this.cur_armtime = cur_time;
      this.end_armtime = cur_time + step;
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

  while ( cur_state.cur_armtime < cur_state.end_armtime &&
          cur_state.cur_armtime < cur_model.armtimes[1]) {
    var dpos = new trajectory_rec();
    var dposa = new Array();
    var i;

    if (cur_state.end_armtime-cur_state.cur_armtime < 1.25 * dt) {
      dt = cur_state.end_armtime - cur_state.cur_armtime;
    }
    //console.log("Int: " + cur_state.cur_armtime.toFixed(3) +
    //  " Lon: " + cur_state.longitude.toFixed(3));
    for (i=0; i < nrk; ++i) {
      //  Define a temporary position, the one at which the wind field is to be 
      //  evaluated. 

      var temp_pos = new trajectory_rec();
      temp_pos.longitude = cur_state.longitude + rk[i].interp * dpos.longitude;
      temp_pos.latitude = cur_state.latitude + rk[i].interp * dpos.latitude;
      temp_pos.armtime = cur_state.cur_armtime + rk[i].interp * dpos.armtime;
      
      if (isNaN(temp_pos.longitude) || isNaN(temp_pos.latitude)) {
        console.log("NaN in temp_pos: armtime: " + cur_state.cur_armtime.toFixed(3));
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
        console.log("NaN in winds: armtime: " + cur_state.cur_armtime.toFixed(3));
        cur_state.error = 1;
        return 1;
      }
      //console.dir(temp_pos);
      //console.dir(wind);
      //  Apply the thrust. 

      var u = wind.u + cur_state.thrust * Math.sin( cur_state.orientation * Math.PI/180 );
      var v = wind.v + cur_state.thrust * Math.cos( cur_state.orientation * Math.PI/180 );

      //  Do the integration according to the Runge-Kutta rule. 

      dpos.longitude = u * ( dt * 86400 ) / ( Re * Math.cos( cur_state.latitude * Math.PI/180 ) ) * 180/Math.PI;
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
    cur_state.cur_armtime += dpos.armtime;

    //  Store the new position in the output trajectory array. 
    var tr = new trajectory_rec(cur_state);
    if (cur_model.trajectory === undefined) {
      alert('cur_model.trajectory undefined in Trajectory_Integrate');
      cur_model.trajectory = [ tr ];
    } else {
      cur_model.trajectory.push(tr);
    }
  }
  // console.log("Int: cur_armtime: " + cur_state.cur_armtime.toFixed(3));
  if (cur_state.end_armtime-cur_state.cur_armtime < 1.0/(3600*24)) {
    cur_state.cur_armtime = cur_state.end_armtime;
  }

  //  Done.

  return 1;
}

