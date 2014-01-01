function area = packing_efficiency(w, h, tile_edge)
% area = packing_efficiency(w, h, tile_edge);
if nargin < 3
    tile_edge = 0.127; % 5"
end
corners = 0.951;
nw = floor(w/tile_edge);
nh = floor(h/tile_edge);
area = nw * nw * tile_edge^2;
