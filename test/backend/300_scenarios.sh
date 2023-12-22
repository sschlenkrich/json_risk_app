#
# store scenarios
#

for s in IR_Sensitivities Vola_Sensitivities;do
	jr_curl 'api/scenarios' -X POST -F "file=@$JR_ROOT/test/data/scenarios/$s.json" -F "name=$s"  > /dev/null 2>&1
	[ -f "$JR_DATADIR/$JR_INSTANCE/scenarios/$s.json" ] || jr_test_fail
done

jr_test_succeed
