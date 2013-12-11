%% David Sayres' solar panels
% 24 Evergreen Solar 210 Panels
% Arrayed pointing south with an elevation of 45 degrees
% Dimensions are 1.7225 x .9513 meters = 1.63 m^2/panel
% Rated for 210 W at STC (1000 W/m^2 ...) which seems like 13% to me.
%
% Medford is 42 25/60 N, 71 6/60 W
%
% David reports 33.7 KWHr on 4/3/2013 with a peak of 4650 W at 1PM (EDT)

% North is +X, and we want this facing south:
a = 1.7225; b = .9513; theta = 45;
ul = [ a*cosd(theta), b/2, a*sind(theta)];
ur = ul - [0,b,0];
ll = [ 0, b/2, 0];
lr = ll - [0,b,0];
DS = tile_trapezoid(ul,ur,ll,lr,.127);
DS = sc_illuminate(DS, 180, 45);
sc_draw(DS);
%%
lat = 42+25/60; lon = -(71+6/60);
yr = 2013; mon = 4; day = 3;
[tm,W,dt,azi,ele] = sc_day(DS, 0, lat, lon, yr, mon, day);
WHr = 24 * dt * sum(W);
%%
figure;
plot(tm,W * 24);
title(sprintf('24 20%% panels at 65 Kft over Medford, %d/%d/%d: %.1f KWHr', ...
    mon, day, yr, WHr*1e-3));
xlabel('Hours UTC');
ylabel('Watts');
%%
figure;
plot(tm, W * 24 * (1000/1300) * (13/20));
title(sprintf('24 13%% panels in Medford, %d/%d/%d: %.1f KWHr', ...
        mon, day, yr, WHr*1e-3 * (1000/1300) * (13/20)));
