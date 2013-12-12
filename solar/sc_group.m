function sc_group(SC)
% sc_group(SC);
% summary graph for flat panels (insensitive to rotation) so displaying
% only minimum power values over latitudes and dates
%%
LL = [ 34.4, -104
       40,   -104
       45,   -104
       49,   -104];
mdy = [
    3,21,2014
    4,21,2014
    5,21,2014
    6,21,2014];

nlats = size(LL,1);
ndates = size(mdy,1);

minWHr = zeros(nlats,ndates);
maxWHr = zeros(nlats,ndates);
idealWHr = zeros(nlats,ndates);
totalArea = size(SC.tilepos,1)*SC.tile_edge^2;
for li = 1:nlats
    for di = 1:ndates
        S = sc_rotation(SC, LL(li,1), LL(li,2), ...
            mdy(di,3), mdy(di,1), mdy(di,2));
        delete(S.figures);
        minWHr(li,di) = S.minWHr;
        maxWHr(li,di) = S.maxWHr;
        idealWHr(li,di) = sum(any(S.WM'>0))*S.dt*1300*.2*totalArea;
    end
end
%%
TL = cell(nlats,1);
for li = 1:nlats
    TL{li} = sprintf('%dN', floor(LL(li,1)));
end
Lgnd = cell(ndates,1);
for di = 1:ndates
    Lgnd{di} = sprintf('%d/%d', mdy(di,1), mdy(di,2));
end
%%
figure;
b1 = bar(maxWHr'*1e-3);
hold on; 
b2 = bar(minWHr'*1e-3);
set(b2,'BarWidth',.3);
ylabel('KWhr/Day');
set(gca,'XTickLabel',Lgnd);
legend(TL{:},'location','southeast');
title(sprintf('%s Full Day Power', SC.name));
%%
figure;
plot((minWHr./idealWHr)','*-');
set(gca,'XTick',1:ndates,'XTickLabel',Lgnd);
legend(TL{:},'location','southeast');
title(SC.name);
ylabel('Worst Power / Ideal Power');
set(gca,'xlim',[1-.25 ndates+.25]);
xlabel('Date');
