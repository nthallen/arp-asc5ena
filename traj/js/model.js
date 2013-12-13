function model_init() {
  var jqxhr = $.ajax( "model_initialize.json", { dataType: "json" } )
    .done(function(data, textstatus, jqXHR) {
      model_loaded(data);
    })
    .fail(function() {
      alert( "error" );
    });
}

var models;
var arm_epoch = 719529; // 1/1/1970
var cur_state;
var cur_model;

function model_loaded(data) {
  models = data;
  var i;
  var m = $("#models");
  m.empty();
  for (i = 0; i < models.names.length; ++i) {
    m.append("<option value=" + i + ">" + models.names[i] + "</option>");
  }
  model_list_range();
  m.change(function () { model_list_range(); });
  $("#model_init").show();
  $("#StartBtn").click(flight_init);
  sequence_exec(); // Allows model_init() to be used in a sequence
}

function model_list_range() {
  var mn = $("#models").val();
  var minT = models.timeranges[mn*2];
  var maxT = models.timeranges[mn*2+1];
  var minTms = (minT - arm_epoch)*24*3600*1e3;
  var minTD = new Date(minTms);
  var maxTD = new Date((maxT - arm_epoch)*24*3600*1e3);
  var months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
  // console.log("minT is " + minT);
  // console.log("minTms is " + minTms);
  // console.log("minTD is " + minTD);
  // console.dir(minTD);
  var year0 = minTD.getUTCFullYear();
  var year1 = maxTD.getUTCFullYear();
  $("#model_range").empty();
  $("#model_range").html("From: " +
    months[minTD.getUTCMonth()] + " " + year0 +
    " Thru: " + months[maxTD.getUTCMonth()] + " " + year1);
  var m = $("#start_yr");
  m.empty();
  while (year0 <= year1) {
    m.append("<option value=" + year0 + ">" + year0 + "</option>");
    ++year0;
  }
  var fl = $("#flight_levels");
  fl.empty();
  fl.html( models.pressureranges[mn*2].toFixed(0) + " to " +
    models.pressureranges[mn*2+1].toFixed(0) + " hPa");
}

function update_table() {
// <tr><th>Position:</th><td id="run_position"></td></tr>
// <tr><th>Drive Thrust:</th><td id="run_thrust"></td></tr>
// <tr><th>Drive Orientation:</th><td id="run_azimuth"></td></tr>
// <tr><th>Step Size:</th><td><input type="text" id="run_step" name="run_step" size="2" value="3"> hours</td></tr>
// </table>
  $("#run_position").html(cur_state.latitude.toFixed(2) + "N  " + cur_state.longitude.toFixed(2) + "E");
  $("#run_thrust").html(cur_state.thrust.toFixed(1) + " m/s");
  $("#run_azimuth").html(cur_state.orientation.toFixed(0) + "<sup>o</sup>");
}

function flight_init() {
  var mn = $("#models").val();
  var mdl = models.names[mn];
  var start_mon = $("#start_mon").val() + 1;
  var start_day = $("#start_day").val();
  var start_year = $("#start_yr").val();
  var stDate = new Date(start_year, start_mon, start_day, 0, 0, 0, 0);
  var armtime = arm_epoch + stDate.getTime()/(1e3*3600*24);
  if (armtime < models.timeranges[mn*2] || armtime > models.timeranges[mn*2+1]) {
    alert('Start time is outside available model range');
    return 0;
  }
  var fl = $("#flight_level").val();
  fl = parseFloat(fl);
  console.log("fl is " + fl);
  if (fl < models.pressureranges[mn*2] || fl > models.pressureranges[mn*2+1]) {
    alert('Pressure level outside available model range');
    return 0;
  }
  var stepsize = $("#run_step").val()/24;
  // validate stepsize as all numbers
  cur_state = new SC_State(34+28/60, -(104+14.5/60), armtime, stepsize, 0, 0);
  $("#run_model").html(models.fullnames[mn]);
  $("#run_pressure").html(fl.toFixed(0) + " hPa");
  $("#run_model").click(flight_step);
  update_table();
  $("#model_init").hide();
  $("#model_run").show();
  cur_model = {
    trajectory: [new trajectory_rec(cur_state)],
    armtimes: [], winds: [],
    model_name: models.names[mn],
    pressure: fl,
    model_timestep: models.timesteps[mn]
  };
  sequence_init([
      { Status: "Initializing Range from map", Function: init_scale_from_map },
      { Status: "Drawing map ...", Function: draw_map },
      { Status: "Retrieving wind fields ...", Function: load_model_winds },
      { Status: "Drawing wind field ...", Function: draw_wind_field }
    ]);
}
