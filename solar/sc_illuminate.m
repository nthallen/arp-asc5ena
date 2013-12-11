function SC = sc_illuminate(SC, azi, ele, solar)
% SC = sc_illuminate(SC, azi, ele, solar);
% Adds an illum member to the SC structure indicating the
% amount of incident solar radiation available for conversion
% to electricity in W, taking into account the tile size and
% the angle.
if nargin < 4
    solar = 1300;
end
if isfield(SC,'hinge')
    for i = 1:length(SC.hinge)
        SC = SC.hinge(i).articulate(SC, SC.hinge(i), azi, ele);
    end
end
% I use negative azimuth here because sph2cart uses angles running
% counter clockwise, but we'd like them going clockwise. N is along
% the X axis
[sx,sy,sz] = sph2cart(degtorad(-azi), degtorad(ele), ele > 0);
normal = SC.tilepos(:,4:6);
SC.illum = normal(:,1)*sx + normal(:,2)*sy + normal(:,3)*sz;
SC.illum(SC.illum < 0) = 0;
theta = acosd(SC.illum);
SC.illum = SC.illum .* cosd(90*(theta/90).^5);
SC.illum = solar * SC.illum * SC.tile_edge^2;
SC.solar = struct('azi', azi, 'ele', ele);
