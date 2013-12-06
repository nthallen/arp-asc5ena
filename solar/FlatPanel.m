function FP = FlatPanel(a, b, tile_edge)
% FP = FlatPanel(a, b, tile_edge);
% For consistency with other configurations, a and b are
% half-dimensions.

FP.a = a;
FP.b = b;
FP.tile_edge = tile_edge;
FP.name = 'Flat Panel';

l = 2*a;
w = 2*b;
nrows = floor(w/tile_edge);
ncols = floor(l/tile_edge);
ntiles = nrows*ncols;
FP.tilepos = zeros(ntiles,6);
hstride = (l-tile_edge)/(ncols-1);
vstride = (w-tile_edge)/(nrows-1);
FP.ul = zeros(ntiles,3);
FP.ur = zeros(ntiles,3);
FP.ll = zeros(ntiles,3);
FP.lr = zeros(ntiles,3);

normal = [0,0,1];
rt = [1,0,0] * tile_edge/2;
up = [0,1,0] * tile_edge/2;

colx = -a + ((1:ncols)-1) * hstride + tile_edge/2;
rowy = -b + (((1:nrows)-1) * vstride + tile_edge/2);
rowz = 0;
tile = 0;
cols = 1:ncols;
for row = 1:nrows
    FP.tilepos(tile+cols,1) = colx;
    FP.tilepos(tile+cols,2) = rowy(row);
    FP.tilepos(tile+cols,3) = 0;
    FP.tilepos(tile+cols,4:6) = ones(ncols,1)*normal;
    tile = tile + ncols;
end
for i = 1:ntiles
    ctr = FP.tilepos(i,1:3);
    FP.ul(i,:) = ctr + up - rt;
    FP.ur(i,:) = ctr + up + rt;
    FP.ll(i,:) = ctr - up - rt;
    FP.lr(i,:) = ctr - up + rt;
end
fprintf(1,'Total of %d tiles\n', ntiles);
