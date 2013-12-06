function SC = sc_illuminate(SC, azi, ele, crit, solar)
% SC = sc_illuminate(SC, azi, ele, crit, solar);
% Adds an illum member to the SC structure indicating the
% amount of incident solar radiation available for conversion
% to electricity in W, taking into account the tile size and
% the angle.
if nargin < 4
    crit = 46;
end
if nargin < 5
    solar = 1300;
end
[sx,sy,sz] = sph2cart(degtorad(-azi), degtorad(ele), ele > 0);
normal = SC.tilepos(:,4:6);
SC.illum = normal(:,1)*sx + normal(:,2)*sy + normal(:,3)*sz;
lim = cosd(crit);
SC.illum(SC.illum < lim) = 0;
SC.illum = solar * SC.illum * SC.tile_edge^2;