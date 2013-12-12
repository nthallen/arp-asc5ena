%%
a = 2.5; b = 2.5; h = 3;
tile_edge = 0.95; % .127;
FP = FlatPanel(a,b,tile_edge);
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
FPH.name = sprintf('%d x %d x %d Flat Panel with %d Hinged Sides', ...
    a*2, b*2, h, length(FPH.hinge));
%%
FPH.solar_cell_efficiency = .20;
FPH.name = sprintf('%d x %d x %d Flat Panel with %d Hinged Sides, %d%% eff', ...
    a*2, b*2, h, length(FPH.hinge), round(FPH.solar_cell_efficiency*100));
%%
sc_group(FPH);
%%
sc_summary(FPH,5,21);
%%
S = sc_rotation(FPH,40, -104,2014,5,21);
%%
[tm,W,dt,SolAzi,SolEle,W_by_tile] = sc_day(FPH, 45, 40, -104, 2014, 5, 21);
%%
plot(tm,W*1e-3);
title(sprintf('%s: 40N 5/21',FPH.name));
xlabel('Hour UTC');
ylabel('KW generated');
%%
[tmFP,WFP,dtFP,SolAziFP,SolEleFP,W_by_tileFP] = sc_day(FP, 0, 40, -104, 2014, 5, 21);
%%
figure; plot(tmFP,WFP*1e-3);
%%
hr = tm/3600;
WH = W-WFP;
figure; plot(hr,W*1e-3,hr,WH*1e-3,hr,WFP*1e-3);
legend('Total','Hinged Panels','Flat Panel');
title(sprintf('%s: 40N 5/21',FPH.name));
xlabel('Hour UTC');
ylabel('KW generated');
