function sc_summary(SC, mon, day)
% sc_summary(SC, mon, day);
%%
yr = 2014;
% mon = 6;
% day = 21;
name = 'StratoCruiser';
if isfield(SC,'name')
    name = SC.name;
end
%%
S1 = sc_rotation(SC, 34.5, -104, yr, mon, day);
S2 = sc_rotation(SC, 40, -104, yr, mon, day);
S3 = sc_rotation(SC, 49, -104, yr, mon, day);
S4 = sc_rotation(SC, 80, 0, yr, mon, day);
S5 = sc_rotation(SC, 90, 0, yr, mon, day);
Y = [S1.maxWHr, S1.minWHr
     S2.maxWHr, S2.minWHr
     S3.maxWHr, S3.minWHr
     S4.maxWHr, S4.minWHr
     S5.maxWHr, S5.minWHr
    ];
%%
figure;
bar(Y*1e-3);
set(gca,'XTickLabel',{'34N','40N','49N','80N','90N'});
ylabel('KWhr/Day');
legend('best','worst','location','southwest');
title(sprintf('%s Full Day Power: %d/%d/%d', name, mon, day, yr));
delete([S1.figures S2.figures S3.figures S4.figures S5.figures]);
%%
figure;
plot(S1.Inclination,S1.WHr_by_tile,'.', ...
    S2.Inclination,S2.WHr_by_tile,'.', ...
    S3.Inclination,S3.WHr_by_tile,'.', ...
    S4.Inclination,S4.WHr_by_tile,'.', ...
    S5.Inclination,S5.WHr_by_tile,'.');
legend('34N','40N','49N','80N','90N','location','south');
title(sprintf('%s Average Power over all rotations: %d/%d/%d', name, mon, day, yr));
xlabel('Tile Inclination');
ylabel('Average WHr/tile/day');
