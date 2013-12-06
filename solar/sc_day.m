function [tm,W,dt,SolAzi,SolEle,W_by_tile] = sc_day(SC, SCazi, lat, lon, yr, mon, day)
% [tm,W,dt,azi,ele] = sc_day(SC, SCazi, lat, lon, yr, mon, day);
% SC: Stratocruiser model from StratoCruiser
% lat: latitude
% lon: E longitude
% yr: year
% mon: month
% day: day
%
% tm: time in UTC seconds since midnight
% W: Total Watts at each time
% dt: time spacing (for integration of W)
% SolAzi: Solar azimuth, degrees
% SolEle: Solar elevation, degrees
% W_by_tile: Average power by tile

%%
% Fort Sumner, NM
if nargin < 2
    SCazi = 0;
    lat = 34.5;
    lon = -104.2;
    mon = 6; day = 21; yr = 2014;
end
%%
dt = 10/60; % hours
solar_cell_efficiency = 0.20;
time_offset = -lon*24/360;
tm = (0:dt:24)'*3600 + time_offset*3600;
[hr, mn, sc] = time2hms(tm);
dn = datenum(yr, mon, day, hr, mn, sc);
[SolAzi, SolEle] = SolarAzEl(dn, lat, lon, 20);
% sza = sza_calc(lat, lon, tm, mon, day, yr);
% ele = 90 - sza;
%%
W = zeros(size(SolEle));
W_by_tile = zeros(size(SC.tilepos,1),1);
for i=1:length(SolEle)
    SC = sc_illuminate(SC, SolAzi(i)-SCazi, SolEle(i));
    W(i) = sum(SC.illum) * solar_cell_efficiency;
    W_by_tile = W_by_tile + SC.illum * solar_cell_efficiency;
end
