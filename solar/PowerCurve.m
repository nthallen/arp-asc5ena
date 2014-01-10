%%
rho = 0.091; % kg/m^3
Balloon_Area = 984.9; % m^2
Gondola_Area = 7.67; % m^2
Gondola_CD = 1.2;
Thrust_Safety = 1.2;
Propeller_Efficiency = 0.5;
V = 0:.1:8;
Vd = V;
Vd(V<5) = 5;
Balloon_CD = interp1([5 8],[0.1 0.14],Vd);
Balloon_Drag = 0.5 * rho * Vd.^2 .* Balloon_CD * Balloon_Area;
Gondola_Drag = 0.5 * rho * Vd.^2 * Gondola_CD * Gondola_Area;
% Tether_Drag...
Power = Thrust_Safety * (Balloon_Drag + Gondola_Drag) .* ...
    V / Propeller_Efficiency;
figure;
plot(V,Power);
