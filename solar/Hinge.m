function HI = Hinge(SC, axis_l, axis_r, range, detente)
% HI = Hinge(SC, axis_l, axis_r, range, detente);
% SC: Existing tile set in zero degree position
% axis_l: [x,y,z] location of left end of hinge
% axis_r: [x,y,z] location of right end of hinge
% range: [min,max] allowed range of motion
%
% Creates a hinged articulated panel
% Assumption is that the panel is flat with all tiles having the same
% normal vector.
% SC must not already contain articulations
HI = SC;
rt = axis_r - axis_l;
rt = rt/norm(rt);
normal = SC.tilepos(1,4:6);
u = cross(normal, rt);
HI.hinge = struct( ...
    'o', axis_l, 'r', rt, 'n', normal, 'u', u, ...
    'range', range, 'detente', detente,...
    'tile1', 1, 'ntiles', size(HI.tilepos,1), ...
    'raw', HI, 'articulate', @articulate);

function HI = articulate(HI, H, azi, ele)
% HI = articulate(HI, H, azi, ele);
% Given azi, ele, calculate sun vector S. Project onto the u-n plane
% and normalize (Spn) Spn dot u is cos(theta), where theta is the angle
% from u to Spn in (-1,1). theta = acosd(spn dot u). The angle we want is
% how far to rotate the panel to minimize the angle from normal, so
% phi = 90-theta.
%
% absolute x,y,z coordinates need to be:
%  translated to move the hinge origin on the origin
%  rotated around the hinge axis (mapping r to r and n and u onto rotated
%  versions.
% directional vectors (normal) just need to be rotated
[sx,sy,sz] = sph2cart(degtorad(-azi), degtorad(ele), 1);
S = [sx,sy,sz];
if ele > 0
    Sp = S - sum(S.*H.r)*H.r;
    Lsp = norm(Sp);
    if Lsp > 0
        Spn = Sp/Lsp;
        phi = 90 - acosd(sum(Spn .* H.u));
    end
else
    Lsp = 0;
end
if Lsp == 0
    phi = H.detente;
end
rot = [H.u',H.n',H.r'];
rot1 = [ ...
    cosd(phi) -sind(phi) 0
    sind(phi) cosd(phi) 0
    0         0         1];
rot2 = rot * rot1 * rot';
Stiles = 1:H.ntiles;
Dtiles = H.tile1 - 1 + Stiles;
P0 = ones(H.ntiles,1)*H.o;
HI.tilepos(Dtiles,1:3) = ...
    (H.raw.tilepos(:,1:3) - P0)*rot2+P0;
HI.tilepos(Dtiles,4:6) = ...
    H.raw.tilepos(:,4:6)*rot2;
HI.ul(Dtiles,:) = (H.raw.ul - P0)*rot2 + P0;
HI.ur(Dtiles,:) = (H.raw.ur - P0)*rot2 + P0;
HI.ll(Dtiles,:) = (H.raw.ll - P0)*rot2 + P0;
HI.lr(Dtiles,:) = (H.raw.lr - P0)*rot2 + P0;
