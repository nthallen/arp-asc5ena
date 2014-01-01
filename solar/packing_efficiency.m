function area = packing_efficiency(w, h, tile_edge)
% area = packing_efficiency(w, h, tile_edge);
if nargin < 3
    tile_edge = 0.127; % 5"
end
% corners is the area lost at the corners from cutting a 5" square
% out of a 6" diameters circular wafer
corners = 0.951;
nw = floor(w/tile_edge);
nh = floor(h/tile_edge);
area = corners * nw * nh * tile_edge^2;
