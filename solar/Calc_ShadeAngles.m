function ShadeAngles = Calc_ShadeAngles(BalloonHD, LiftTrainMult, PanelRadius)
% ShadeAngles =  Calc_ShadeAngles(BalloonHD, LiftTrainMult, PanelRadius);
% BalloonHD: Balloon Horizontal Diameter, meters (41.55 m)
% LiftTrainMult: Multiplier for length of lift train relative to balloon
%   diameter
% PanelRadius: Half-length of solar panels, meters.
%
% ShadeAngles are sun angles in degrees elevation above the horizon
% ShadeAngles.None: Sun angles below this cast no shadow
% ShadeAngles.Half: This angle shades half the panel
% ShadeAngles.Full: Sun angles above this cast full shadow on the panel
%% Critical angle calculations
if nargin < 3
    BalloonDiameter = 41.55; % meters horizontal diameter
    LiftTrainLength = 2*BalloonDiameter; % 2D
    PanelRadius = 5; % meters
else
    BalloonDiameter = BalloonHD;
    LiftTrainLength = LiftTrainMult * BalloonDiameter;
end

ShadeAngles.None = 90 - atand((BalloonDiameter/2+PanelRadius)/LiftTrainLength);
ShadeAngles.Half = 90 - atand((BalloonDiameter/2)/LiftTrainLength);
ShadeAngles.Full = 90 - atand((BalloonDiameter/2-PanelRadius)/LiftTrainLength);
