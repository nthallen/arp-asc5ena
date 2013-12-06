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