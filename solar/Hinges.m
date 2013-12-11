%%
a = 2.5; b = 2.5; h = 3;
tile_edge = 0.95; % .127;
FP = FlatPanel(a,b,tile_edge);
ul = [-a,-b,0]; ur = [a,-b,0]; ll = [-a,-b-h,0]; lr = [a,-b-h,0];
TZ = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI = Hinge(TZ, ul, ur, [-90 90], -90);
FPH = sc_append(FP,HI,[1,1,1]);
FPH = sc_append(FPH,HI,[-1,-1,1]);
%%
ul = [-a,b,0]; ur = [-a,-b,0]; ll = [-a-h,b,0]; lr = [-a-h,-b,0];
TZ2 = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI2 = Hinge(TZ2, ul, ur, [-90 90], -90);
FPH = sc_append(FPH,HI2,[1,1,1]);
FPH = sc_append(FPH,HI2,[-1,-1,1]);
FPH.zlim = [-3,4];
FPH.ylim = [-6.5,6.5];
FPH.xlim = [-7,7];
FPH.name = sprintf('%d x %d x %d Flat Panel with Hinged Sides', a*2, b*2, h);
%%
sc_group(FPH);
