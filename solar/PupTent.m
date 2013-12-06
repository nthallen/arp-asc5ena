function PT = PupTent(a, b, c, tile_edge)
% PT = PupTent(a, b, c, tile_edge);

PT.a = a;
PT.b = b;
PT.c = c;
PT.tile_edge = tile_edge;

l = 2*a;
nrows = floor(b/tile_edge);
ncols = floor(l/tile_edge);
ntiles = nrows*ncols*2;
PT.tilepos = zeros(ntiles,6);
hstride = (l-tile_edge)/(ncols-1);
panel_ht = sqrt(b^2+c^2);
vstride = panel_ht/nrows;
PT.ul = zeros(ntiles,3);
PT.ur = zeros(ntiles,3);
PT.ll = zeros(ntiles,3);
PT.lr = zeros(ntiles,3);

normal = [0,-c,b];
normal = normal/norm(normal);
colx = -a + ((1:ncols)-1) * hstride + tile_edge/2;
rowy = -b + (((1:nrows)-1) * vstride + tile_edge/2) * b / panel_ht;
rowz = (((1:nrows)-1) * vstride + tile_edge/2) * c / panel_ht;
tile = 0;
cols = 1:ncols;
for row = 1:nrows
    PT.tilepos(tile+cols,1) = colx;
    PT.tilepos(tile+cols,2) = rowy(row);
    PT.tilepos(tile+cols,3) = rowz(row);
    PT.tilepos(tile+cols,4:6) = ones(ncols,1)*normal;
    tile = tile + ncols;
end
PT.tilepos(tile+1:end,:) = PT.tilepos(1:tile,:) * diag([1,-1,1,1,-1,1]);
z = [0, 0, 1];
for i = 1:ntiles
    ctr = PT.tilepos(i,1:3);
    normal = PT.tilepos(i,4:6);
    rt = cross(z, normal);
    rt = rt/norm(rt) * PT.tile_edge/2;
    up = cross(normal, rt);
    up = (up/norm(up)) * PT.tile_edge/2;
    
    PT.ul(i,:) = ctr + up - rt;
    PT.ur(i,:) = ctr + up + rt;
    PT.ll(i,:) = ctr - up - rt;
    PT.lr(i,:) = ctr - up + rt;
end
PT.name = 'Pup Tent';
fprintf(1,'Total of %d tiles\n', ntiles);
