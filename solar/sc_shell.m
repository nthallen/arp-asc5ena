function SC = sc_shell(SC)
a = SC.a - SC.tile_edge/8;
b = SC.b - SC.tile_edge/8;
c = SC.c - SC.tile_edge/8;
if ~isfield(SC, 'shell')
    %% (x/a)^2 + (y/b)^2 + (z/c)^2 = 1, z >= 0
    %   z = fz_of_xy(x,y) ...
    fz_of_xy = @(x,y) c * sqrt(1 - x.^2/a^2 - y.^2/b^2);
    
    %% Calculate path and distance from (0,b,0) to (0,0,c)
    %  parametrize by y: b -> 0
    fxyz_of_y = @(y) [ 0*y y fz_of_xy(0,y) ];
    [xyz1, d1] = path_length(fxyz_of_y, b, 0);
    
    %%
    nrows = floor(d1(end)/(SC.tile_edge/2));
    fprintf(1, 'Will use %d rows. Total cord length %.2f m\n', nrows, d1(end));
    % First row based at d = 0, centered at d = .5*tile_edge,
    %   counted at d = tile_edge
    %
    %% For each row (1, ...)
    % Determine y where d = tile_edge*row
    % Calculate z_i = f(0,y);
    full_rows = 0:nrows;
    row_height = d1(end)/nrows;
    row_z = interp1(d1,xyz1(:,3),full_rows*row_height);
    row_z(end) = c;
    %% Parametrize level curve where z = row_topz(row) (for full rotation)
    % This defines an ellipse in x,y with semi minor radii
    %    a*[1-(z/c)^2]
    %    b*[1-(z/c)^2]
    fx_of_yz = @(y,z) a * sqrt(max([(0*y) (1 - y.^2/b^2 - z.^2/c^2)],[],2));
    % fx_of_yz = @(y,z) a * sqrt(1 - y.^2/b^2 - z.^2/c^2);
    %%
    % Calculate path and distance:
    fxyz_of_yz = @(y) [fx_of_yz(y,0), y, 0*y];
    
    [xyz2, d2] = path_length(fxyz_of_yz, 0, b);
    if ~isreal(xyz2)
        error('huarp:complex', 'complex path at row 0');
    end
    ncols = floor(d2(end)/(SC.tile_edge/2));
    X = zeros(nrows+1,ncols+1);
    Y = zeros(nrows+1,ncols+1);
    Z = zeros(nrows+1,ncols+1);
    %%
    for row = 0:nrows-1
        z1 = row_z(row+1);
        fxyz_of_yz = @(y) [fx_of_yz(y,z1), y, z1*y];
        y1 = b*sqrt(max([0 1-(z1/c).^2]));
        [xyz2,d2] = path_length(fxyz_of_yz, 0, y1);
        col_width = d2(end)/ncols;
        Y(row+1,:) = interp1(d2,xyz2(:,2),(0:ncols)*col_width);
        Y(row+1,end) = y1;
        X(row+1,:) = fx_of_yz(Y(row+1,:)',z1)';
        Z(row+1,:) = z1;
    end
    X(end,:) = 0;
    Y(end,:) = 0;
    Z(end,:) = c;
    %%
    X = [X,-fliplr(X(:,2:end))];
    Y = [Y,fliplr(Y(:,2:end))];
    Z = [Z,fliplr(Z(:,2:end))];
    %%
    X = [X,fliplr(X(:,2:end))];
    Y = [Y,-fliplr(Y(:,2:end))];
    Z = [Z,fliplr(Z(:,2:end))];
    SC.shell = struct('X',X,'Y',Y,'Z',Z);
else
    X = SC.shell.X;
    Y = SC.shell.Y;
    Z = SC.shell.Z;
end
%%
% surf(ax, X,Y,Z,-1+0*X,'EdgeColor','none');
