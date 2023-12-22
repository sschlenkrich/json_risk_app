#
# store run
#

jr_curl 'api/runs/TEST_RUN' -X POST --data @- < "$JR_ROOT/test/data/runs/run.json" > /dev/null 2>&1

[ -f "$JR_DATADIR/$JR_INSTANCE/runs/TEST_RUN.json" ] || jr_test_fail

$JR_ROOT/jr_run $JR_INSTANCE TEST_RUN

RETVAL=$?

[ $RETVAL -eq 0 ] || jr_test_fail

jr_test_succeed
