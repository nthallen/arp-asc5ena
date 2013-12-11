%% Basic analysis
FP =  FlatPanel(.6, .6, .5);
FP.name = '1 m^2 Fixed Horizontal Panel';
sc_group(FP);
%%
HI = Hinge(FP, [-.6,0,0], [.6,0,0], [-90,90], -90);
%%
HI.name = '1 m^2 Hinged Panel';
sc_summary(HI,6,21);
sc_summary(HI,5,21);
sc_summary(HI,4,21);
sc_summary(HI,3,21);
%%
a = 0.6; b = 0.6; h = 1.2; tile_edge = 0.5;
ul = [-a,-b,0]; ur = [a,-b,0]; ll = [-a,-b-h,0]; lr = [a,-b-h,0];
TZ = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI2 = Hinge(TZ, ul, ur, [-90 90], -90);
ul = [-a,b,0]; ur = [-a,-b,0]; ll = [-a-h,b,0]; lr = [-a-h,-b,0];
TZ2 = tile_trapezoid(ul, ur, ll, lr, tile_edge);
HI2a = Hinge(TZ2, ul, ur, [-90, 90], -90);
HI2 = sc_append(HI2,HI2a,[1,1,1]);
HI2.name = '2 Hinged m^2 Panels at 90^o Angles';
%%
HI2 = sc_illuminate(HI2,45,45);
sc_draw(HI2);
%%
sc_summary(HI2,6,21);
sc_summary(HI2,5,21);
sc_summary(HI2,4,21);
sc_summary(HI2,3,21);
