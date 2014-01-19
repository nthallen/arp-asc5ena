/* flight_data(data)
 * Processes the data returned by 'list_flights' request, creating
 * a table inside the #MyFlights div with links to
 * javascript:select_flight(n)
 */
var cur_flight_list;
function flight_data(data) {
  if (data.status.match(/^success: flights listed/i)) {
    cur_flight_list = {};
    data.data.map(function (row) {
        var frec = {};
        var i;
        for (i = 0; i < row.length; ++i) {
          frec[data.cols[i]] = row[i];
        }
        cur_flight_list[frec['FlightID']] = frec;
      });
    $("#MyFlights").empty();
    $("#MyFlights").html(
        '<h3>My Flights</h3>\n' +
        '<table id="FlightsTable" class="tablesorter"><thead>' +
        '<tr>' +
        data.cols.map(function (arg) { return "<th>" + arg + "</th>"; }).join('') +
        '</tr></thead><tbody>' +
        data.data.map(function (arg) {
            var FlightID = arg[0];
            arg[0] = "<a href=\"javascript:select_flight(" + FlightID +
                      ")\">" + FlightID + "</a>";
            return '<tr id="Flt' + FlightID + '">' +
              arg.map(function (b) {
                  return "<td>" + b + "</td>";
                }).join('') + "</tr>";
          }).join('') +
        '</tbody></table>'
      );
    $("#MyFlights tbody td").addClass('ctr');
    $("#FlightsTable").tablesorter();
  }
}
