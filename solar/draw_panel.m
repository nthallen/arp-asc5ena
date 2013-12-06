function draw_panel( ax, ul, ur, ll, lr, clr )
% draw_panel( ax, ul, ur, ll, lr, clr )
% ax: axes on which to draw
% tilepos: 1x6 including x,y,z center and x,y,z normal
% tile_edge: length of the square side
% clr: Color value

% Example code for surf
% k = 5;
% n = 2^k-1;
% [x,y,z] = sphere(n);
% c = hadamard(2^k);
% surf(x,y,z,c);
% colormap([1  1  0; 0  1  1])
% axis equal

% We need to create 2x2 matrices for X, Y and Z defining the
% four corners of the tile
% z = [0 0 1];
% ctr = tilepos(1:3);
% normal = tilepos(4:6);
% rt = cross(z, normal);
% rt = rt/norm(rt) * tile_edge/2;
% up = cross(normal, rt);
% up = up/norm(up) * tile_edge/2;
% 
% ul = ctr + up - rt;
% ur = ctr + up + rt;
% ll = ctr - up - rt;
% lr = ctr - up + rt;
X = [ ul(1) ur(1); ll(1) lr(1) ];
Y = [ ul(2) ur(2); ll(2) lr(2) ];
Z = [ ul(3) ur(3); ll(3) lr(3) ];
surf(ax,X,Y,Z,clr);
