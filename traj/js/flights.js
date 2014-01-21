/* flight_data(data)
 * Processes the data returned by 'list_flights' request, creating
 * a table inside the #MyFlights div with links to
 * javascript:select_flight(n)
 */
var cur_flight_list;
var Username = 'undef';
var ShowingAll = 0;

function init_cur_flight_list(data) {
  if ( Username == 'undef' ) {
    alert('Username still "' + Username + '" in init_cur_flight_list()');
    return;
  }
  cur_flight_list = {};
  data.data.map(function (row) {
    var frec = {};
    for (var i = 0; i < row.length; ++i) {
      frec[data.cols[i]] = row[i];
    }
    cur_flight_list[frec['FlightID']] = frec;
  });
}

function flight_data(data) {
  if ( Username == 'undef' ) {
    alert('Username still "' + Username + '" in flight_data()');
    return;
  }
  if (data.status.match(/^success: flights listed/i)) {
    init_cur_flight_list(data);
    var attrcol = {};
    for (var i = 0; i < data.cols.length; ++i) {
      attrcol[data.cols[i]] = i;
    }
    $("#MyFlights").empty();
    $("#MyFlights").html(
        '<h3>My Flights</h3>\n' +
        '<table id="FlightsTable" class="tablesorter"><thead>' +
        '<tr>' +
        data.cols.map(function (arg, index) {
          var cl = (index == attrcol['Username']) ? ' class="UserCol"' : '';
          return "<th" + cl + ">" + arg + "</th>";
        }).join('') +
        '</tr></thead><tbody>' +
        data.data.map(function (arg) {
          var FlightID = arg[0];
          arg[0] = "<a href=\"javascript:select_flight(" + FlightID +
                    ")\">" + FlightID + "</a>";
          var notMyFlight = arg[attrcol['Username']] == Username ?
            '' : ' class="notMyFlight"';
          return '<tr id="Flt' + FlightID + '"' + notMyFlight + '>' +
            arg.map(function (b, index) {
              var cl = (index == attrcol['Username']) ? ' class="UserCol"' : '';
              return "<td" + cl + ">" + b + "</td>";
            }).join('') + "</tr>";
        }).join('') +
        '</tbody></table>'
      );
    $("#MyFlights tbody td").addClass('ctr');
    $("#FlightsTable").tablesorter();
    $("#MyFlights h3").click(toggle_flights);
    $("#MyFlights").show();
  }
}

function toggle_flights() {
  if (ShowingAll) {
    $("table.tablesorter .UserCol").hide();
    $("table.tablesorter tbody tr.notMyFlight").hide();
    $("#MyFlights h3").html("My Flights");
  } else {
    $("table.tablesorter .UserCol").show();
    $("table.tablesorter tbody tr.notMyFlight").show();
    $("#MyFlights h3").html("All Flights");
  }
  // $("#MyFlights h3").click(toggle_flights);
  ShowingAll = !ShowingAll;
}

function load_trajectory(data) {
  var FlightID = data.FlightID;
  var frec = cur_flight_list[FlightID];
  cur_model = {
    trajectory: [],
    armtimes: [], winds: [],
    model_name: frec.Model,
    pressure: parseInt(frec.Level),
    FlightID: FlightID,
    battery_capacity: default_battery_capacity,
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
  var stepsize = $("#run_step").val()/24;
  cur_state = new SC_State(lrec.latitude, lrec.longitude, lrec.armtime,
      stepsize, lrec.thrust, lrec.orientation);
  cur_state.battery_energy = lrec.battery_energy;
}
