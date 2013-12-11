function [f, ax_out] = sc_draw(SC)
ntiles = size(SC.tilepos,1);
f = figure;
ax = axes;
for i=1:ntiles
    draw_panel(ax, SC.ul(i,:), SC.ur(i,:), SC.ll(i,:), SC.lr(i,:), SC.illum(i));
    hold(ax,'on');
end
shading(ax, 'flat');
set(ax,'dataaspectratio',[1 1 1]);
if isfield(SC,'shell')
    surf(ax, SC.shell.X,SC.shell.Y,SC.shell.Z,-1+0*SC.shell.X, ...
        'EdgeColor','none');
end
if nargout > 1
    ax_out = ax;
end
if isfield(SC,'solar') && SC.solar.ele > 0
    % I use negative azimuth here because sph2cart uses angles running
    % counter clockwise, but we'd like them going clockwise. N is along
    % the X axis
    [sx,sy,sz] = sph2cart(degtorad(-SC.solar.azi), degtorad(SC.solar.ele), 4);
    plot3(ax,[0,sx],[0,sy],[0,sz],'r');
end
if isfield(SC,'xlim')
    set(ax,'xlim',SC.xlim);
end
if isfield(SC,'ylim')
    set(ax,'ylim',SC.ylim);
end
if isfield(SC,'zlim')
    set(ax,'zlim',SC.zlim);
end
if isfield(SC,'view')
    view(ax, SC.view(1), SC.view(2));
end
