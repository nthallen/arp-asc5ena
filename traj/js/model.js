function model_init() {
  var jqxhr = $.ajax( "/cgi-bin/model_initialize", { dataType: "json" } )
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

var months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

function model_list_range() {
  var mn = $("#models").val();
  var minT = models.timeranges[mn*2];
  var maxT = models.timeranges[mn*2+1];
  var minTms = (minT - arm_epoch)*24*3600*1e3;
  var minTD = new Date(minTms);
  var maxTD = new Date((maxT - arm_epoch)*24*3600*1e3);
  // console.log("Model start: " + minTD.toUTCString());
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

function format_hm(hour) {
  var rv = "";
  if (hour < 10) {
    rv = "0";
  }
  rv = rv + hour.toFixed(0);
  return rv;
}

function update_table() {
  $("#run_position").html(cur_state.latitude.toFixed(2) + "N  " + cur_state.longitude.toFixed(2) + "E");
  var minutes = Math.round((cur_state.cur_armtime - arm_epoch)*24*60);
  var date = new Date(minutes*60e3);
  //$("#run_date").html( new Date((cur_state.cur_armtime - arm_epoch)*24*3600*1e3).toUTCString());
  $("#run_date").html(
    date.getUTCFullYear() + " " +
    months[date.getUTCMonth()] + " " +
    date.getUTCDate() + " " +
    format_hm(date.getUTCHours()) + ":" +
    format_hm(date.getUTCMinutes()));
}

function flight_init() {
  var mn = $("#models").val();
  var mdl = models.names[mn];
  var start_mon = $("#start_mon").val();
  var start_day = $("#start_day").val();
  var start_year = $("#start_yr").val();
  var stDate = new Date(start_year, start_mon-1, start_day, 0, 0, 0, 0);
  stDate.setUTCFullYear(start_year);
  stDate.setUTCMonth(start_mon-1);
  stDate.setUTCDate(start_day);
  stDate.setUTCHours(0);
  stDate.setUTCMinutes(0);
  stDate.setUTCSeconds(0);
  stDate.setUTCMilliseconds(0);
  // console.log("Requested Start Field: " + start_mon + "/" + start_day + "/" + start_year);
  // console.log("Requested Start Date: " + stDate.toUTCString());
  var armtime = arm_epoch + stDate.getTime()/(1e3*3600*24);
  // console.log("Requested Start armtime: " + armtime);
  if (armtime < models.timeranges[mn*2] || armtime > models.timeranges[mn*2+1]) {
    alert('Start time is outside available model range');
    return 0;
  }
  var fl = $("#flight_level").val();
  fl = parseFloat(fl);
  if (fl < models.pressureranges[mn*2] || fl > models.pressureranges[mn*2+1]) {
    alert('Pressure level outside available model range');
    return 0;
  }
  var stepsize = $("#run_step").val()/24;
  // validate stepsize as all numbers
  cur_state = new SC_State(34+28/60, -(104+14.5/60), armtime, stepsize, 0, 0);
  $("#run_model").html(models.fullnames[mn]);
  $("#run_pressure").html(fl.toFixed(0) + " hPa");
  $("#run_model_step").click(function () { flight_step(); });
  update_table();
  $("#model_init").hide();
  $("#model_run").show();
  run_disable();
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
      { Status: "Retrieving wind fields ...", Function: load_model_winds, Async: 1 },
      { Status: "Drawing wind field ...", Function: draw_wind_field },
      { Status: "Drawing current position ...", Function: draw_current_position },
      { Status: "Drawing thrust plot ...", Function: draw_thrust_plot },
      { Status: "Enable Step", Function: run_enable }
    ]);
}

function run_enable() {
  $("#run_model_step").prop('disabled', false);
  cur_state.busy = 0;
}

function run_disable() {
  $("#run_model_step").prop('disabled', true);
  cur_state.busy = 1;
}

function flight_step() {
  run_disable();
  var run_step = parseInt($("#run_step").val());
  // console.log("run_step is " + run_step);
  cur_state.end_armtime = cur_state.cur_armtime + run_step/24;
  flight_step2();
}

function flight_step2() {
  // console.log("flight_step2()");
  if (cur_state.error) {
    set_status("Error");
  } else if (cur_state.cur_armtime < cur_state.end_armtime) {
    // console.log("flight_step2: sequence 1");
    sequence_init([
        { Status: "Retrieving wind fields ...", Function: load_model_winds, Async: 1 },
        { Status: "Calculating trajectory ...", Function: Trajectory_Integrate },
        { Status: "Checking for completion ...", Function: flight_step2, Async: 1 }
      ]);
  } else {
    // console.log("flight_step2: sequence 2");
    sequence_init([
      { Status: "Retrieving wind fields ...", Function: load_model_winds, Async: 1 },
      { Status: "Drawing wind field ...", Function: draw_wind_field },
      { Status: "Drawing trajectory ...", Function: draw_trajectory },
      { Status: "Draw current position ...", Function: draw_current_position },
      { Status: "Drawing thrust plot ...", Function: draw_thrust_plot },
      { Status: "Update table ...", Function: update_table },
      { Status: "Enable Step", Function: run_enable }
    ]);
  }
}
