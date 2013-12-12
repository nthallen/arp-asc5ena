function stats = sc_rotation(SC, lat, lon, yr, mon, day)
% stats = sc_rotation(SC [, lat, lon, yr, mon, day]);

d_azi = 5;
%%
% Fort Sumner, NM
if nargin < 2
    lat = 34.5;
    lon = -104.2;
    mon = 6; day = 21; yr = 2014;
end

%%
azis = 0:d_azi:360-d_azi;
WM = [];
WHr_by_tile = zeros(size(SC.tilepos,1),1);
for i = 1:length(azis)
    [tm,W,dt,~,~,W_by_tile] = sc_day(SC, azis(i), lat, lon, yr, mon, day);
    if isempty(WM)
        WM = zeros(length(tm),length(azis));
    end
    WM(:,i) = W;
    WHr_by_tile = WHr_by_tile + W_by_tile*dt;
end
WHr_by_tile = WHr_by_tile / length(azis);
%%
f1 = figure;
mesh(azis,tm/3600,WM)
title(sprintf('All rotations: %s, %d/%d/%d %.1fN %.1fE', SC.name, mon, day, yr, lat, lon));
xlim([0 360]);shg
xlabel('Azimuth');
ylabel('Hour UTC');
zlabel('Watts');
%%
f2 = figure;
ax = gca;
scatter(ax,SC.tilepos(:,1),SC.tilepos(:,2),6,WHr_by_tile,'filled');
set(ax,'DataAspectRatio',[1 1 1]);
colorbar;
title(sprintf('Average WHr/Tile/Day over all rotations: %d/%d/%d %.1fN %.1fE', mon, day, yr, lat, lon));
%%
z = ones(size(SC.tilepos,1),1)*[0,0,1];
inc = asind(sum(SC.tilepos(:,4:6).*z,2));
f3 = figure;
plot(inc, WHr_by_tile,'.'); shg
title(sprintf('All rotations: %d/%d/%d %.1fN %.1fE', mon, day, yr, lat, lon));
xlabel('Tile inclination (0=vertical)');
ylabel('Average WHr/tile/day, All rotations');
%%
minW = min(WM,[],2); maxW = max(WM,[],2);
minWHr = sum(minW)*dt; maxWHr = sum(maxW)*dt;
fprintf(1,'All rotations: %d/%d/%d %.1fN %.1fE\n', mon, day, yr, lat, lon);
fprintf(1,'%5.1f: Maximum KWHr/Day (best rotations)\n', maxWHr/1e3);
fprintf(1,'%5.1f: Minimum KWHr/Day (worst rotations) %.1f%%\n', ...
    minWHr/1e3, 100*minWHr/maxWHr);

if nargout > 0
    stats = struct('tm',tm,'azis',azis,'WM',WM,'dt',dt, ...
        'WHr_by_tile',WHr_by_tile,'Inclination', inc, ...
        'minWHr', minWHr, 'maxWHr', maxWHr, ...
        'figures', [f1,f2,f3]);
end
