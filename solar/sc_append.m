function SC = sc_append(SC, SC2, reflect)
% SC = sc_append(SC, SC2, reflect);
%%
ref = diag(reflect);
ref6 = diag([reflect,reflect]);
%%
tile1 = size(SC.tilepos,1)+1;
SC.tilepos = [ SC.tilepos; SC2.tilepos * ref6 ];
SC.ul = [ SC.ul; SC2.ul * ref ];
SC.ur = [ SC.ur; SC2.ur * ref ];
SC.ll = [ SC.ll; SC2.ll * ref ];
SC.lr = [ SC.lr; SC2.lr * ref ];
if isfield(SC2,'hinge')
    assert(length(SC2.hinge)==1, 'Cannot currently append multiple hinges');
    H2 = SC2.hinge;
    if isfield(SC,'hinge')
        H1 = SC.hinge;
    else
        H1 = [];
    end
    H2.o = H2.o * ref;
    H2.r = H2.r * ref;
    H2.n = H2.n * ref;
    H2.u = H2.u * ref;
    H2.raw.tilepos = H2.raw.tilepos * ref6;
    H2.raw.ul = H2.raw.ul * ref;
    H2.raw.ur = H2.raw.ur * ref;
    H2.raw.ll = H2.raw.ll * ref;
    H2.raw.lr = H2.raw.lr * ref;
    H2.tile1 = tile1;
    SC.hinge = [H1; H2];
end
