function sc_day_avi(SC, SCazi, lat, lon, yr, mon, day)
% sc_day_avi(SC [, SCazi, lat, lon, yr, mon, day]);
% SC: Stratocruiser model from StratoCruiser
% SCazi: Stratocruiser azimuth
% lat: latitude
% lon: E longitude
% yr: year
% mon: month
% day: day

%%
% Fort Sumner, NM
if nargin < 2
    SCazi = 0;
    lat = 34.5;
    lon = -104.2;
    mon = 6; day = 21; yr = 2014;
end
%%
dt = 5/60; % hours
solar_cell_efficiency = 0.20;
time_offset = -lon*24/360;
tm = (0:dt:24)'*3600 + time_offset*3600;
[hr, mn, sc] = time2hms(tm);
dn = datenum(yr, mon, day, hr, mn, sc);
[SolAzi, SolEle] = SolarAzEl(dn, lat, lon, 20);
% sza = sza_calc(lat, lon, tm, mon, day, yr);
% ele = 90 - sza;
%%
PeakWatts = zeros(length(SolEle),1);
for i=1:length(SolEle)
    SC = sc_illuminate(SC, SolAzi(i)-SCazi, SolEle(i));
    PeakWatts(i) = max(SC.illum);
end
daylight = find(PeakWatts>0);
MaxWatts = max(PeakWatts);
%%
writerObj = VideoWriter('sc_day.avi');
open(writerObj);
oldfig = [];
for j=1:length(daylight)
    i = daylight(j);
    SC = sc_illuminate(SC, SolAzi(i)-SCazi, SolEle(i));
    [f, ax] = sc_draw(SC);
    % SC = sc_shell(SC,ax);
    mn = round(tm(i)/60);
    hr = floor(mn/60);
    mn = mn - hr*60;
    sc = 0;
    % [hr, mn, sc] = time2hms(tm(i));
%     title(sprintf('%d/%d/%d %.1fN %.1fE %02d:%02d:%02d UTC', ...
%         mon, day, yr, lat, lon, hr, mn, sc));
    set(ax,'visible','off');
    set(ax, 'clim', [0 MaxWatts]);
    set(f,'units','normalized');
    ax2 = axes('position',[0 0 1 1],'parent',f,'visible','off');
    h = text(.5, .1, sprintf('%d/%d/%d %.1fN %.1fE %02d:%02d:%02d UTC', ...
        mon, day, yr, lat, lon, hr, mn, sc),'parent',ax2);
    set(h,'horizontalAlignment','center');
    frame = getframe(f);
    writeVideo(writerObj, frame);
    xl = get(ax,'xlim');
    yl = get(ax,'ylim');
    zl = get(ax,'zlim');
    fprintf(1, 'Wrote frame %d of %d xl = [%.1f,%.1f] yl = [%.1f,%.1f] zl = [%.1f,%.1f]\n', ...
        j, length(daylight), xl, yl, zl);
    if ~isempty(oldfig)
        delete(oldfig);
    end
    oldfig = f;
end
close(writerObj);
