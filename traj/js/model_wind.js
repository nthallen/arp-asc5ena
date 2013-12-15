
function model_winds_received(data) {
  if (data.status) {
    if (data.status.match(/^success/i)) {
      cur_model.armtimes.push(data.armtime);
      cur_model.winds.push(data);
      load_model_winds();
    } else {
      alert("Wind request failed: " + data.status);
    }
  } else {
    alert("Wind request failed: No status");
  }
}

function request_model_winds(armtime) {
  var opts = {
    model: cur_model.model_name,
    level: cur_model.pressure,
    armtime: armtime
  };
  //var filename = "winds_" + armtime.toFixed(2) + ".json";
  //console.log("Retrieving: " + filename);
  var jqxhr = $.ajax( "/cgi-bin/model_wind_field",
      { dataType: "json", data: opts } )
    .done(function(data) { model_winds_received(data); })
    .fail(function() { alert( "error retrieving " + filename ); });
}

function load_model_winds() {
  // Use cur_state and cur_model
  var armtime = cur_state.cur_armtime;
  // var mess = "load_model_winds(" + armtime.toFixed(3) + ") with ";
  // var i;
  // for (i = 0; i < cur_model.armtimes.length; ++i) {
    // if (i == 0) {
      // mess = mess + "[";
    // } else {
      // mess = mess + ", ";
    // }
    // mess = mess + cur_model.armtimes[i].toFixed(2);
  // }
  // console.log(mess + "]");
  var armday = Math.floor(armtime);
  var armfrac = armtime - armday;
  var armstep = Math.floor(armfrac/cur_model.model_timestep);
  var armreqtime0 = armday + armstep*cur_model.model_timestep;
  var armreqtime1 = armreqtime0 + cur_model.model_timestep;
  var armreqtime2 = armreqtime0 + 2*cur_model.model_timestep;
  while (cur_model.armtimes.length > 0 && armreqtime0 > cur_model.armtimes[0]) {
    // console.log("Shifting out armtime " + cur_model.armtimes[0] + " req0: " + armreqtime0);
    cur_model.armtimes.shift();
    cur_model.winds.shift();
  }
  //console.log("armtimes now length " + cur_model.armtimes.length + " winds: " + cur_model.winds.length);
  // Now I've shifted out the old times
  switch (cur_model.armtimes.length) {
    case 0:
      request_model_winds(armreqtime0);
      break;
    case 1:
      request_model_winds(armreqtime1);
      break;
    case 2:
      // alert("wind fields loaded");
      if (armtime + 10/(24*60) > armreqtime1) {
        request_model_winds(armreqtime2);
      } else {
        sequence_exec();
      }
      break;
    case 3:
      sequence_exec();
      break;
    default:
      alert("Unexpected length in load_model_winds()");
      break;
  }
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

var trace_winds = 0;
// Return non-zero on success
function Model_Wind( pos, model ) {
  // Return object containing status and winds
  // Determine the time interval requested.
  // Assume (verify) that wind fields are loaded

  var ntimes = model.armtimes.length;  
  if (ntimes < 2 || pos.armtime < model.armtimes[0] ||
      pos.armtime > model.armtimes[ntimes-1] ||
      model.armtimes[0] >= model.armtimes[ntimes-1]) {
    // alert('Wind fields not loaded in Model_Wind()');
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
  var itime = find_in_array(model.armtimes, pos.armtime);
  if (ilat.i < 0 || itime.i < 0 || isNaN(itime.t)) {
    alert('Error interpolating latitude or time');
    return { status: 0 };
  }

  // Index in model.field[lat][lon][dir] is
  //  ilat.i*nlons*2 + ilon.i*2 + dir
  // "arrayindexordering": "lat/lon/direction"
  var ilats = [ ilat.i*model.winds[0].nlons*2, (ilat.i+1)*model.winds[0].nlons*2 ];
  var ilons = [ ilon.i*2, (ilon.i+1)*2 ];
  if (trace_winds) {
    console.log("[" + pos.longitude.toFixed(3) + "," +
      ilon.i + "," + ilon.t.toFixed(2) + "]"
    );
    // console.log("Wind: ilats = [" + ilats[0] + "," + ilats[1] + "]\n" +
      // "  ilons = [" + ilons[0] + "," + ilons[1] + "]\n" +
      // "  ilat.t = " + ilat.t.toFixed(2) +
      // "  ilon.t = " + ilon.t.toFixed(2) +
      // "  itime.t = " + itime.t.toFixed(2)
      // );
  }
  
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
