#
# store modules on file system
#

mkdir -p "$JR_DATADIR/$JR_INSTANCE/modules"
cp "$JR_ROOT/test/data/modules/"*.js "$JR_DATADIR/$JR_INSTANCE/modules"

jr_test_succeed
