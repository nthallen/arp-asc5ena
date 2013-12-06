function PY = Pyramid(a, b, inc, tile_edge)
% PY = Pyramid(a, b, inc, tile_edge)
% Actually more like a hip roof, but could be a pyramid if square.
% For consistency with other configurations, a and b are
% half-dimensions.

PY.a = a;
PY.b = b;
PY.tile_edge = tile_edge;
PY.name = sprintf('Pyramid %.0f^o', inc);

TZ1 = trapezoid(b, a, a-b, inc, tile_edge);
TZ2 = trapezoid(b, b, 0, inc, tile_edge);
nTZ1 = size(TZ1.tilepos,1);
nTZ2 = size(TZ2.tilepos,1);
ntiles = 2*(nTZ1+nTZ2);
PY.tilepos = zeros(ntiles,6);
tiles = 1:nTZ1;
PY.tilepos(tiles,:) = TZ1.tilepos;
PY.ul(tiles,:) = TZ1.ul;
PY.ur(tiles,:) = TZ1.ur;
PY.ll(tiles,:) = TZ1.ll;
PY.lr(tiles,:) = TZ1.lr;

tiles = nTZ1+(1:nTZ1);
PY.tilepos(tiles,:) = TZ1.tilepos * diag([1,-1,1,1,-1,1]);
PY.ul(tiles,:) = TZ1.ul * diag([1,-1,1]);
PY.ur(tiles,:) = TZ1.ur * diag([1,-1,1]);
PY.ll(tiles,:) = TZ1.ll * diag([1,-1,1]);
PY.lr(tiles,:) = TZ1.lr * diag([1,-1,1]);

tiles = 2*nTZ1+(1:nTZ2);
rotrt = [0,-1,0;1,0,0;0,0,1];
xoff = ones(nTZ2,1)*[a-b,0,0];
PY.tilepos(tiles,1:3) = TZ2.tilepos(:,1:3) * rotrt - xoff;
PY.tilepos(tiles,4:6) = TZ2.tilepos(:,4:6) * rotrt;
PY.ul(tiles,:) = TZ2.ul * rotrt - xoff;
PY.ur(tiles,:) = TZ2.ur * rotrt - xoff;
PY.ll(tiles,:) = TZ2.ll * rotrt - xoff;
PY.lr(tiles,:) = TZ2.lr * rotrt - xoff;

tiles = 2*nTZ1+nTZ2+(1:nTZ2);
rotlt = [0,1,0;-1,0,0;0,0,1];
PY.tilepos(tiles,1:3) = TZ2.tilepos(:,1:3) * rotlt+xoff;
PY.tilepos(tiles,4:6) = TZ2.tilepos(:,4:6) * rotlt;
PY.ul(tiles,:) = TZ2.ul * rotlt+xoff;
PY.ur(tiles,:) = TZ2.ur * rotlt+xoff;
PY.ll(tiles,:) = TZ2.ll * rotlt+xoff;
PY.lr(tiles,:) = TZ2.lr * rotlt+xoff;
fprintf(1,'Total of %d tiles\n', ntiles);
