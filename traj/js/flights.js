/* flight_data(data)
 * Processes the data returned by 'list_flights' request, creating
 * a table inside the #MyFlights div with links to
 * javascript:select_flight(n)
 */
var cur_flight_list;
var Username = 'undef';
var ShowingAll = 0;

function flight_data(data) {
  if ( Username == 'undef' ) {
    alert('Username still "' + Username + '" in flight_data()');
    return;
  }
  if (data.status.match(/^success: flights listed/i)) {
    cur_flight_list = {};
    var attrcol = {};
    for (var i = 0; i < data.cols.length; ++i) {
      attrcol[data.cols[i]] = i;
    }
    data.data.map(function (row) {
      var frec = {};
      for (var i = 0; i < row.length; ++i) {
	frec[data.cols[i]] = row[i];
      }
      cur_flight_list[frec['FlightID']] = frec;
    });
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
