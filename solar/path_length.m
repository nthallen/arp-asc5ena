function [xyz, d, tout] = path_length(f, t0, t1, tol)
% [xyx,d [,t]] = path_length(f, t0, t1);
% Calculates suitable mesh points for a good approximation
% to a path along curve defined by f(t).
% f is a function reference returning a triple [x y z].

if nargin < 4
    tol = 1.001;
end

if t0 == t1
    t = t0;
    d = 0;
    xyz = f(t0);
else
    t2 = (t0+t1)/2;
    t = [t0; t2; t1];
    p = f([t0;t2;t1]);
    if ~isreal(p)
        error('huarp:complex', ...
            'Complex path in path_length: %.2f %.2f %.2f',...
            t0, t2, t1);
    end
    d01 = norm(p(3,:)-p(1,:));
    d02 = norm(p(2,:)-p(1,:));
    d21 = norm(p(3,:)-p(2,:));
    d01a = d02+d21;
    if d01a/d01 < tol
        d = [ 0; d02; d01a];
        xyz = p;
    else
        [xyza,da,ta] = path_length(f, t0, t2, tol);
        [xyzb,db,tb] = path_length(f, t2, t1, tol);
        t = [ ta; tb(2:end) ];
        d = [ da; da(end) + db(2:end) ];
        xyz = [xyza; xyzb(2:end,:)];
    end
end

if nargout > 2
    tout = t;
end
