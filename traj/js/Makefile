.PHONY : install-rel install-dev

CGIDIR=/var/www/cgi-bin
HTMLBASE=/var/www/html/ASC5ENA

DIST=index.html traj.html resetpw.html
DIST+=model.js draw_map.js model_wind.js sequence.js trajectory_integrate.js
DIST+=USMap.js
DIST+=jquery-1.7.1.min.js raphael.js

DEVDIST=$(DIST) ajax.html

install-dev : $(DEVDIST) local.dev.js
	[ -d $(HTMLBASE).dev ] || mkdir $(HTMLBASE).dev
	cp $(DEVDIST) $(HTMLBASE).dev
	cp local.dev.js $(HTMLBASE).dev/local.js
install-rel : $(DIST) local.rel.js
	[ -d $(HTMLBASE) ] || mkdir $(HTMLBASE)
	cp $(DIST) $(HTMLBASE)
	cp local.rel.js $(HTMLBASE)/local.js
