%% To display trajectories
% load continental US:
us = shaperead('statesp020.shp','Selector',{@(v1)(v1 > 0) && (v1 < 49),'ORDER_ADM'});
f = figure;
ax = axes;
mapshow(ax, us);
hold on;
%% Load Trajectories
Traj = LoadTraj('trajectory.log');
%%
flights = unique(Traj.FlightID);
for i=flights'
    v = Traj.FlightID == i;
    h = plot(ax, Traj.Longitude(v), Traj.Latitude(v), 'g');
    shg;
    pause;
    delete(h);
end
