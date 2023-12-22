#
# store portfolio
#

cat "$JR_ROOT/test/data/portfolio/2023-12-31/Portfolio.json" | gzip -9 | jr_curl 'api/portfolio/2023-12-31/Portfolio' -X POST -H "Content-Encoding: gzip" -H "Content-Type: application/json" --data-binary @- > /dev/null 2>&1

[ -f "$JR_DATADIR/$JR_INSTANCE/portfolio/2023-12-31/Portfolio.json.gz" ] || jr_test_fail

jr_test_succeed
