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
  setup_map_canvas($(window).width() - 480, $(window).height() - 50);
  ajax_request({ req: "initialize" }, init_data);
  set_map_redraw_seq([
    { Status: "Drawing map ...", Function: draw_map },
    { Status: "Drawing trajectory ...", Function: draw_trajectory },
    { Status: "Draw current position ...", Function: draw_current_position }
  ]);
}
function init_data(data) {
  if (data.status.match(/^success: logged_in/i)) {
    $("#fullname").html(data.fullname);
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
  $("#logout").click(function() {
      ajax_request({ req: "logout" }, logout_data);
    });
  sequence_init([
      { Status: "Initializing...", Function: initialize, Async: 1 },
      { Status: "Retrieving flight list...", Function: list_flights, Async: 1 },
      { Status: "Initializing map scale...", Function: init_scale_from_map },
      { Status: "Drawing map...", Function: draw_map },
      { Status: "Initializing flight...", Function: init_flight }
    ]);
}
