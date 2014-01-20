function ajax_request(opts, always_func, fail_func) {
  var fail_function;
  if (arguments.length >= 3) {
    fail_function = fail_func;
  }
  if ( ! ajaxpl ) {
    alert('ajaxpl is undefined in ajax_request');
  }
  $.ajax( ajaxpl, { data: opts, dataType: "json" } )
    .fail(function() {
      alert( "Ajax request failed" );
    })
    .always(function(data, textstatus, jqXHR) {
      if (data.status && typeof(data.status) == 'string') {
        if (data.status.match(/^success/i)) {
          always_func(data);
        } else if (fail_function) {
          fail_function(data);
        } else {
          alert(data.status);
        }
      }
    });
}

function initialize() {
  ajax_request({ req: "initialize" }, init_data);
}

function init_data(data) {
  if (data.status.match(/^success: logged_in/i)) {
    $("#fullname").html(data.fullname);
    Username = data.username;
    sequence_exec();
  } else if (data.status.match(/^success: logged_out/i)) {
    // Redirect to home page
    window.location.href = hosthtml + "/";
  } else {
    alert('Unknown status from set password: ' + data.status);
  }
}
function list_flights() {
  ajax_request({ req: "list_flights" }, rev_flight_data);
}
function rev_flight_data(data) {
  flight_data(data);
  sequence_exec();
}
function select_flight(FlightID) {
  $("#FlightsTable tbody tr").removeClass('selected');
  $("#Flt" + FlightID).addClass('selected');
  ajax_request({ req: "flight_traj", FlightID: FlightID}, traj_data);
}
function draw_full_trajectory() {
  draw_trajectory(1);
}

function draw_power_plot() {
  var batt = [];
  var surp = [];
  var has_power = 0;
  var t0 = cur_model.trajectory[0].armtime;
  var in_surplus = 0;
  cur_model.trajectory.map(function (trec) {
    if (trec.battery_energy != 0) {
      has_power = 1;
    }
    batt.push([trec.armtime-t0, trec.battery_energy/1000]);
    if (trec.surplus_energy > 0) {
      if (!in_surplus) {
	surp.push([trec.armtime-t0, trec.battery_energy/1000]);
	in_surplus = 1;
      }
      surp.push([trec.armtime-t0, (trec.battery_energy+trec.surplus_energy)/1000]);
    } else if (in_surplus) {
      surp.push(null);
      in_surplus = 0;
    }
  });
  if (has_power) {
    $("#plot").empty();
    $("#plot").plot(
      [{ label: 'Surplus', data: surp, color: 'red' },
       { label: 'Battery', data: batt, color: 'blue' }],
      { xaxes: [{ axisLabel: 'Days', color: 'black' }],
	yaxes: [{ axisLabel: 'KWH', color: 'black' }]
      });
  } else {
    $("#plot").empty();
    $("#plot").html('<p>*Simulation occurred before power monitoring was implemented.</p>');
  }
}

var cur_model;
var cur_state = new SC_State();

function traj_data(data) {
  var FlightID = data.FlightID;
  var frec = cur_flight_list[FlightID];
  cur_model = {
    trajectory: [],
    armtimes: [], winds: [],
    model_name: frec.Model,
    pressure: frec.Level,
    FlightID: FlightID,
    battery_capacity: 0,
    model_timestep: 0
  };
  data.traj.map(function (row) {
    var trec = new trajectory_rec();
    for (var i = 0; i < data.cols.length; ++i) {
      var attr = data.cols[i];
      trec[attr.toLowerCase()] = row[i];
    }
    cur_model.trajectory.push(trec);
  });
  var lrec = cur_model.trajectory[cur_model.trajectory.length - 1];
  cur_state.latitude = lrec.latitude;
  cur_state.longitude = lrec.longitude;
  cur_state.armtime = lrec.armtime;
  set_map_redraw_seq([
    { Status: "Drawing map ...", Function: draw_map },
    { Status: "Drawing trajectory ...", Function: draw_full_trajectory },
    { Status: "Draw current position ...", Function: draw_current_position }
  ]);
  sequence_init([
    { Status: "Drawing trajectory ...", Function: draw_full_trajectory },
    { Status: "Draw current position ...", Function: draw_current_position },
    { Status: "Drawing power plot ...", Function: draw_power_plot }
  ]);
}

function logout_data(data) {
  if (data.status.match(/^success: logged_in/i)) {
    alert("Expected logged_out after logout request");
  } else if (data.status.match(/^success: logged_out/i)) {
    window.location.href = hosthtml + "/";
  } else {
    alert('Unknown status from set password: ' + data.status);
  }
}

function init_flight() {
  if (localStorage.FlightID) {
    select_flight(localStorage.FlightID);
  }
}

function setup_functions() {
  var w = $(window).width() - 480;
  var ph = 200;
  setup_map_canvas(w, $(window).height() - 50 - ph);
  $("#plot").width(w).height(ph);
  $("#logout").click(function() {
    ajax_request({ req: "logout" }, logout_data);
  });
  sequence_init([
    { Status: "Initializing...", Function: initialize, Async: 1 },
    { Status: "Retrieving flight list...", Function: list_flights, Async: 1 },
    { Status: "Initializing map scale...", Function: init_scale_from_map },
    { Status: "Drawing map...", Function: draw_map },
    { Status: "Initializing flight...", Function: init_flight, Async: 1 }
  ]);
}
