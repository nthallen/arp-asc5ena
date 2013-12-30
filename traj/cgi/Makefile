.PHONY : install-rel install-dev

DIST=ARMTime.pm model_initialize model_wind_field ModelDefs.pm
DEST=/var/www/cgi-bin

install-dev : $(DIST) ASC5ENA.pl
	cp $(DIST) $(DEST)
	cp ASC5ENA.pl $(DEST)/ASC5ENA.dev.pl
install-rel : $(DIST) ASC5ENA.pl
	cp $(DIST) ASC5ENA.pl $(DEST)
	rm -f $(DEST)/ASC5ENA_login.pl
