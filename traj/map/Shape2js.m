%% Read in the state boundaries, but exclude HI, AK, USVI, PR and DC
S = shaperead('statesp020.shp','Selector', ...
    { @(order_adm) (order_adm > 0) && (order_adm < 49), ...
      'ORDER_ADM'});
%%
fp = fopen('USMap.js','w');
%%
fprintf(fp,'var Map = [\n');
for i=1:length(S)
    %%
    fprintf(fp,'{\nBoundingBox: [ %.4f, %.4f, %.4f, %.4f ],\n', ...
        S(i).BoundingBox);
    fprintf(fp,'X: [ ');
    fprintf(fp,'%.4f,\n', S(i).X(1:end-2));
    fprintf(fp,'%.4f ],\n', S(i).X(end-1));
    fprintf(fp,'Y: [ ');
    fprintf(fp,'%.4f,\n', S(i).Y(1:end-2));
    fprintf(fp,'%.4f ]\n}', S(i).Y(end-1));
    if i < length(S)
        fprintf(fp,',');
    end
    fprintf(fp,'\n');
end
fprintf(fp,']\n');
fclose(fp);

