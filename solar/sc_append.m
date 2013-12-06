function SC = sc_append(SC, SC2, reflect)
% SC = sc_append(SC, SC2, reflect);
%%
ref = diag(reflect);
ref6 = diag([reflect,reflect]);
%%
SC.tilepos = [ SC.tilepos; SC2.tilepos * ref6 ];
SC.ul = [ SC.ul; SC2.ul * ref ];
SC.ur = [ SC.ur; SC2.ur * ref ];
SC.ll = [ SC.ll; SC2.ll * ref ];
SC.lr = [ SC.lr; SC2.lr * ref ];
