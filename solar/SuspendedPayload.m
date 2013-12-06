function SP = SuspendedPayload
% SP = SuspendedPayload;
%%
r = 0.4;
SC = StratoCruiser(r,r,r,.127);
SC = sc_shell(SC);
%%
cyl_ht = 2.5 - 2*r;
circ = 2*pi*r;
tiles_per_row = floor(circ/SC.tile_edge);
col_stride = 360/tiles_per_row;
nrows = floor((cyl_ht-SC.tile_edge)/SC.tile_edge) + 1;
row_stride = (cyl_ht-SC.tile_edge)/(nrows-1);
%%
tilepos = zeros(tiles_per_row,6);
ul = zeros(tiles_per_row,3);
ur = zeros(tiles_per_row,3);
ll = zeros(tiles_per_row,3);
lr = zeros(tiles_per_row,3);
[X,Y] = ...
    pol2cart(deg2rad((0:tiles_per_row-1)'*col_stride), r);
tilepos(:,1) = X;
tilepos(:,2) = Y;
tilepos(:,3) = -SC.tile_edge/2;
tilepos(:,4:5) = tilepos(:,1:2)/r;
z = [0 0 1];
for i=1:tiles_per_row
    ctr = tilepos(i,1:3);
    normal = tilepos(i,4:6);
    rt = cross(z, normal);
    rt = rt/norm(rt) * SC.tile_edge/2;
    up = cross(normal, rt);
    up = (up/norm(up)) * SC.tile_edge/2;
    
    ul(i,:) = ctr + up - rt;
    ur(i,:) = ctr + up + rt;
    ll(i,:) = ctr - up - rt;
    lr(i,:) = ctr - up + rt;
end
%%
total_tiles = size(SC.tilepos,1)+tiles_per_row*nrows;
SP.tilepos = zeros(total_tiles,6);
SP.ul = zeros(total_tiles,3);
SP.ur = zeros(total_tiles,3);
SP.ll = zeros(total_tiles,3);
SP.lr = zeros(total_tiles,3);
SP.name = 'Suspended Payload';
%%
tiles = 1:size(SC.tilepos,1);
SP.tilepos(tiles,:) = SC.tilepos;
SP.ul(tiles,:) = SC.ul;
SP.ur(tiles,:) = SC.ur;
SP.ll(tiles,:) = SC.ll;
SP.lr(tiles,:) = SC.lr;
SP.tile_edge = SC.tile_edge;
tile = tiles(end);
for i = 1:nrows
    tiles = tile + (1:tiles_per_row);
    SP.tilepos(tiles,:) = tilepos;
    SP.ul(tiles,:) = ul;
    SP.ur(tiles,:) = ur;
    SP.ll(tiles,:) = ll;
    SP.lr(tiles,:) = lr;
    tilepos(:,3) = tilepos(:,3) - row_stride;
    ul(:,3) = ul(:,3) - row_stride;
    ur(:,3) = ur(:,3) - row_stride;
    ll(:,3) = ll(:,3) - row_stride;
    lr(:,3) = lr(:,3) - row_stride;
    tile = tile + tiles_per_row;
end
%%
SP.shell = struct( ...
    'X', [ flipud(SC.shell.X); SC.shell.X ], ...
    'Y', [ flipud(SC.shell.Y); SC.shell.Y ], ...
    'Z', [ -cyl_ht-flipud(SC.shell.Z); SC.shell.Z ]);
