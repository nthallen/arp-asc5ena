function gen_solar_test_data
%% Generate test data for Javascript version of SolarAzEl
t0 = datenum(2014,5,1);
steps = 6*24; % 10 minute steps
armtime = t0 + (0:steps)'/steps;
lat = 34.5;
lon = -104.2;
alt = 20;
[Az,El] = SolarAzEl(armtime,lat,lon,alt);
dumpvar('armtime', armtime);
dumpvar('Az', Az);
dumpvar('El', El);

function dumpvar(name, value)
fprintf(1,'var %s = [', name);
fprintf(1,'%.4f,\n', value);
fprintf(1,'];\n');
