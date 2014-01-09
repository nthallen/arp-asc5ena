function TU = Turtle(a, b, inc, tile_edge)
% TU = Turtle(a, b, inc, tile_edge);
%%
%a = 5; b = 4; inc = 45; tile_edge = .127;
%%
V1 = [a,0];
V3 = [0,b];
V2 = [a/sqrt(2),b/sqrt(2)];
E1 = V2 - V1;
phi = atand(-E1(2)/E1(1));
E2 = V3 - V2;
eta = atand(-E2(2)/E2(1));
theta = (180 - phi + eta)/2;
L1 = norm(E1);
xi = 180 - theta - phi;
L2 = L1 * sind(theta)/sind(xi);
V4 = [a-L2,0];
V5 = [0,(a-L2)*tand(eta)];
%
% Path = [V4;V1;V2;V3;V5;V4;V2];
% figure; plot(Path(:,1),Path(:,2));
% %%
H1 = L2*sind(phi);
Z1 = H1*tand(inc);
% %%
% Path1 = [V1,0;V2,0;V3,0];
% %%
% Path2 = [Path1; Path1(end-1:-1:1,:)*diag([-1,1,1])];
% Path3 = [Path2; Path2(end-1:-1:1,:)*diag([1,-1,1])];
% %%
% Path1a = [V4,Z1;V4,Z1;V5,Z1];
% Path2a = [Path1a; Path1a(end-1:-1:1,:)*diag([-1,1,1])];
% Path3a = [Path2a; Path2a(end-1:-1:1,:)*diag([1,-1,1])];
% X = [Path3(:,1), Path3a(:,1)];
% Y = [Path3(:,2), Path3a(:,2)];
% %Z = [zeros(size(Path3,1),1),ones(size(Path3,1),1)*Z1];
% Z = [Path3(:,3), Path3a(:,3)];
% figure; surf(X,Y,Z);
% set(gca,'DataAspectRatio',[1,1,1]);
%
V1 = [V1 0];
V2 = [V2 0];
V3 = [V3 0];
V4 = [V4 Z1];
V5 = [V5 Z1];
%%
TU = tile_trapezoid(V4, V5, V2, V3, tile_edge);
%%
TU2 = tile_trapezoid(V4, V4, V1, V2, tile_edge);
%%
TU = sc_append(TU, TU2, [1,1,1]);
TU = sc_append(TU, TU, [-1,1,1]);
TU = sc_append(TU, TU, [1,-1,1]);
%%
TU2 = tile_trapezoid(V5*diag([1,-1,1]),V4*diag([-1,1,1]),V4,V5,tile_edge);
TU = sc_append(TU,TU2,[1,1,1]);
TU.name = sprintf('Turtle %.0f^o', inc);
