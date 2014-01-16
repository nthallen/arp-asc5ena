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
  setup_map_canvas();
  init_scale_from_map();
  draw_map();
}
function init_data(data) {
  if (data.status.match(/^success: logged_in/i)) {
    $("#cur_username").html(user);
    ajax_request({ req: "list_flights" }, flight_data);
  } else if (data.status.match(/^success: logged_out/i)) {
    // Redirect to home page
    window.location.href = hosthtml + "/";
  } else {
    alert('Unknown status from set password: ' + data.status);
  }
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

function setup_functions() {
  $("#status_info").html("Initializing...");
  $(".status_info").show();

  $("#logout").click(function() {
      ajax_request({ req: "logout" }, logout_data);
    });
  setTimeout(initialize, 200);
}
