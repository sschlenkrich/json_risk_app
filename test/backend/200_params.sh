#
# store portfolio
#

jr_curl 'api/params' -X POST -F "file=@$JR_ROOT/test/data/params/params.json" -F "name=BASE"  > /dev/null 2>&1

[ -f "$JR_DATADIR/$JR_INSTANCE/params/2023-12-31_BASE.json" ] || jr_test_fail

jr_test_succeed
