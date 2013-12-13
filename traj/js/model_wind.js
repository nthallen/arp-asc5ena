// Loading of wind fields needs to be orchestrated with the
// integration, since it is an asynchronous process.
function Model_Retrieve_Wind_Field(model, index, armtime) {
  model.armtimes[index] = armtime;
  //model.winds[index] = loaded data...
}

function Model_Load_Wind_Fields(armtimes_requested, model) {
  if (model.armtimes[0] != armtime_requested[0]) {
    if (model.armtimes[1] == armtime_requested[0]) {
      model.armtimes[0] = armtime_requested[0];
      model.winds[0] = model.winds[1];
    } else {
      Model_Retrieve_Wind_Field(model, 0, armtime_requested[0]);
    }
  }
  if (model.armtimes[1] != armtime_requested[1]) {
    Model_Retrieve_Wind_Field(model, 1, armtime_requested[1]);
  }
}

// function model_init() {
  // var jqxhr = $.ajax( "model_initialize.json", { dataType: "json" } )
    // .done(function(data, textstatus, jqXHR) {
      // model_loaded(data);
    // })
    // .fail(function() {
      // alert( "error" );
    // });
// }

function model_winds_received(data) {
  if (data.status) {
    if (data.status.match(/^success/i)) {
      Investigate pattern matching in ajax.html
    }
  } else {
    alert("wind request failed");
  }
}

function request_model_winds(mname, pressure, armtime) {
  //var jqxhr = $.ajax( "model_wind_field", { dataType: "json" } );
  var jqxhr = $.ajax( "winds1.json", { dataType: "json" } )
    .done(function(data) { model_winds_received(data); })
    .fail(function() { alert( "error retrieving winds" ); });
}

function load_model_winds() {
  // Use cur_state and cur_model
  var armtime = cur_state.armtime;
  var armday = Math.floor(armtime);
  var armfrac = armtime - armday;
  var armstep = floor(armfrac)/cur_model.model_timestep;
  var armreqtime0 = armday + armstep*cur_model.model_timestep;
  var armreqtime1 = armreqtime0 + cur_model.model.timestep;
  while (cur_model.armtimes.length > 0) {
    if (armreqtime0 > cur_model.armtimes[0]) {
      shift(cur_model.armtimes);
      shift(cur_model.winds);
    }
  }
  // if (cur_model.armtimes.length == 0) { //no winds are loaded, determine 
    // request cur_model.model_name, cur_model.pressure, armreqtime0;
  // } else if (cur_model.armtimes.length == 1) {
    // request cur_model.model_name, cur_model.pressure, armreqtime1;
  // } else {
    // done
  // }
}

function find_in_array(arr, val) {
  // assume array is monotonic.
  var high = arr.length - 1;
  if (high < 1) {
    return {
      i: (high == 0 && val == arr[0]) ? 0 : -1,
      t: 0
    };
  }
  var low = 0;
  var dir = (arr[high] > arr[low]) ? 1 : -1;
  if (dir < 0) {
    low = high;
    high = 0;
  }
  if (val > arr[high]) {
    return { i: -1, t: 1 };
  } else if ( val < arr[low]) {
    return { i: -1, t: -1 };
  }
  while (low+dir != high) {
    var mid = Math.floor((high+low)/2);
    if (val >= arr[mid]) {
      low = mid;
    } else {
      high = mid;
    }
  }
  if (dir > 0) {
    return { i: low, t: (val - arr[low])/(arr[high]-arr[low]) };
  } else {
    return { i: high, t: (arr[high] - val)/(arr[high]-arr[low]) };
  }
}

// Return non-zero on success
function Model_Wind( pos, model ) {
  // Return object containing status and winds
  // Determine the time interval requested.
  // Assume (verify) that wind fields are loaded
  
  if (pos.cur_armtime < model.armtimes[0] || pos.cur_armtime > model.armtimes[1] ||
      model.armtimes[0] >= model.armtimes[1]) {
    alert('Wind fields not loaded in Model_Wind()');
    return { status: 0 };
  }
  //  Determine the requested longitude indices and interpolator.
  
  var ilon = find_in_array(model.winds[0].lons, pos.longitude);
  if (ilon.i < 0) ilon = find_in_array(model.winds[0].lons, pos.longitude-ilon.t*360);
  if (ilon.i < 0) {
    alert('Could not find longitude ' + pos.longitude.toFixed(2) +
      ' in lons: ' + model.winds[0].lons[0].toFixed(2) + ' .. ' +
      model.lons[model.winds[0].lons.length-1].toFixes(2));
    return { status: 0 };
  }
  var ilat = find_in_array(model.winds[0].lats, pos.latitude);
  var itime = find_in_array(model.armtimes, pos.cur_armtime);
  if (ilat.i < 0 || itime.i < 0) {
    alert('Error interpolating latitude or time');
    return { status: 0 };
  }

  // Index in model.field[lat][lon][dir] is
  //  ilat.i*nlons*2 + ilon.i*2 + dir
  var ilats = [ ilat.i*model.winds[0].nlons*2, (ilat.i+1)*model.winds[0].nlons*2 ];
  var ilons = [ ilon.i*2, (ilat.i+1)*2 ];
  u = 0
    + model.winds[0].field[0+ilons[0]+ilats[0]] * (1-ilon.t) * (1-ilat.t) * (1-itime.t)
    + model.winds[0].field[0+ilons[1]+ilats[0]] * (ilon.t) * (1-ilat.t) * (1-itime.t)
    + model.winds[0].field[0+ilons[0]+ilats[1]] * (1-ilon.t) * (ilat.t) * (1-itime.t)
    + model.winds[0].field[0+ilons[1]+ilats[1]] * (ilon.t) * (ilat.t) * (1-itime.t)
    + model.winds[1].field[0+ilons[0]+ilats[0]] * (1-ilon.t) * (1-ilat.t) * (itime.t)
    + model.winds[1].field[0+ilons[1]+ilats[0]] * (ilon.t) * (1-ilat.t) * (itime.t)
    + model.winds[1].field[0+ilons[0]+ilats[1]] * (1-ilon.t) * (ilat.t) * (itime.t)
    + model.winds[1].field[0+ilons[1]+ilats[1]] * (ilon.t) * (ilat.t) * (itime.t);

  v = 0
    + model.winds[0].field[1+ilons[0]+ilats[0]] * (1-ilon.t) * (1-ilat.t) * (1-itime.t)
    + model.winds[0].field[1+ilons[1]+ilats[0]] * (ilon.t) * (1-ilat.t) * (1-itime.t)
    + model.winds[0].field[1+ilons[0]+ilats[1]] * (1-ilon.t) * (ilat.t) * (1-itime.t)
    + model.winds[0].field[1+ilons[1]+ilats[1]] * (ilon.t) * (ilat.t) * (1-itime.t)
    + model.winds[1].field[1+ilons[0]+ilats[0]] * (1-ilon.t) * (1-ilat.t) * (itime.t)
    + model.winds[1].field[1+ilons[1]+ilats[0]] * (ilon.t) * (1-ilat.t) * (itime.t)
    + model.winds[1].field[1+ilons[0]+ilats[1]] * (1-ilon.t) * (ilat.t) * (itime.t)
    + model.winds[1].field[1+ilons[1]+ilats[1]] * (ilon.t) * (ilat.t) * (itime.t);

  return { status: 1, u: u, v: v };
}
