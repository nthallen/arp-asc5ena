function sc_check(SC)
% sc_check(SC)
%%
ulr = sum((SC.ul * (diag([SC.a SC.b SC.c].^(-1)))).^2,2)-1;
urr = sum((SC.ur * (diag([SC.a SC.b SC.c].^(-1)))).^2,2)-1;
llr = sum((SC.ll * (diag([SC.a SC.b SC.c].^(-1)))).^2,2)-1;
lrr = sum((SC.lr * (diag([SC.a SC.b SC.c].^(-1)))).^2,2)-1;
ctr = sum((SC.tilepos(:,1:3) * (diag([SC.a SC.b SC.c].^(-1)))).^2,2)-1;
x = 1:length(ulr);
figure;
plot(x,ulr,x,urr,x,llr,x,lrr,x,ctr);
legend('ul','ur','ll','lr','ctr');

%% Display distribution of the errors
figure;
scatter(SC.tilepos(:,1),SC.tilepos(:,2),6,ulr,'filled');
title('ulr');

%% Display distribution of the errors
figure;
scatter(SC.tilepos(:,1),SC.tilepos(:,2),6,llr,'filled');
colorbar;
title('llr');

%% Let's see how much the 'up' vectors deviate from perpendicular
dv = sum((SC.ul-SC.ll) .* SC.tilepos(:,4:6),2)/2;
dh = sum((SC.lr-SC.ll) .* SC.tilepos(:,4:6),2)/2;
x = 1:length(dv);
figure;
plot(x,dv,x,dh);
legend('dv','dh');

%% Now let's explore the function value along the putative tangents
% vertical:
row = floor(max(SC.rownum)/2);
tiles = find(SC.rownum == row);
range = (-50:50)' * (2.5/SC.tile_edge) / 50;
nrange = length(range);
vrange = ones(nrange,1);
ntiles = length(tiles);
up = (SC.ur(tiles,:) - SC.lr(tiles,:));
curves = zeros(nrange, ntiles);
for i = 1:ntiles
    tangent = (ones(nrange,1) * SC.tilepos(tiles(i),1:3)) + ...
        (range * ones(1,3)) .* (ones(nrange,1) * up(i,:));
    curves(:,i) = sum((tangent ./ (vrange * [SC.a,SC.b,SC.c])).^2,2)-1;
end
figure;
plot(range, curves);

%% Now let's explore the function value along the putative tangents
rt = (SC.ur(tiles,:) - SC.ul(tiles,:));
hcurves = zeros(nrange, ntiles);
for i = 1:ntiles
    htangent = (ones(nrange,1) * SC.tilepos(tiles(i),1:3)) + ...
        ((range * ones(1,3)) .* (ones(nrange,1) * rt(i,:)));
    hcurves(:,i) = sum((tangent ./ (vrange * [SC.a,SC.b,SC.c])).^2,2)-1;
end
figure;
plot(range, hcurves);
