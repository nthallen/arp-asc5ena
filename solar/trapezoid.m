function TZ = trapezoid(c, B1, B2, theta, tile_edge)
% TZ = trapezoid(c, B1, B2, theta);
% c: height of trapezoid when projected onto horizontal surface
% B1: half length of lower base
% B2: half length of upper base
% theta: inclination of trapezoid above horizontal

%%
L = c * secd(theta);
nrows = floor(L/tile_edge);
ntiles = zeros(nrows,1);
for i = 1:nrows
    Bi = B1 + (B2-B1)*(tile_edge*i)/L;
    ntiles(i) = floor(2*Bi/tile_edge);
end
%%
tottiles = sum(ntiles);
TZ.tile_edge = tile_edge;
TZ.c = c;
TZ.B1 = B1;
TZ.B2 = B2;
TZ.theta = theta;
TZ.tilepos = zeros(tottiles,6);
TZ.ul = zeros(tottiles,3);
TZ.ur = zeros(tottiles,3);
TZ.ll = zeros(tottiles,3);
TZ.lr = zeros(tottiles,3);
tile = 0;
for i = 1:nrows
    nt = ntiles(i);
    tiles = tile + (1:nt);
    Bi = B1 + (B2-B1)*(tile_edge*i)/L;
    xstride = (2*Bi-tile_edge)/(nt-1);
    TZ.tilepos(tiles,1) = -Bi + (0:nt-1)*xstride + tile_edge/2;
    TZ.tilepos(tiles,2) = (i-0.5)*tile_edge * cosd(theta) - c;
    TZ.tilepos(tiles,3) = (i-0.5)*tile_edge * sind(theta);
    tile = tile + nt;
end
TZ.tilepos(:,4:6) = ones(tottiles,1)*[0,-sind(theta),cosd(theta)];
%%
tcol = ones(tottiles,1);
rt = tcol*[1,0,0]*tile_edge/2;
up = tcol*[0,cosd(theta),sind(theta)]*tile_edge/2;
TZ.ul = TZ.tilepos(:,1:3) + up - rt;
TZ.ur = TZ.tilepos(:,1:3) + up + rt;
TZ.ll = TZ.tilepos(:,1:3) - up - rt;
TZ.lr = TZ.tilepos(:,1:3) - up + rt;
TZ.name = sprintf('Trapezoid %.0f^o', theta);
