#
# test user management
#


#
# test password authentication
#
curl "http://127.0.0.1:$JR_PORT/api/user/token" -X POST -F "sub=$TEST_USER" -F "pwd=$TEST_PASSWORD" -F "ins=$JR_INSTANCE"
TEMP_TOKEN=$(curl "http://127.0.0.1:$JR_PORT/api/user/token" -X POST -F "sub=$TEST_USER" -F "pwd=$TEST_PASSWORD" -F "ins=$JR_INSTANCE" -v 2>&1 | grep access_token| cut -d ':' -f 2| cut -d '=' -f 2 | cut -d ';' -f 1)

[ -z "$TEMP_TOKEN" ] && jr_test_fail

#
# test user update
#
{
cat << EOF
{
"sub": "$TEST_USER",
"per": "rwxu",
"ema": "test@test.org",
"locked": false
}
EOF
}| curl "http://127.0.0.1:$JR_PORT/api/user/mgmt" -X POST -H "Authorization: Bearer $TEMP_TOKEN" --data @- > /dev/null 2>&1

#
# obtain new token with new permissions
#

TEMP_TOKEN=$(curl "http://127.0.0.1:$JR_PORT/api/user/token" -X POST -F "sub=$TEST_USER" -F "pwd=$TEST_PASSWORD" -F "ins=$JR_INSTANCE" -v 2>&1 | grep access_token| cut -d ':' -f 2| cut -d '=' -f 2 | cut -d ';' -f 1)

[ -z "$TEMP_TOKEN" ] && jr_test_fail

#
# Test read access with new token
#
PORTFOLIO_NAME=$RANDOM
mkdir -p "$JR_DATADIR/$JR_INSTANCE/portfolio/2023-12-31/"

{
cat << EOF
]{
"id": "TEST_ID"
}]
EOF
} | gzip -9 > "$JR_DATADIR/$JR_INSTANCE/portfolio/2023-12-31/$PORTFOLIO_NAME.json.gz"


curl "http://127.0.0.1:$JR_PORT/api/portfolio/2023-12-31/$PORTFOLIO_NAME" --fail -H "Authorization: Bearer $TEMP_TOKEN"  > /dev/null 2>&1 || jr_test_fail

jr_test_succeed
