function SC = StratoCruiser( a, b, c, tile_edge )
% SC = StratoCruiser( a, b, c, tile_edge )
%%
% Strategy to tile a hemiellipsoid surface
% 1: On the minor equator, determine the number of levels by
%    dividing the arc length of one quadrant by the tile edge length
% 2: Locate evenly spaced levels.
% 3: For each level N, determine number of tiles by dividing circumference
%    at level N+1 by tile edge length
% 4: Locate evenly spaced tiles at level N+1/2
%
% This could be done semi-symbolically or by generating a "fine enough"
% mesh. The advantage of the latter is that it may then be applicable to
% other shapes

% Problem characterized by:
%   a, b, c: semi minor radii for x, y, z. a >= b
%   tile_edge: length of tile square
% a = 10/2;
% b = 8/2;
% c = 2.5;
% tile_edge = 0.2;
SC.a = a;
SC.b = b;
SC.c = c;
SC.tile_edge = tile_edge;

% (x/a)^2 + (y/b)^2 + (z/c)^2 = 1, z >= 0
%   z = fz_of_xy(x,y) ...
fz_of_xy = @(x,y) c * sqrt(1 - x.^2/a^2 - y.^2/b^2);

%% Calculate path and distance from (0,b,0) to (0,0,c)
%  parametrize by y: b -> 0
fxyz_of_y = @(y) [ 0*y y fz_of_xy(0,y) ];
[xyz1, d1] = path_length(fxyz_of_y, b, 0);

%%
nrows = floor(d1(end)/tile_edge);
fprintf(1, 'Will use %d rows. Total cord length %.2f m\n', nrows, d1(end));
% First row based at d = 0, centered at d = .5*tile_edge,
%   counted at d = tile_edge
%
%% For each row (1, ...)
% Determine y where d = tile_edge*row
% Calculate z_i = f(0,y);
full_rows = 1:nrows;
row_topz = interp1(d1,xyz1(:,3),full_rows*tile_edge);
half_rows = full_rows - 0.5;
row_centerz = interp1(d1,xyz1(:,3),half_rows*tile_edge);
% plot(full_rows,row_topz,'*',half_rows,row_centerz,'o');

%% Parametrize level curve where z = row_topz(row) (for full rotation)
% This defines an ellipse in x,y with semi minor radii
%    a*[1-(z/c)^2]
%    b*[1-(z/c)^2]
fx_of_yz = @(y,z) a * sqrt(max([(0*y) (1 - y.^2/b^2 - z.^2/c^2)],[],2));
% fx_of_yz = @(y,z) a * sqrt(1 - y.^2/b^2 - z.^2/c^2);

%%
ntiles = zeros(nrows,1);
for row = 1:nrows
    % Calculate path and distance:
    z1 = row_topz(row);
    fxyz_of_yz = @(y) [fx_of_yz(y,z1) y 0*y+z1];
    
    [xyz2, d2] = path_length(fxyz_of_yz, 0, b*sqrt(max([0 1-(z1/c).^2])));
    if ~isreal(xyz2)
        error('huarp:complex', 'complex path at row %d pass 1', row);
    end
    % xyz3 = [ xyz2; flipud(xyz2(1:end-1,:)) * [-1 0 0; 0 1 0; 0 0 1] ];
    d3 = [ d2; 2*d2(end) - flipud(d2(1:end-1)) ];
    % xyz4 = [ xyz3; flipud(xyz3(1:end-1,:)) * [1 0 0; 0 -1 0; 0 0 1] ];
    d4 = [ d3; 2*d3(end) - flipud(d3(1:end-1)) ];
    
    ntiles(row) = floor(d4(end)/tile_edge);
%     fprintf(1, 'Row %d: Will use %d tiles. Total circumference %.2f m\n', ...
%         row, ntiles(row), d4(end));
end

%%
fprintf(1, 'Total of %d tiles in %d rows\n', sum(ntiles), nrows);

%%
% tilepos(1:3) will be xyz position of center
% tilepos(4:6) will be the normal vector
tilepos = zeros(sum(ntiles),6);
vertex = zeros(sum(ntiles),3);
SC.ul = vertex;
SC.ur = vertex;
SC.ll = vertex;
SC.lr = vertex;
SC.rownum = zeros(sum(ntiles),1);
%%
tile = 0;
z = [0 0 1];
for row = 1:nrows
% row = 1;
    z1 = row_centerz(row);
    fxyz_of_yz = @(y) [fx_of_yz(y,z1) y 0*y+z1];
    
    [xyz2, d2] = path_length(fxyz_of_yz, 0, b*sqrt(max([0 (1-(z1/c).^2)])));
    if ~isreal(xyz2)
        error('huarp:complex', 'complex path at row %d pass 2', row);
    end
    xyz3 = [ xyz2; flipud(xyz2(1:end-1,:)) * [-1 0 0; 0 1 0; 0 0 1] ];
    d3 = [ d2; 2*d2(end) - flipud(d2(1:end-1)) ];
    xyz4 = [ xyz3; flipud(xyz3(1:end-1,:)) * [1 0 0; 0 -1 0; 0 0 1] ];
    d4 = [ d3; 2*d3(end) - flipud(d3(1:end-1)) ];
    stride = d4(end)/ntiles(row);
    centerd = (0:ntiles(row)-1) * stride;
    tiles = tile + (1:ntiles(row));
    tilepos(tiles, 1:3) = interp1(d4, xyz4, centerd);
    % Apply a small vertical correction to make sure center is on
    % the surface of the ellipsoid
    tilepos(tiles, 3) = ...
        c * sqrt(max([0*tiles', ...
        1-(tilepos(tiles,1)/a).^2 - (tilepos(tiles,2)/b).^2],[],2));
    tilepos(tiles, 4) = tilepos(tiles,1)/(a^2);
    tilepos(tiles, 5) = tilepos(tiles,2)/(b^2);
    tilepos(tiles, 6) = tilepos(tiles,3)/(c^2);
    for i = tiles
        tilepos(i, 4:6) = tilepos(i, 4:6)/norm(tilepos(i, 4:6));
        ctr = tilepos(i,1:3);
        normal = tilepos(i,4:6);
        rt = cross(z, normal);
        rt = rt/norm(rt) * tile_edge/2;
        up = cross(normal, rt);
        up = (up/norm(up)) * tile_edge/2;
        
        SC.ul(i,:) = ctr + up - rt;
        SC.ur(i,:) = ctr + up + rt;
        SC.ll(i,:) = ctr - up - rt;
        SC.lr(i,:) = ctr - up + rt;
    end
    SC.rownum(tiles) = row;
    tile = tile + ntiles(row);
end
%%
SC.tilepos = tilepos;
