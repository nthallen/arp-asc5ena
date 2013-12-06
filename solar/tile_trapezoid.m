function TZ = tile_trapezoid(ul, ur, ll, lr, tile_edge)
% TZ = tile_trapezoid(ul, ur, ll, lr, tile_edge);
% Supplied points are [x,y,z] coordinates.
% Assumption is that (ur-ul) || (lr-ll) and
% ||ur-ul|| <= ||lr-ll||
%%
rt = lr - ll;
rt = rt / norm(rt);
E1 = ul - ll;
L1 = norm(E1);
E2 = ur - lr;
Up = E1 - sum(E1 .* rt)*rt;
H = norm(Up);
up = Up/H;
nrows = floor(H/tile_edge);
Hstride = (H-tile_edge)/(nrows-1);
%%
rul = zeros(nrows,3);
rur = zeros(nrows,3);
Li = zeros(nrows,1);
ntiles = 0;
%%
for i = 1:nrows
    %%
    uH = ((i-1)*Hstride + tile_edge)/H;
    rul(i,:) = ll + uH * E1;
    rur(i,:) = lr + uH * E2;
    Li(i) = norm(rur(i,:)-rul(i,:));
    ntiles = ntiles + floor(Li(i)/tile_edge);
end
%%
TZ.tilepos = zeros(ntiles,6);
TZ.ul = zeros(ntiles,3);
TZ.ur = zeros(ntiles,3);
TZ.ll = zeros(ntiles,3);
TZ.lr = zeros(ntiles,3);
TZ.tile_edge = tile_edge;
tile = 0;
Tup = up * tile_edge/2;
Trt = rt * tile_edge/2;
normal = cross(rt,up);
%%
for i = 1:nrows
    ntrow = floor(Li(i)/tile_edge);
    tiles = tile + (1:ntrow);
    ctr0 = rul(i,:) + Trt - Tup;
    if ntrow > 1
        hstride = (Li(i)-tile_edge)/(ntrow-1);
    else
        ctr0 = rul(i,:) + (rur(i,:)-rul(i,:))/2;
        hstride = 0;
    end
    TZ.tilepos(tiles,1:3) = ones(ntrow,1)*ctr0 + (0:ntrow-1)' * hstride * rt;
    rv = ones(ntrow,1);
    TZ.ul(tiles,:) = TZ.tilepos(tiles,1:3) + rv*Tup - rv*Trt; 
    TZ.ur(tiles,:) = TZ.tilepos(tiles,1:3) + rv*Tup + rv*Trt; 
    TZ.ll(tiles,:) = TZ.tilepos(tiles,1:3) - rv*Tup - rv*Trt; 
    TZ.lr(tiles,:) = TZ.tilepos(tiles,1:3) - rv*Tup + rv*Trt; 
    tile = tile + ntrow;
end
TZ.tilepos(:,4:6) = ones(ntiles,1)*normal;
