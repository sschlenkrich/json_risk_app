files = jr_* README.md www res docs

all: release 

release: tgz tbz zip

tgz:
	rm -f jr.tar.gz
	tar --owner=0 --group=0 -cz --exclude='www/assets/*/*.gz' -f jr.tar.gz $(files) 

tbz:
	rm -f jr.tar.bz
	tar --owner=0 --group=0 -cj --exclude='www/assets/*/*.gz' -f jr.tar.bz2 $(files)

zip:
	rm -f jr.zip
	zip -9 -qr jr.zip $(files) -x 'www/assets/*/*.gz'

.PHONY: clean
clean:
	rm -f jr.tar.gz jr.tar.bz2 jr.zip
