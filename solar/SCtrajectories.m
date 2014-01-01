%%
% System dimensions per Justin's 12/16 sizing spreadsheet
a = 2.5; b = 1.25; h = 2.5;
tile_edge = 0.127;
FP = FlatPanel(a,b,tile_edge);
ul = [-a,-b,0]; ur = [a,-b,0]; ll = [-a,-b-h,0]; lr = [a,-b-h,0];
TZ = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI = Hinge(TZ, ul, ur, [-90 90], -90);
FPH = sc_append(FP,HI,[1,1,1]);
FPH = sc_append(FPH,HI,[-1,-1,1]);
%%
ul = [-a,b,0]; ur = [-a,-b,0]; ll = [-a-h,b,0]; lr = [-a-h,-b,0];
TZ2 = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI2 = Hinge(TZ2, ul, ur, [-90 90], -90);
FPH = sc_append(FPH,HI2,[1,1,1]);
FPH = sc_append(FPH,HI2,[-1,-1,1]);
FPH.zlim = [-3,4];
FPH.ylim = [-6.5,6.5];
FPH.xlim = [-7,7];
FPH.name = sprintf('%d x %d x %d Flat Panel with %d Hinged Sides', ...
    a*2, b*2, h, length(FPH.hinge));
%%
FPH.solar_cell_efficiency = .20;
FPH.name = sprintf('%.1f x %.1f x %.1f Flat Panel with %d Hinged Sides, %d%% eff', ...
    a*2, b*2, h, length(FPH.hinge), round(FPH.solar_cell_efficiency*100));
%%
clear FP tile_edge ul ur ll lr TZ HI TZ2 HI2
%%
% sc_group(FPH);
% %%
% sc_summary(FPH,5,21);
% %%
% S = sc_rotation(FPH,40, -104,2014,5,21);
% %%
% [tm,W,dt,SolAzi,SolEle,W_by_tile] = sc_day(FPH, 45, 40, -104, 2014, 5, 21);
% %%
% figure;
% plot(tm,W*1e-3);
% title(sprintf('%s: 40N 5/21',FPH.name));
% xlabel('Hour UTC');
% ylabel('KW generated');
% % %% Packing efficiency due to squaring the circle
% % R = 3;
% % L = 5;
% % h = sqrt(R^2-(L/2)^2);
% % A1 = 2*L*h + pi*(R^2)*8*(45 - atand(h/(L/2)))/360;
% % A2 = 5^2;
%%
Traj = LoadTraj('../traj/map/trajectory.log');
%%
trajectories = unique(Traj.FlightID)';
% durations = zeros(size(trajectories));
% for i = 1:length(trajectories)
%     v = find(Traj.FlightID == trajectories(i));
%     durations(i) = Traj.armtime(v(end)) - Traj.armtime(v(1));
%     fprintf(1, '%2d: %.2f\n', trajectories(i), durations(i));
% end
%% Picking trajectory 1 arbitrarily here now
for FlightID = trajectories
    v = find(Traj.FlightID == FlightID);
    steps_per_hour = 6; % hours
    duration = Traj.armtime(v(end)) - Traj.armtime(v(1));
    if duration < 2
        continue;
    end
    steps = duration*24 * steps_per_hour;
    E_gen = zeros(length(v),1);
    E_use = zeros(length(v),1);
    %%
    rho = 0.091; % kg/m^3
    Balloon_Area = 984.9; % m^2
    Gondola_Area = 7.67; % m^2
    Gondola_CD = 1.2;
    Thrust_Safety = 1.2;
    Propeller_Efficiency = 0.5;
    Battery_Capacity = 23740; % W-hrs
    Battery_Charge = zeros(length(v),1);
    Battery_Charge(1) = Battery_Capacity;
    Battery_Over = NaN*zeros(length(v),1);
    Battery_Under = NaN*zeros(length(v),1);
    for i = 2:length(v)
        %% integrate power used and power generated between i-1 and i
        t0 = Traj.armtime(v(i-1));
        t1 = Traj.armtime(v(i));
        hours = round((t1-t0) * 24);
        V = Traj.Thrust(v(i));
        if V < 5
            % For velocities below 5 m/s, assume we will drive
            % at 5 m/s and duty cycle.
            Vd = 5;
        else
            Vd = V;
        end
        duty_cycle = V/Vd;
        % Power used
        % Balloon Drag
        Balloon_CD = interp1([5 8],[0.1 0.14],Vd);
        Balloon_Drag = 0.5 * rho * Vd^2 * Balloon_CD * Balloon_Area;
        Gondola_Drag = 0.5 * rho * Vd^2 * Gondola_CD * Gondola_Area;
        % Tether_Drag...
        E_use(i) = hours * Thrust_Safety * (Balloon_Drag + Gondola_Drag) * ...
            V / Propeller_Efficiency;
        steps = hours * steps_per_hour;
        armtimes = t0 + [1:steps]'/(steps_per_hour*24);
        lats = interp1([t0 t1],[Traj.Latitude(v(i-1)) Traj.Latitude(v(i))], armtimes, 'linear', 'extrap');
        lons = interp1([t0 t1],[Traj.Longitude(v(i-1)) Traj.Longitude(v(i))], armtimes, 'linear', 'extrap');
        dirs = interp1([t0 t1],[Traj.Orientation(v(i-1)) Traj.Orientation(v(i))], armtimes, 'linear', 'extrap');
        % Using 20 km
        % fprintf(1,'i at %d of %d\n', i, length(v));
        [SolAzi, SolEle] = SolarAzEl(armtimes, lats, lons, 20*ones(steps,1));
        if any(isnan(SolAzi)) || any(isnan(SolEle))
            error('NaNs in SolarAzEl calculation at i = %d', i);
        end
        for j = 1:steps
            FPH = sc_illuminate(FPH, SolAzi(j) - dirs(j), SolEle(j));
            if any(isnan(FPH.illum))
                error('NaNs in sc_illuminate calculation at i,j = %d,%d', i, j);
            end
            W = sum(FPH.illum) * FPH.solar_cell_efficiency;
            E_gen(i) = E_gen(i) + W/steps_per_hour;
        end
        Battery_Charge(i) = Battery_Charge(i-1) + E_gen(i) - E_use(i);
        if Battery_Charge(i) > Battery_Capacity
            if isnan(Battery_Over(i-1))
                Battery_Over(i) = Battery_Charge(i);
            else
                Battery_Over(i) = Battery_Over(i-1) + Battery_Charge(i) - Battery_Capacity;
            end
            Battery_Charge(i) = Battery_Capacity;
        elseif Battery_Charge(i) < 0
            if isnan(Battery_Under(i-1))
                Battery_Under(i) = Battery_Charge(i);
            else
                Battery_Under(i) = Battery_Under(i-1) + Battery_Charge(i);
            end
            Battery_Charge(i) = 0;
        end
    end
    E_net = E_gen - E_use;
    etime = Traj.armtime(v) - Traj.armtime(v(1));
    day0 = find(diff([0; (sign(E_net)>=0)]) > 0);
    day1 = find(diff([(sign(E_net)>=0); 0]) < 0);
    day_net = zeros(size(day0));
    day_etime = zeros(size(day0));
    for i = 1:length(day0)
        day_net(i) = sum(E_net(day0(i):day1(i)));
        day_etime(i) = mean(etime(day0(i):day1(i)));
    end
    night0 = find(diff([0; (sign(E_net)<0)]) > 0);
    night1 = find(diff([(sign(E_net)<0); 0]) < 0);
    night_net = zeros(size(night0));
    night_etime = zeros(size(night0));
    for i = 1:length(night0)
        night_net(i) = sum(E_net(night0(i):night1(i)));
        night_etime(i) = mean(etime(night0(i):night1(i)));
    end
    
    figure;
    plot(etime, E_net*1e-3);
    title(sprintf('Flight Trajectory %d', FlightID));
    ylabel('KW');
    
    figure;
    plot(day_etime, day_net*1e-3, '*', night_etime, -night_net*1e-3, '+');
    title(sprintf('Flight Trajectory %d', FlightID));
    legend('day generation', 'night usage');
    ylabel('KWH');
    xlabel('Days');
    
    figure;
    plot(etime, Battery_Charge*1e-3, etime, Battery_Over*1e-3, 'y', ...
        etime, Battery_Under*1e-3, 'r');
    ylabel('KWH');
    xlabel('Days');
    title(sprintf('Flight Trajectory %d: Battery Charge', FlightID));
    drawnow;
end
