#!/bin/sh

sudo -u celery /json_risk_app/jr_start

# workaround to prevent container to exit
tail -f /dev/null
