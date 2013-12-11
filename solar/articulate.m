%% To support an articulated panel
% Panel has a predefined range of motion
% Add a hook in sc_illuminate to determine the correct orientation
% as a function of azi, ele (where azi already has the platform's
% direction accounted for).
% To accomodate multiple articulated panels on a platform, additional
% structures need to be added to the platform defining how each panel
% is to be articulated.

%% Hinged panel (one degree of freedom)
% Need to identify the hinge origin and direction vectors, plus
% the n,r, and u vectors (normal, right, up) for the zero degree position.
% Also define the allowed range of motion and the detente position
% Note that the hinge direction and the right vector are the same.
%
% Given azi, ele, calculate sun vector S. Project onto the u-n plane
% and normalize (Spn) Spn dot u is cos(theta), where theta is the angle
% from u to Spn in (-1,1). theta = acosd(spn dot u). The angle we want is
% how far to rotate the panel to minimize the angle from normal, so
% phi = 90-theta. If the panel is already in position phi0, then the
% adjustment is just phi-phi0.
%
% absolute x,y,z coordinates need to be:
%  translated to move the hinge origin on the origin
%  rotated around the hinge axis (mapping r to r and n and u onto rotated
%  versions.
% directional vectors (normal) just need to be rotated