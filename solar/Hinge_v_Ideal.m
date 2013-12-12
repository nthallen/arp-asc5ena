%%
a = 2.5; b = 2.5; h = 3;
tile_edge = 0.95; % .127;
ul = [-a,-b,0]; ur = [a,-b,0]; ll = [-a,-b-h,0]; lr = [a,-b-h,0];
TZ = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI = Hinge(TZ, ul, ur, [-90 90], -90);
% FPH = sc_append(FP,HI,[1,1,1]);
% FPH = sc_append(FPH,HI,[-1,-1,1]);
FPH = HI;
%%
ul = [-a,b,0]; ur = [-a,-b,0]; ll = [-a-h,b,0]; lr = [-a-h,-b,0];
TZ2 = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI2 = Hinge(TZ2, ul, ur, [-90 90], -90);
FPH = sc_append(FPH,HI2,[1,1,1]);
%FPH = sc_append(FPH,HI2,[-1,-1,1]);
FPH.zlim = [-3,4];
FPH.ylim = [-6.5,6.5];
FPH.xlim = [-7,7];
if a == b
    FPH.name = sprintf('%d Hinged Panels, %dx%d', ...
        length(FPH.hinge), 2*a, h);
else
    FPH.name = sprintf('%d Hinged Panels, %dx%d and %dx%d', ...
        length(FPH.hinge), 2*a, h, 2*b, h);
end
%%
FPH.solar_cell_efficiency = .20;
FPH.name = sprintf('%s, %d%% eff', ...
    FPH.name, round(FPH.solar_cell_efficiency*100));
%%
sc_group(FPH);
